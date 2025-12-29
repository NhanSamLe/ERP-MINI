// notification.controller.ts
import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

export const notificationController = {
    /**
     * GET /api/notifications
     * Lấy danh sách thông báo của user
     */
    async getNotifications(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.page_size) || 20;

            const result = await notificationService.getUserNotifications(
                user.id,
                page,
                pageSize
            );

            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },

    /**
     * GET /api/notifications/unread-count
     * Lấy số lượng thông báo chưa đọc
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const count = await notificationService.getUnreadCount(user.id);

            return res.json({ count });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },

    /**
     * PUT /api/notifications/:id/read
     * Đánh dấu thông báo đã đọc
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const notificationId = Number(req.params.id);

            const success = await notificationService.markAsRead(notificationId, user.id);

            if (!success) {
                return res.status(404).json({ message: "Notification not found" });
            }

            return res.json({ message: "Marked as read" });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },

    /**
     * PUT /api/notifications/read-all
     * Đánh dấu tất cả thông báo đã đọc
     */
    async markAllAsRead(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const count = await notificationService.markAllAsRead(user.id);

            return res.json({ message: "All notifications marked as read", count });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },

    /**
     * DELETE /api/notifications/:id
     * Xóa thông báo
     */
    async deleteNotification(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const notificationId = Number(req.params.id);

            const success = await notificationService.deleteNotification(
                notificationId,
                user.id
            );

            if (!success) {
                return res.status(404).json({ message: "Notification not found" });
            }

            return res.json({ message: "Notification deleted" });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    },
};
