import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ArRefundAttrs {
  id: number; branch_id: number; refund_no: string; credit_note_id: number | null;
  customer_id: number; refund_date: string; amount: number;
  currency_id: number | null; exchange_rate: number;
  method: "cash"|"bank"|"transfer"; bank_account_id: number | null;
  status: "draft"|"posted"; approval_status: "draft"|"waiting_approval"|"approved"|"rejected";
  gl_entry_id: number | null; created_by: number | null; approved_by: number | null; notes: string | null;
}
type ARCreation = Optional<ArRefundAttrs, "id">;
export class ArRefund extends Model<ArRefundAttrs, ARCreation> implements ArRefundAttrs {
  public id!: number; public branch_id!: number; public refund_no!: string; public credit_note_id!: number | null;
  public customer_id!: number; public refund_date!: string; public amount!: number;
  public currency_id!: number | null; public exchange_rate!: number;
  public method!: "cash"|"bank"|"transfer"; public bank_account_id!: number | null;
  public status!: "draft"|"posted"; public approval_status!: "draft"|"waiting_approval"|"approved"|"rejected";
  public gl_entry_id!: number | null; public created_by!: number | null; public approved_by!: number | null; public notes!: string | null;
}
ArRefund.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  branch_id: { type: DataTypes.BIGINT, allowNull: false },
  refund_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  credit_note_id: { type: DataTypes.BIGINT },
  customer_id: { type: DataTypes.BIGINT, allowNull: false },
  refund_date: { type: DataTypes.DATEONLY, allowNull: false },
  amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  currency_id: { type: DataTypes.BIGINT },
  exchange_rate: { type: DataTypes.DECIMAL(18, 6), defaultValue: 1.000000 },
  method: { type: DataTypes.ENUM("cash","bank","transfer"), defaultValue: "bank" },
  bank_account_id: { type: DataTypes.BIGINT },
  status: { type: DataTypes.ENUM("draft","posted"), defaultValue: "draft" },
  approval_status: { type: DataTypes.ENUM("draft","waiting_approval","approved","rejected"), defaultValue: "draft" },
  gl_entry_id: { type: DataTypes.BIGINT },
  created_by: { type: DataTypes.BIGINT },
  approved_by: { type: DataTypes.BIGINT },
  notes: { type: DataTypes.TEXT },
}, { sequelize, tableName: "ar_refunds", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
