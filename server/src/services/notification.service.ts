import { AppDataSource } from "../configs/database.config";
import { Notification } from "../models/notification.model";
import { Repository, Not } from "typeorm";

class NotificationService {
    private notificationRepository: Repository<Notification>;

    constructor() {
        this.notificationRepository = AppDataSource.getRepository(Notification);
    }

    async getNotifications(userId: number) {
        return await this.notificationRepository
            .createQueryBuilder("notification")
            .where("notification.user_id = :userId", { userId })
            .andWhere("notification.status != :status", { status: "deleted" })
            .orderBy("notification.createdAt", "DESC")
            .getMany();
    }
}

export default new NotificationService();