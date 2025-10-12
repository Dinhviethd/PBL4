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
}

export default new NotificationService();