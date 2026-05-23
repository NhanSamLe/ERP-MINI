import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseOrderAttrs {
  id: number;
  branch_id?: number;
  po_no: string;
  supplier_id?: number;
  order_date?: Date;
  status:
    | "draft"
    | "waiting_approval"
    | "confirmed"
    | "partially_received"
    | "completed"
    | "cancelled";
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  description?: string;
  // Phase 1 — new tracking fields
  rfq_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
  discount_percent?: number;
  discount_amount?: number;
  receipt_status?: "pending" | "partial" | "fully_received";
  invoice_status?: "not_invoiced" | "partial" | "invoiced";
  supplier_ref_no?: string | null;
  delivery_address?: string | null;
  expected_delivery_date?: string | null;
  buyer_id?: number | null;
  internal_notes?: string | null;
  supplier_notes?: string | null;
  price_list_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
}

type PurchaseOrderCreation = Optional<PurchaseOrderAttrs, "id" | "status">;

export class PurchaseOrder
  extends Model<PurchaseOrderAttrs, PurchaseOrderCreation>
  implements PurchaseOrderAttrs
{
  public id!: number;
  public branch_id?: number;
  public po_no!: string;
  public supplier_id?: number;
  public order_date?: Date;
  public total_before_tax?: number;
  public total_tax?: number;
  public total_after_tax?: number;
  public status!:
    | "draft"
    | "waiting_approval"
    | "confirmed"
    | "partially_received"
    | "completed"
    | "cancelled";
  public description?: string;
  public rfq_id?: number | null;
  public currency_id?: number | null;
  public exchange_rate?: number;
  public payment_term_id?: number | null;
  public discount_percent?: number;
  public discount_amount?: number;
  public receipt_status?: "pending" | "partial" | "fully_received";
  public invoice_status?: "not_invoiced" | "partial" | "invoiced";
  public supplier_ref_no?: string | null;
  public delivery_address?: string | null;
  public expected_delivery_date?: string | null;
  public buyer_id?: number | null;
  public internal_notes?: string | null;
  public supplier_notes?: string | null;
  public price_list_id?: number | null;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
}

PurchaseOrder.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT },
    po_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.BIGINT },
    order_date: { type: DataTypes.DATE },
    total_before_tax: { type: DataTypes.DECIMAL(18, 2) },
    total_tax: { type: DataTypes.DECIMAL(18, 2) },
    total_after_tax: { type: DataTypes.DECIMAL(18, 2) },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "waiting_approval",
        "confirmed",
        "partially_received",
        "completed",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    rfq_id: { type: DataTypes.BIGINT, allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    },
    payment_term_id: { type: DataTypes.BIGINT, allowNull: true },
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
    receipt_status: {
      type: DataTypes.ENUM("pending", "partial", "fully_received"),
      allowNull: false,
      defaultValue: "pending",
    },
    invoice_status: {
      type: DataTypes.ENUM("not_invoiced", "partial", "invoiced"),
      allowNull: false,
      defaultValue: "not_invoiced",
    },
    supplier_ref_no: { type: DataTypes.STRING(100), allowNull: true },
    delivery_address: { type: DataTypes.TEXT, allowNull: true },
    expected_delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
    buyer_id: { type: DataTypes.BIGINT, allowNull: true },
    internal_notes: { type: DataTypes.TEXT, allowNull: true },
    supplier_notes: { type: DataTypes.TEXT, allowNull: true },
    price_list_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
