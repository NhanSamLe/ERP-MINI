import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SalesReturnAuthorizationAttrs {
  id: number; branch_id: number; rma_no: string; sale_order_id: number;
  invoice_id: number | null; customer_id: number; reason: string;
  return_type: "refund"|"replacement"|"credit_note";
  status: "draft"|"submitted"|"approved"|"rejected"|"processing"|"completed"|"cancelled";
  approval_status: "draft"|"waiting_approval"|"approved"|"rejected";
  total_return_amount: number; created_by: number | null; approved_by: number | null;
  submitted_at: Date | null; approved_at: Date | null; reject_reason: string | null; notes: string | null;
}
type SRACreation = Optional<SalesReturnAuthorizationAttrs, "id">;
export class SalesReturnAuthorization extends Model<SalesReturnAuthorizationAttrs, SRACreation> implements SalesReturnAuthorizationAttrs {
  public id!: number; public branch_id!: number; public rma_no!: string; public sale_order_id!: number;
  public invoice_id!: number | null; public customer_id!: number; public reason!: string;
  public return_type!: "refund"|"replacement"|"credit_note";
  public status!: "draft"|"submitted"|"approved"|"rejected"|"processing"|"completed"|"cancelled";
  public approval_status!: "draft"|"waiting_approval"|"approved"|"rejected";
  public total_return_amount!: number; public created_by!: number | null; public approved_by!: number | null;
  public submitted_at!: Date | null; public approved_at!: Date | null; public reject_reason!: string | null; public notes!: string | null;
}
SalesReturnAuthorization.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  branch_id: { type: DataTypes.BIGINT, allowNull: false },
  rma_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  sale_order_id: { type: DataTypes.BIGINT, allowNull: false },
  invoice_id: { type: DataTypes.BIGINT },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  return_type: { type: DataTypes.ENUM("refund","replacement","credit_note"), defaultValue: "credit_note" },
  status: { type: DataTypes.ENUM("draft","submitted","approved","rejected","processing","completed","cancelled"), defaultValue: "draft" },
  approval_status: { type: DataTypes.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
  total_return_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  created_by: { type: DataTypes.BIGINT },
  approved_by: { type: DataTypes.BIGINT },
  submitted_at: { type: DataTypes.DATE },
  approved_at: { type: DataTypes.DATE },
  reject_reason: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
}, { sequelize, tableName: "sales_return_authorizations", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
