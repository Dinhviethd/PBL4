import { Request, Response } from "express";
import NotificationService from "../services/notification.service";
import { AppError } from "../utils/error.response";

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId; // userId được set từ authMiddleware
        if (!userId) throw new AppError(401, "Unauthorized");

        const notifications = await NotificationService.getNotifications(userId);
        res.json({
            success: true,
            data: notifications
        });
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(500, "Internal server error");
    }
};

export const markNotificationAsSeen = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new AppError(401, "Unauthorized");

        const notificationId = parseInt(req.params.id);
        if (isNaN(notificationId)) throw new AppError(400, "Invalid notification ID");

        await NotificationService.markAsSeen(notificationId, userId);

        res.json({
            success: true,
            message: "Notification marked as seen"
        });
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError(500, "Internal server error");
    }
};
