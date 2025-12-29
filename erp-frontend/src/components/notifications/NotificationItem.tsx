// NotificationItem.tsx
import React from "react";
import { Notification } from "../../types/notification.types";
import { CheckCircle, XCircle, Send, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: number) => void;
    onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onClose,
}) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (notification.type) {
            case "SUBMIT":
                return <Send className="w-5 h-5 text-blue-500" />;
            case "APPROVE":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "REJECT":
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getBgColor = () => {
        if (!notification.is_read) {
            return "bg-blue-50 hover:bg-blue-100";
        }
        return "bg-white hover:bg-gray-50";
    };

    const handleClick = () => {
        // Đánh dấu đã đọc
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }

        // Điều hướng đến trang chi tiết
        if (notification.url) {
            navigate(notification.url);
            onClose();
        }
    };

    const getRelativeTime = () => {
        try {
            return formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: vi,
            });
        } catch {
            return "";
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`${getBgColor()} p-3 border-b border-gray-100 cursor-pointer transition-colors`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">{getIcon()}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                        </p>
                        {!notification.is_read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
                        {notification.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        {notification.reference_no && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {notification.reference_no}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">{getRelativeTime()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
