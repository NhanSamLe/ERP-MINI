import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseOrderAttrs {
  id: number;
  branch_id?: number;
  po_no: string;
  supplier_id?: number;
  order_date?: Date;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  status: "draft" | "confirmed" | "received" | "cancelled";
}

type PurchaseOrderCreation = Optional<PurchaseOrderAttrs, "id" | "status">;

export class PurchaseOrder extends Model<PurchaseOrderAttrs, PurchaseOrderCreation>
  implements PurchaseOrderAttrs {
  public id!: number;
  public branch_id?: number;
  public po_no!: string;
  public supplier_id?: number;
  public order_date?: Date;
  public total_before_tax?: number;
  public total_tax?: number;
  public total_after_tax?: number;
  public status!: "draft" | "confirmed" | "received" | "cancelled";
}

PurchaseOrder.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT },
    po_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.BIGINT },
    order_date: { type: DataTypes.DATE },
    total_before_tax: { type: DataTypes.DECIMAL(18,2) },
    total_tax: { type: DataTypes.DECIMAL(18,2) },
    total_after_tax: { type: DataTypes.DECIMAL(18,2) },
    status: {
      type: DataTypes.ENUM("draft","confirmed","received","cancelled"),
      defaultValue: "draft",
    },
  },
  { sequelize, tableName: "purchase_orders", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
