// notification.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/db";


export type NotificationType = "SUBMIT" | "APPROVE" | "REJECT" | "SYSTEM";
export type ReferenceType =
    | "SALE_ORDER"
    | "AR_INVOICE"
    | "AR_RECEIPT"
    | "PURCHASE_ORDER"
    | "AP_INVOICE"
    | "AP_PAYMENT"
    | "LEAD";

interface NotificationAttributes {
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
    created_at?: Date;
    updated_at?: Date;
}

interface NotificationCreationAttributes
    extends Optional<NotificationAttributes, "id" | "is_read" | "created_at" | "updated_at"> { }

export class Notification
    extends Model<NotificationAttributes, NotificationCreationAttributes>
    implements NotificationAttributes {
    public id!: number;
    public user_id!: number;
    public type!: NotificationType;
    public title!: string;
    public message!: string;
    public reference_type!: ReferenceType;
    public reference_id!: number;
    public reference_no?: string;
    public url?: string;
    public is_read!: boolean;
    public branch_id!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("SUBMIT", "APPROVE", "REJECT", "SYSTEM"),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        reference_type: {
            type: DataTypes.ENUM(
                "SALE_ORDER",
                "AR_INVOICE",
                "AR_RECEIPT",
                "PURCHASE_ORDER",
                "AP_INVOICE",
                "AP_PAYMENT",
                "LEAD"
            ),
            allowNull: false,
        },
        reference_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        reference_no: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        branch_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "notifications",
        underscored: true,
        timestamps: true,
    }
);
