import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SalesReturnAttrs {
  id: number; branch_id: number; return_no: string; rma_id: number | null;
  sale_order_id: number | null; customer_id: number; return_date: string; warehouse_id: number | null;
  status: "draft"|"received"|"inspected"|"completed"|"cancelled";
  approval_status: "draft"|"waiting_approval"|"approved"|"rejected";
  total_return_amount: number; stock_move_id?: number | null; created_by: number | null; approved_by: number | null;
  submitted_at: Date | null; approved_at: Date | null; notes: string | null;
}
type SRCreation = Optional<SalesReturnAttrs, "id">;
export class SalesReturn extends Model<SalesReturnAttrs, SRCreation> implements SalesReturnAttrs {
  public id!: number; public branch_id!: number; public return_no!: string; public rma_id!: number | null;
  public sale_order_id!: number | null; public customer_id!: number; public return_date!: string; public warehouse_id!: number | null;
  public status!: "draft"|"received"|"inspected"|"completed"|"cancelled";
  public approval_status!: "draft"|"waiting_approval"|"approved"|"rejected";
  public total_return_amount!: number; public stock_move_id!: number | null; public created_by!: number | null; public approved_by!: number | null;
  public submitted_at!: Date | null; public approved_at!: Date | null; public notes!: string | null;
}
SalesReturn.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  branch_id: { type: DataTypes.BIGINT, allowNull: false },
  return_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  rma_id: { type: DataTypes.BIGINT },
  sale_order_id: { type: DataTypes.BIGINT },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  return_date: { type: DataTypes.DATEONLY, allowNull: false },
  warehouse_id: { type: DataTypes.BIGINT },
  status: { type: DataTypes.ENUM("draft","received","inspected","completed","cancelled"), defaultValue: "draft" },
  approval_status: { type: DataTypes.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
  total_return_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  stock_move_id: { type: DataTypes.BIGINT, allowNull: true },
  created_by: { type: DataTypes.BIGINT },
  approved_by: { type: DataTypes.BIGINT },
  submitted_at: { type: DataTypes.DATE },
  approved_at: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
}, { sequelize, tableName: "sales_returns", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
