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
  },
  { sequelize, tableName: "sale_orders", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
