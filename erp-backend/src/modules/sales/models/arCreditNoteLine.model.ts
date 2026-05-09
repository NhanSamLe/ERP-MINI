import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface ArCreditNoteLineAttrs {
  id: number; credit_note_id: number; product_id: number | null; description: string | null;
  quantity: number; unit_price: number; tax_rate_id: number | null;
  line_total: number; line_tax: number; line_total_after_tax: number;
}
type ACNLCreation = Optional<ArCreditNoteLineAttrs, "id">;
export class ArCreditNoteLine extends Model<ArCreditNoteLineAttrs, ACNLCreation> implements ArCreditNoteLineAttrs {
  public id!: number; public credit_note_id!: number; public product_id!: number | null; public description!: string | null;
  public quantity!: number; public unit_price!: number; public tax_rate_id!: number | null;
  public line_total!: number; public line_tax!: number; public line_total_after_tax!: number;
}
ArCreditNoteLine.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  credit_note_id: { type: DataTypes.BIGINT, allowNull: false },
  product_id: { type: DataTypes.BIGINT },
  description: { type: DataTypes.TEXT },
  quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  tax_rate_id: { type: DataTypes.BIGINT },
  line_total: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  line_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  line_total_after_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
}, { sequelize, tableName: "ar_credit_note_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
