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