import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { notificationApi } from "../api/notificationApi";
import { Notification } from "../types/notification.types";
import { toast } from "react-toastify";

export const useNotifications = () => {
    const { socket, isConnected } = useWebSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications từ API
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationApi.getNotifications(1, 20);
            setNotifications(response.items);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationApi.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, []);

    // Đánh dấu đã đọc
    const markAsRead = useCallback(async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, []);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("Đã đánh dấu tất cả đã đọc");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Có lỗi xảy ra");
        }
    }, []);

    // Xóa thông báo
    const deleteNotification = useCallback(async (id: number) => {
        try {
            await notificationApi.deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast.success("Đã xóa thông báo");
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Có lỗi xảy ra");
        }
    }, []);

    // Lắng nghe WebSocket events
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Lắng nghe thông báo mới
        socket.on("new_notification", (notification: Notification) => {
            console.log("📬 New notification received:", notification);

            // Thêm vào đầu danh sách
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Hiển thị toast
            toast.info(notification.title, {
                position: "top-right",
                autoClose: 5000,
            });

            // Có thể phát âm thanh ở đây
            // new Audio("/notification-sound.mp3").play();
        });

        return () => {
            socket.off("new_notification");
        };
    }, [socket, isConnected]);

    // Fetch initial data khi component mount
    useEffect(() => {
        if (isConnected) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [isConnected, fetchNotifications, fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
    };
};
