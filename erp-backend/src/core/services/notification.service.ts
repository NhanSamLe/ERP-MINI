// notification.service.ts
import { Notification, NotificationType, ReferenceType } from "../models/notification.model";
import { User } from "../../modules/auth/models/user.model";
import { Op } from "sequelize";
import { Server as SocketIOServer } from "socket.io";

/**
 * Mapping role nào có quyền duyệt loại chứng từ nào
 */
const APPROVAL_ROLES: Record<ReferenceType, string[]> = {
    SALE_ORDER: ["SALESMANAGER", "BRANCH_MANAGER", "CEO"],
    AR_INVOICE: ["CHACC", "BRANCH_MANAGER", "CEO"],
    AR_RECEIPT: ["CHACC", "BRANCH_MANAGER", "CEO"],
    PURCHASE_ORDER: ["PURCHASEMANAGER", "BRANCH_MANAGER", "CEO"],
    AP_INVOICE: ["CHACC", "BRANCH_MANAGER", "CEO"],
    AP_PAYMENT: ["CHACC", "BRANCH_MANAGER", "CEO"],
    LEAD: ["SALESMANAGER"], // Just in case
};

/**
 * Mapping reference type sang URL frontend
 */
const REFERENCE_URL_MAP: Record<ReferenceType, (id: number) => string> = {
    SALE_ORDER: (id) => `/sales/orders/${id}`,
    AR_INVOICE: (id) => `/invoices/${id}`,
    AR_RECEIPT: (id) => `/receipts/${id}`,
    PURCHASE_ORDER: (id) => `/purchase-orders/view/${id}`,
    AP_INVOICE: (id) => `/purchase/invoices/${id}`,
    AP_PAYMENT: (id) => `/purchase/payments/${id}`,
    LEAD: (id) => `/crm/leads`,
};

interface CreateNotificationParams {
    type: NotificationType;
    referenceType: ReferenceType;
    referenceId: number;
    referenceNo: string;
    branchId: number;
    submitterId?: number; // ID người gửi (dùng khi approve/reject)
    submitterName?: string; // Tên người gửi
    approverName?: string; // Tên người duyệt
    rejectReason?: string; // Lý do từ chối
    io: SocketIOServer; // Socket.IO instance
}

