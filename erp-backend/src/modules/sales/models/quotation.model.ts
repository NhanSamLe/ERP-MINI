import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface QuotationAttrs {
  id: number; branch_id: number; quotation_no: string; customer_id: number;
  opportunity_id: number | null; currency_id: number | null; exchange_rate: number;
  payment_term_id: number | null; quotation_date: string; valid_until: string | null;
  status: "draft"|"sent"|"accepted"|"rejected"|"expired"|"cancelled"|"converted";
  approval_status: "draft"|"waiting_approval"|"approved"|"rejected";
  version: number; parent_id: number | null;
  total_before_tax: number; total_tax: number; total_after_tax: number;
  discount_percent: number; discount_amount: number;
  customer_notes: string | null; internal_notes: string | null;
  sales_person_id: number | null; created_by: number | null; approved_by: number | null;
  submitted_at: Date | null; approved_at: Date | null; reject_reason: string | null; sent_at: Date | null;
}
type QuotationCreation = Optional<QuotationAttrs, "id">;
export class Quotation extends Model<QuotationAttrs, QuotationCreation> implements QuotationAttrs {
  public id!: number; public branch_id!: number; public quotation_no!: string; public customer_id!: number;
  public opportunity_id!: number | null; public currency_id!: number | null; public exchange_rate!: number;
  public payment_term_id!: number | null; public quotation_date!: string; public valid_until!: string | null;
  public status!: "draft"|"sent"|"accepted"|"rejected"|"expired"|"cancelled"|"converted";
  public approval_status!: "draft"|"waiting_approval"|"approved"|"rejected";
  public version!: number; public parent_id!: number | null;
  public total_before_tax!: number; public total_tax!: number; public total_after_tax!: number;
  public discount_percent!: number; public discount_amount!: number;
  public customer_notes!: string | null; public internal_notes!: string | null;
  public sales_person_id!: number | null; public created_by!: number | null; public approved_by!: number | null;
  public submitted_at!: Date | null; public approved_at!: Date | null; public reject_reason!: string | null; public sent_at!: Date | null;
}
Quotation.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  branch_id: { type: DataTypes.BIGINT, allowNull: false },
  quotation_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  opportunity_id: { type: DataTypes.BIGINT },
  currency_id: { type: DataTypes.BIGINT },
  exchange_rate: { type: DataTypes.DECIMAL(18, 6), defaultValue: 1.000000 },
  payment_term_id: { type: DataTypes.BIGINT },
  quotation_date: { type: DataTypes.DATEONLY, allowNull: false },
  valid_until: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM("draft","sent","accepted","rejected","expired","cancelled","converted"), defaultValue: "draft" },
  approval_status: { type: DataTypes.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  parent_id: { type: DataTypes.BIGINT },
  total_before_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  total_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  total_after_tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  customer_notes: { type: DataTypes.TEXT },
  internal_notes: { type: DataTypes.TEXT },
  sales_person_id: { type: DataTypes.BIGINT },
  created_by: { type: DataTypes.BIGINT },
  approved_by: { type: DataTypes.BIGINT },
  submitted_at: { type: DataTypes.DATE },
  approved_at: { type: DataTypes.DATE },
  reject_reason: { type: DataTypes.TEXT },
  sent_at: { type: DataTypes.DATE },
}, { sequelize, tableName: "quotations", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
