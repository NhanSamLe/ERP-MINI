import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SaleOrderAttrs {
  id: number;
  branch_id?: number;
  order_no: string;
  customer_id?: number;
  order_date?: Date;
  status: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
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
  public status!: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
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
    status: { type: DataTypes.ENUM("draft","confirmed","shipped","completed","cancelled"), defaultValue: "draft" },
    total_before_tax: { type: DataTypes.DECIMAL(18,2) },
    total_tax: { type: DataTypes.DECIMAL(18,2) },
    total_after_tax: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "sale_orders", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