export const notificationService = {
    /**
     * Tạo và gửi thông báo
     */
    async createNotification(params: CreateNotificationParams): Promise<void> {
        const {
            type,
            referenceType,
            referenceId,
            referenceNo,
            branchId,
            submitterId,
            submitterName,
            approverName,
            rejectReason,
            io,
        } = params;

        const url = REFERENCE_URL_MAP[referenceType](referenceId);
        let recipientIds: number[] = [];
        let title = "";
        let message = "";

        // Xác định người nhận và nội dung thông báo
        switch (type) {
            case "SUBMIT":
                // Gửi cho người submit và các manager có quyền duyệt
                const approverRoles = APPROVAL_ROLES[referenceType];

                // Lấy danh sách users có role phù hợp trong cùng branch
                // Cần include Role để filter theo code
                const { Role } = await import("../../modules/auth/models/role.model");

                const approvers = await User.findAll({
                    where: {
                        branch_id: branchId,
                    },
                    include: [
                        {
                            model: Role,
                            as: "role",
                            where: {
                                code: { [Op.in]: approverRoles },
                            },
                            attributes: [],
                        },
                    ],
                    attributes: ["id"],
                });

                recipientIds = approvers.map((u) => u.id);

                // Thêm người submit vào danh sách nhận (để họ biết đã gửi thành công)
                if (submitterId && !recipientIds.includes(submitterId)) {
                    recipientIds.push(submitterId);
                }

                title = `Chứng từ ${referenceNo} cần duyệt`;
                message = submitterName
                    ? `${submitterName} đã gửi ${this.getDocumentTypeName(referenceType)} ${referenceNo} để duyệt`
                    : `${this.getDocumentTypeName(referenceType)} ${referenceNo} đã được gửi để duyệt`;
                break;

            case "APPROVE":
                // Chỉ gửi cho người submit
                if (submitterId) {
                    recipientIds = [submitterId];
                }

                title = `${referenceNo} đã được duyệt`;
                message = approverName
                    ? `${this.getDocumentTypeName(referenceType)} ${referenceNo} đã được ${approverName} duyệt`
                    : `${this.getDocumentTypeName(referenceType)} ${referenceNo} đã được duyệt`;
                break;

            case "SYSTEM":
                if (submitterId) recipientIds = [submitterId];
                title = `Thông báo hệ thống`;
                message = `${this.getDocumentTypeName(referenceType)}: Thao tác thành công.`;
                if (referenceType === 'LEAD' && referenceNo === 'IMPORT') {
                    title = "Import Lead thành công";
                    message = "Dữ liệu Lead đã được import vào hệ thống.";
                }
                break;

            case "REJECT":
                // Chỉ gửi cho người submit
                if (submitterId) {
                    recipientIds = [submitterId];
                }

                title = `${referenceNo} bị từ chối`;
                message = approverName
                    ? `${this.getDocumentTypeName(referenceType)} ${referenceNo} đã bị ${approverName} từ chối`
                    : `${this.getDocumentTypeName(referenceType)} ${referenceNo} đã bị từ chối`;

                if (rejectReason) {
                    message += `\nLý do: ${rejectReason}`;
                }
                break;
        }

        // Tạo notifications cho tất cả người nhận
        const notifications = await Promise.all(
            recipientIds.map((userId) =>
                Notification.create({
                    user_id: userId,
                    type,
                    title,
                    message,
                    reference_type: referenceType,
                    reference_id: referenceId,
                    reference_no: referenceNo,
                    url,
                    is_read: false,
                    branch_id: branchId,
                })
            )
        );

        // Gửi real-time notification qua WebSocket
        notifications.forEach((notification) => {
            const userRoom = `user:${notification.user_id}`;
            io.to(userRoom).emit("new_notification", {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                reference_type: notification.reference_type,
                reference_id: notification.reference_id,
                reference_no: notification.reference_no,
                url: notification.url,
                is_read: notification.is_read,
                created_at: notification.created_at,
            });
        });
    },

    /**
     * Lấy danh sách thông báo của user
     */
    async getUserNotifications(
        userId: number,
        page: number = 1,
        pageSize: number = 20
    ) {
        const offset = (page - 1) * pageSize;

        const { count, rows } = await Notification.findAndCountAll({
            where: { user_id: userId },
            order: [["created_at", "DESC"]],
            limit: pageSize,
            offset,
        });

        return {
            items: rows,
            total: count,
            page,
            page_size: pageSize,
            total_pages: Math.ceil(count / pageSize),
        };
    },

    /**
     * Đếm số thông báo chưa đọc
     */
    async getUnreadCount(userId: number): Promise<number> {
        return await Notification.count({
            where: {
                user_id: userId,
                is_read: false,
            },
        });
    },

    /**
     * Đánh dấu thông báo đã đọc
     */
    async markAsRead(notificationId: number, userId: number): Promise<boolean> {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                user_id: userId,
            },
        });

        if (!notification) {
            return false;
        }

        await notification.update({ is_read: true });
        return true;
    },

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    async markAllAsRead(userId: number): Promise<number> {
        const [affectedCount] = await Notification.update(
            { is_read: true },
            {
                where: {
                    user_id: userId,
                    is_read: false,
                },
            }
        );

        return affectedCount;
    },

    /**
     * Xóa thông báo
     */
    async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
        const deleted = await Notification.destroy({
            where: {
                id: notificationId,
                user_id: userId,
            },
        });

        return deleted > 0;
    },

    /**
     * Helper: Lấy tên loại chứng từ bằng tiếng Việt
     */
    getDocumentTypeName(referenceType: ReferenceType): string {
        const names: Record<ReferenceType, string> = {
            SALE_ORDER: "Đơn bán hàng",
            AR_INVOICE: "Hóa đơn bán",
            AR_RECEIPT: "Phiếu thu",
            PURCHASE_ORDER: "Đơn mua hàng",
            AP_INVOICE: "Hóa đơn mua",
            AP_PAYMENT: "Phiếu chi",
            LEAD: "Khách hàng tiềm năng",
        };
        return names[referenceType] || referenceType;
    },
};
