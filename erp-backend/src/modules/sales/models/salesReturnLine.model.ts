import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface SalesReturnLineAttrs {
  id: number; return_id: number; product_id: number; quantity_returned: number;
  quantity_received: number; quantity_rejected: number; unit_price: number; line_total: number;
  reason: string | null; condition: "good"|"damaged"|"defective";
}
type SRLCreation = Optional<SalesReturnLineAttrs, "id">;
export class SalesReturnLine extends Model<SalesReturnLineAttrs, SRLCreation> implements SalesReturnLineAttrs {
  public id!: number; public return_id!: number; public product_id!: number; public quantity_returned!: number;
  public quantity_received!: number; public quantity_rejected!: number; public unit_price!: number; public line_total!: number;
  public reason!: string | null; public condition!: "good"|"damaged"|"defective";
}
SalesReturnLine.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  return_id: { type: DataTypes.BIGINT, allowNull: false },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  quantity_returned: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
  quantity_received: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  quantity_rejected: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  line_total: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  reason: { type: DataTypes.TEXT },
  condition: { type: DataTypes.ENUM("good","damaged","defective"), defaultValue: "good" },
}, { sequelize, tableName: "sales_return_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
