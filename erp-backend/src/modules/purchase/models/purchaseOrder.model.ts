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
        "cancelled"
      ),
      defaultValue: "draft",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
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
  }
);
