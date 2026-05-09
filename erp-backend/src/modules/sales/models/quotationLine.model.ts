import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface QuotationLineAttrs {
  id: number; quotation_id: number; product_id: number; description: string | null;
  quantity: number; unit_price: number; discount_percent: number; discount_amount: number;
  tax_rate_id: number | null; line_total: number; line_tax: number; line_total_after_tax: number;
}
type QuotationLineCreation = Optional<QuotationLineAttrs, "id">;
export class QuotationLine extends Model<QuotationLineAttrs, QuotationLineCreation> implements QuotationLineAttrs {
  public id!: number; public quotation_id!: number; public product_id!: number; public description!: string | null;
  public quantity!: number; public unit_price!: number; public discount_percent!: number; public discount_amount!: number;
  public tax_rate_id!: number | null; public line_total!: number; public line_tax!: number; public line_total_after_tax!: number;
}
QuotationLine.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  quotation_id: { type: DataTypes.BIGINT, allowNull: false },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  description: { type: DataTypes.TEXT },
  quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  tax_rate_id: { type: DataTypes.BIGINT },
  line_total: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  line_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  line_total_after_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
}, { sequelize, tableName: "quotation_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
