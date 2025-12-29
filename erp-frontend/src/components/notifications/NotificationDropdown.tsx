// NotificationDropdown.tsx
import React from "react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "./NotificationItem";
import { CheckCheck, Loader2 } from "lucide-react";

interface NotificationDropdownProps {
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                    {unreadCount > 0 && (
                        <p className="text-sm text-gray-500">{unreadCount} chưa đọc</p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đọc tất cả
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Không có thông báo mới</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onClose={onClose}
                        />
                    ))
                )}
            </div>

            {/* Footer - có thể thêm "Xem tất cả" nếu cần */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Đóng
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
