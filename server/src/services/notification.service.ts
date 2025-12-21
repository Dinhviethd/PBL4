
import { AppDataSource } from "../configs/database.config";
import { Notification } from "../models/notification.model";
import { Repository, Not } from "typeorm";
import { User } from "../models/users.model";
import { StatusNoti, NotiType, WSMessageType } from "../constants/constants";
import { wsService } from "./websocket.service";

class NotificationService {
    private notificationRepository: Repository<Notification>;
    private userRepository: Repository<User>;

    constructor() {
        this.notificationRepository = AppDataSource.getRepository(Notification);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async getNotifications(userId: number) {
        return await this.notificationRepository
            .createQueryBuilder("notification")
            .where("notification.user_id = :userId", { userId })
            .andWhere("notification.status != :status", { status: "deleted" })
            .orderBy("notification.createdAt", "DESC")
            .getMany();
    }

    async createPasswordChangeNotification(userId: number): Promise<Notification> {
        const user = await this.userRepository.findOne({ where: { idUser: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const now = new Date();
        const formattedTime = now.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const notification = this.notificationRepository.create({
            user_id: user,
            content: `Bạn đã thay đổi mật khẩu vào lúc ${formattedTime}`,
            status: StatusNoti.PENDING,
            type: NotiType.PASSWORD_CHANGE,
            type_id: userId, // Use user ID as type_id for password change notifications
        });

        const savedNotification = await this.notificationRepository.save(notification);

        // Gửi thông báo real-time qua WebSocket nếu user đang online
        try {
            const isOnline = wsService.isUserOnline(userId);
            if (isOnline) {
                wsService.sendToUser(userId, {
                    type: 'NOTIFICATION',
                    data: {
                        id: savedNotification.idNotification,
                        content: savedNotification.content,
                        type: savedNotification.type,
                        status: savedNotification.status,
                        createdAt: savedNotification.createdAt
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send real-time notification:', error);
        }

        return savedNotification;
    }

    async createMessageNotification(senderId: number, receiverId: number, messageContent: string, messageId: number): Promise<Notification> {
        // Lấy thông tin người gửi
        const sender = await this.userRepository.findOne({ where: { idUser: senderId } });
        const receiver = await this.userRepository.findOne({ where: { idUser: receiverId } });
        
        if (!sender || !receiver) {
            throw new Error("User not found");
        }

        // Tạo nội dung thông báo
        const truncatedContent = messageContent.length > 50 
            ? messageContent.substring(0, 50) + "..." 
            : messageContent;
        
        const notificationContent = `Tin nhắn từ ${sender.name || sender.email}: "${truncatedContent}"`;

        const notification = this.notificationRepository.create({
            user_id: receiver,
            content: notificationContent,
            status: StatusNoti.PENDING,
            type: NotiType.MESSAGE,
            type_id: messageId, // ID của tin nhắn
        });

        const savedNotification = await this.notificationRepository.save(notification);

        // Gửi thông báo real-time qua WebSocket bất kể online hay offline
        // (WebSocket service sẽ xử lý việc user có online không)
        try {
            wsService.sendToUser(receiverId, {
                type: 'NOTIFICATION',
                data: {
                    id: savedNotification.idNotification,
                    content: savedNotification.content,
                    type: savedNotification.type,
                    status: savedNotification.status,
                    createdAt: savedNotification.createdAt,
                    senderId: senderId,
                    senderName: sender.name || sender.email,
                    messageId: messageId
                }
            });
        } catch (error) {
            console.error('Failed to send real-time notification:', error);
        }

        return savedNotification;
    }
        // Thông báo khi có lời mời vào nhóm (cho user được mời)
    async createGroupInviteNotification(inviterId: number, invitedUserId: number, groupId: number, groupName: string): Promise<Notification> {
        const inviter = await this.userRepository.findOne({ where: { idUser: inviterId } });
        const invitedUser = await this.userRepository.findOne({ where: { idUser: invitedUserId } });
        if (!inviter || !invitedUser) throw new Error("User not found");
        const notificationContent = `Bạn được mời vào nhóm '${groupName}' bởi ${inviter.name || inviter.email}`;
        const notification = this.notificationRepository.create({
            user_id: invitedUser,
            content: notificationContent,
            status: StatusNoti.PENDING,
            type: NotiType.GROUP_INVITE,
            type_id: groupId,
        });
        const savedNotification = await this.notificationRepository.save(notification);
        wsService.sendToUser(invitedUserId, {
            type: 'NOTIFICATION',
            data: {
                id: savedNotification.idNotification,
                content: savedNotification.content,
                type: savedNotification.type,
                status: savedNotification.status,
                createdAt: savedNotification.createdAt,
                inviterId,
                groupId,
                groupName
            }
        });
        return savedNotification;
    }

    // Thông báo cho admin khi có lời mời vào nhóm cần xử lý
    async createGroupInviteAdminNotification(invitedUserId: number, adminId: number, groupId: number, groupName: string): Promise<Notification> {
        const invitedUser = await this.userRepository.findOne({ where: { idUser: invitedUserId } });
        const admin = await this.userRepository.findOne({ where: { idUser: adminId } });
        if (!invitedUser || !admin) throw new Error("User not found");
        const notificationContent = `Có lời mời vào nhóm '${groupName}' cần xử lý cho ${invitedUser.name || invitedUser.email}`;
        const notification = this.notificationRepository.create({
            user_id: admin,
            content: notificationContent,
            status: StatusNoti.PENDING,
            type: NotiType.GROUP_INVITE_ADMIN,
            type_id: groupId,
        });
        const savedNotification = await this.notificationRepository.save(notification);
        wsService.sendToUser(adminId, {
            type: 'NOTIFICATION',
            data: {
                id: savedNotification.idNotification,
                content: savedNotification.content,
                type: savedNotification.type,
                status: savedNotification.status,
                createdAt: savedNotification.createdAt,
                invitedUserId,
                groupId,
                groupName
            }
        });
        return savedNotification;
    }

    // Thông báo khi có thành viên mới tham gia vào nhóm (cho các thành viên khác)
    async createGroupMemberJoinedNotification(newUserId: number, groupId: number, groupName: string, memberIds: number[]): Promise<void> {
        const newUser = await this.userRepository.findOne({ where: { idUser: newUserId } });
        if (!newUser) throw new Error("User not found");
        const notificationContent = `${newUser.name || newUser.email} đã tham gia nhóm '${groupName}'`;
        for (const memberId of memberIds) {
            if (memberId === newUserId) continue;
            const member = await this.userRepository.findOne({ where: { idUser: memberId } });
            if (!member) continue;
            const notification = this.notificationRepository.create({
                user_id: member,
                content: notificationContent,
                status: StatusNoti.PENDING,
                type: NotiType.GROUP_MEMBER_JOINED,
                type_id: groupId,
            });
            const savedNotification = await this.notificationRepository.save(notification);
            wsService.sendToUser(memberId, {
                type: 'NOTIFICATION',
                data: {
                    id: savedNotification.idNotification,
                    content: savedNotification.content,
                    type: savedNotification.type,
                    status: savedNotification.status,
                    createdAt: savedNotification.createdAt,
                    newUserId,
                    groupId,
                    groupName
                }
            });
        }
    }

    // Thông báo khi có người chấp nhận lời mời kết bạn của bạn
    async createFriendAcceptNotification(senderId: number, receiverId: number, friendshipId: number): Promise<Notification> {
        const sender = await this.userRepository.findOne({ where: { idUser: senderId } });
        const receiver = await this.userRepository.findOne({ where: { idUser: receiverId } });
        if (!sender || !receiver) throw new Error("User not found");
        const notificationContent = `${receiver.name || receiver.email} đã chấp nhận lời mời kết bạn của bạn.`;
        const notification = this.notificationRepository.create({
            user_id: sender,
            content: notificationContent,
            status: StatusNoti.PENDING,
            type: NotiType.FRIEND_ACCEPT,
            type_id: friendshipId,
        });
        
        const savedNotification = await this.notificationRepository.save(notification);
        wsService.sendToUser(senderId, {
            type: 'NOTIFICATION',
            data: {
                id: savedNotification.idNotification,
                content: savedNotification.content,
                type: savedNotification.type,
                status: savedNotification.status,
                createdAt: savedNotification.createdAt,
                receiverId,
                friendshipId
            }
        });
        return savedNotification;
    }

    async createFriendRequestNotification(senderId: number, receiverId: number, friendshipId: number): Promise<Notification> {
        // Lấy thông tin người gửi lời mời
        const sender = await this.userRepository.findOne({ where: { idUser: senderId } });
        const receiver = await this.userRepository.findOne({ where: { idUser: receiverId } });
        
        if (!sender || !receiver) {
            throw new Error("User not found");
        }

        const notificationContent = `Bạn có lời mời kết bạn từ ${sender.name || sender.email}`;

        const notification = this.notificationRepository.create({
            user_id: receiver,
            content: notificationContent,
            status: StatusNoti.PENDING,
            type: NotiType.FRIEND_REQUEST,
            type_id: friendshipId, // ID của lời mời kết bạn
        });

        const savedNotification = await this.notificationRepository.save(notification);

        // Gửi thông báo real-time qua WebSocket
        try {
            wsService.sendToUser(receiverId, {
                type: 'NOTIFICATION',
                data: {
                    id: savedNotification.idNotification,
                    content: savedNotification.content,
                    type: savedNotification.type,
                    status: savedNotification.status,
                    createdAt: savedNotification.createdAt,
                    senderId: senderId,
                    senderName: sender.name || sender.email,
                    friendshipId: friendshipId
                }
            });
        } catch (error) {
            console.error('Failed to send real-time friend request notification:', error);
        }

        return savedNotification;
    }

    async markAsSeen(notificationId: number, userId: number): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { idNotification: notificationId },
            relations: ['user_id']
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        // Verify that this notification belongs to the user
        if (notification.user_id.idUser !== userId) {
            throw new Error("Unauthorized");
        }

        // Update status to SEEN
        await this.notificationRepository.update(
            { idNotification: notificationId },
            { status: StatusNoti.SEEN }
        );
    }
}

export default new NotificationService();