// notificationApi.ts
import axiosClient from "./axiosClient";
import { Notification, NotificationResponse } from "../types/notification.types";

export const notificationApi = {
    // Lấy danh sách thông báo
    async getNotifications(page: number = 1, pageSize: number = 20): Promise<NotificationResponse> {
        const response = await axiosClient.get("/notifications", {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    // Lấy số lượng chưa đọc
    async getUnreadCount(): Promise<number> {
        const response = await axiosClient.get("/notifications/unread-count");
        return response.data.count;
    },

    // Đánh dấu đã đọc
    async markAsRead(id: number): Promise<void> {
        await axiosClient.put(`/notifications/${id}/read`);
    },

    // Đánh dấu tất cả đã đọc
    async markAllAsRead(): Promise<void> {
        await axiosClient.put("/notifications/read-all");
    },

    // Xóa thông báo
    async deleteNotification(id: number): Promise<void> {
        await axiosClient.delete(`/notifications/${id}`);
    },
};
