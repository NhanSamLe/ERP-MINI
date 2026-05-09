import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SaleOrderAttrs {
  id: number;
  branch_id?: number;
  order_no: string;
  customer_id?: number;
  order_date?: Date;
  status: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  
  // Phase 3 Sales enhancements
  quotation_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
  discount_percent?: number;
  discount_amount?: number;
  delivery_status?: "pending" | "partial" | "delivered";
  invoice_status?: "not_invoiced" | "partial" | "invoiced";
  customer_po_number?: string | null;
  delivery_address?: string | null;
  expected_delivery_date?: string | null;
  sales_person_id?: number | null;
  internal_notes?: string | null;
  customer_notes?: string | null;
}

type SaleOrderCreation = Optional<SaleOrderAttrs, "id" | "status">;

export class SaleOrder extends Model<SaleOrderAttrs, SaleOrderCreation> implements SaleOrderAttrs {
  public id!: number;
  public branch_id?: number;
  public order_no!: string;
  public customer_id?: number;
  public order_date?: Date;
  public approval_status!: "draft" | "waiting_approval" | "approved" | "rejected";
  public status!: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public total_before_tax?: number;
  public total_tax?: number;
  public total_after_tax?: number;

  // Phase 3 Sales enhancements
  public quotation_id?: number | null;
  public currency_id?: number | null;
  public exchange_rate?: number;
  public payment_term_id?: number | null;
  public discount_percent?: number;
  public discount_amount?: number;
  public delivery_status?: "pending" | "partial" | "delivered";
  public invoice_status?: "not_invoiced" | "partial" | "invoiced";
  public customer_po_number?: string | null;
  public delivery_address?: string | null;
  public expected_delivery_date?: string | null;
  public sales_person_id?: number | null;
  public internal_notes?: string | null;
  public customer_notes?: string | null;
}

SaleOrder.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT },
    order_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    customer_id: { type: DataTypes.BIGINT },
    order_date: { type: DataTypes.DATE },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    },
    status: { type: DataTypes.ENUM("draft","confirmed","shipped","completed","cancelled"), defaultValue: "draft" },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.STRING(255), allowNull: true },
    total_before_tax: { type: DataTypes.DECIMAL(18,2) },
    total_tax: { type: DataTypes.DECIMAL(18,2) },
    total_after_tax: { type: DataTypes.DECIMAL(18,2) },

    // Phase 3 Sales enhancements
    quotation_id: { type: DataTypes.BIGINT, allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: { type: DataTypes.DECIMAL(18, 6), defaultValue: 1.000000 },
    payment_term_id: { type: DataTypes.BIGINT, allowNull: true },
    discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    delivery_status: { type: DataTypes.ENUM("pending", "partial", "delivered"), defaultValue: "pending" },
    invoice_status: { type: DataTypes.ENUM("not_invoiced", "partial", "invoiced"), defaultValue: "not_invoiced" },
    customer_po_number: { type: DataTypes.STRING(100), allowNull: true },
    delivery_address: { type: DataTypes.TEXT, allowNull: true },
    expected_delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
    sales_person_id: { type: DataTypes.BIGINT, allowNull: true },
    internal_notes: { type: DataTypes.TEXT, allowNull: true },
    customer_notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: "sale_orders", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
