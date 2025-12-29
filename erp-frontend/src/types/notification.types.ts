// notification.types.ts
export type NotificationType = "SUBMIT" | "APPROVE" | "REJECT";

export type ReferenceType =
    | "SALE_ORDER"
    | "AR_INVOICE"
    | "AR_RECEIPT"
    | "PURCHASE_ORDER"
    | "AP_INVOICE"
    | "AP_PAYMENT";

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    reference_type: ReferenceType;
    reference_id: number;
    reference_no?: string;
    url?: string;
    is_read: boolean;
    branch_id: number;
    created_at: string;
    updated_at?: string;
}

export interface NotificationResponse {
    items: Notification[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
