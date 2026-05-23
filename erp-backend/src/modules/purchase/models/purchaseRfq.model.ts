import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type RfqStatus =
  | "draft"
  | "sent"
  | "received"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export type RfqApprovalStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "rejected";

export interface PurchaseRfqAttrs {
  id: number;
  branch_id: number;
  rfq_no: string;
  supplier_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
  rfq_date: string;
  valid_until?: string | null;
  status: RfqStatus;
  approval_status: RfqApprovalStatus;
  version: number;
  parent_id?: number | null;
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  discount_percent: number;
  discount_amount: number;
  supplier_notes?: string | null;
  internal_notes?: string | null;
  buyer_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  sent_at?: Date | null;
  received_at?: Date | null;
}

type PurchaseRfqCreation = Optional<
  PurchaseRfqAttrs,
  | "id"
  | "status"
  | "approval_status"
  | "version"
  | "total_before_tax"
  | "total_tax"
  | "total_after_tax"
  | "discount_percent"
  | "discount_amount"
>;

export class PurchaseRfq
  extends Model<PurchaseRfqAttrs, PurchaseRfqCreation>
  implements PurchaseRfqAttrs
{
  public id!: number;
  public branch_id!: number;
  public rfq_no!: string;
  public supplier_id?: number | null;
  public currency_id?: number | null;
  public exchange_rate?: number;
  public payment_term_id?: number | null;
  public rfq_date!: string;
  public valid_until?: string | null;
  public status!: RfqStatus;
  public approval_status!: RfqApprovalStatus;
  public version!: number;
  public parent_id?: number | null;
  public total_before_tax!: number;
  public total_tax!: number;
  public total_after_tax!: number;
  public discount_percent!: number;
  public discount_amount!: number;
  public supplier_notes?: string | null;
  public internal_notes?: string | null;
  public buyer_id?: number | null;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public sent_at?: Date | null;
  public received_at?: Date | null;
}

PurchaseRfq.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    rfq_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    },
    payment_term_id: { type: DataTypes.BIGINT, allowNull: true },
    rfq_date: { type: DataTypes.DATEONLY, allowNull: false },
    valid_until: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "sent",
        "received",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    parent_id: { type: DataTypes.BIGINT, allowNull: true },
    total_before_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_after_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    supplier_notes: { type: DataTypes.TEXT, allowNull: true },
    internal_notes: { type: DataTypes.TEXT, allowNull: true },
    buyer_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    reject_reason: { type: DataTypes.TEXT, allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    received_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_rfqs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
