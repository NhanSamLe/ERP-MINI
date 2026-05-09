import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ArCreditNoteAttrs {
  id: number; branch_id: number; credit_note_no: string; sales_return_id: number | null;
  original_invoice_id: number | null; customer_id: number; credit_note_date: string;
  status: "draft"|"posted"|"applied"|"cancelled";
  approval_status: "draft"|"waiting_approval"|"approved"|"rejected";
  total_before_tax: number; total_tax: number; total_after_tax: number;
  currency_id: number | null; exchange_rate: number;
  created_by: number | null; approved_by: number | null; notes: string | null;
}
type ACNCreation = Optional<ArCreditNoteAttrs, "id">;
export class ArCreditNote extends Model<ArCreditNoteAttrs, ACNCreation> implements ArCreditNoteAttrs {
  public id!: number; public branch_id!: number; public credit_note_no!: string; public sales_return_id!: number | null;
  public original_invoice_id!: number | null; public customer_id!: number; public credit_note_date!: string;
  public status!: "draft"|"posted"|"applied"|"cancelled";
  public approval_status!: "draft"|"waiting_approval"|"approved"|"rejected";
  public total_before_tax!: number; public total_tax!: number; public total_after_tax!: number;
  public currency_id!: number | null; public exchange_rate!: number;
  public created_by!: number | null; public approved_by!: number | null; public notes!: string | null;
}
ArCreditNote.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  branch_id: { type: DataTypes.BIGINT, allowNull: false },
  credit_note_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  sales_return_id: { type: DataTypes.BIGINT },
  original_invoice_id: { type: DataTypes.BIGINT },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  credit_note_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("draft","posted","applied","cancelled"), defaultValue: "draft" },
  approval_status: { type: DataTypes.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
  total_before_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  total_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  total_after_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  currency_id: { type: DataTypes.BIGINT },
  exchange_rate: { type: DataTypes.DECIMAL(18, 6), defaultValue: 1.000000 },
  created_by: { type: DataTypes.BIGINT },
  approved_by: { type: DataTypes.BIGINT },
  notes: { type: DataTypes.TEXT },
}, { sequelize, tableName: "ar_credit_notes", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
