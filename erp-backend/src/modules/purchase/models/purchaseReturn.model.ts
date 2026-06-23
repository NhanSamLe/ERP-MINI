import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PurchaseReturnStatus =
  | "draft"
  | "shipped"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface PurchaseReturnAttrs {
  id: number;
  branch_id: number;
  return_no: string;
  pra_id?: number | null;
  purchase_order_id?: number | null;
  supplier_id: number;
  return_date: string;
  warehouse_id?: number | null;
  status: PurchaseReturnStatus;
  total_return_amount: number;
  return_type: "refund" | "replacement" | "debit_note";
  stock_move_id?: number | null;
  created_by: number;
  notes?: string | null;
}

type PurchaseReturnCreation = Optional<
  PurchaseReturnAttrs,
  "id" | "status" | "total_return_amount" | "return_type"
>;

export class PurchaseReturn
  extends Model<PurchaseReturnAttrs, PurchaseReturnCreation>
  implements PurchaseReturnAttrs
{
  public id!: number;
  public branch_id!: number;
  public return_no!: string;
  public pra_id?: number | null;
  public purchase_order_id?: number | null;
  public supplier_id!: number;
  public return_date!: string;
  public warehouse_id?: number | null;
  public status!: PurchaseReturnStatus;
  public total_return_amount!: number;
  public return_type!: "refund" | "replacement" | "debit_note";
  public stock_move_id?: number | null;
  public created_by!: number;
  public notes?: string | null;
}

PurchaseReturn.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    return_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    pra_id: { type: DataTypes.BIGINT, allowNull: true },
    purchase_order_id: { type: DataTypes.BIGINT, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: false },
    return_date: { type: DataTypes.DATEONLY, allowNull: false },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "shipped",
        "confirmed",
        "completed",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    total_return_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    return_type: {
      type: DataTypes.ENUM("refund", "replacement", "debit_note"),
      allowNull: false,
      defaultValue: "debit_note",
    },
    stock_move_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_returns",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
