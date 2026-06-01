import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface VendorRefundAttrs {
  id: number;
  branch_id: number;
  refund_no: string;
  debit_note_id?: number | null;
  supplier_id: number;
  refund_date: string;
  amount: number;
  method: "cash" | "bank" | "transfer";
  bank_account_id?: number | null;
  transaction_reference?: string | null;
  currency_id?: number | null;
  exchange_rate?: number;
  status: "draft" | "posted";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  gl_entry_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  notes?: string | null;
}

type VendorRefundCreation = Optional<
  VendorRefundAttrs,
  "id" | "status" | "approval_status"
>;

export class VendorRefund
  extends Model<VendorRefundAttrs, VendorRefundCreation>
  implements VendorRefundAttrs
{
  public id!: number;
  public branch_id!: number;
  public refund_no!: string;
  public debit_note_id?: number | null;
  public supplier_id!: number;
  public refund_date!: string;
  public amount!: number;
  public method!: "cash" | "bank" | "transfer";
  public bank_account_id?: number | null;
  public transaction_reference?: string | null;
  public currency_id?: number | null;
  public exchange_rate?: number;
  public status!: "draft" | "posted";
  public approval_status!:
    | "draft"
    | "waiting_approval"
    | "approved"
    | "rejected";
  public gl_entry_id?: number | null;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public notes?: string | null;
}

VendorRefund.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    refund_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    debit_note_id: { type: DataTypes.BIGINT, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: false },
    refund_date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    method: {
      type: DataTypes.ENUM("cash", "bank", "transfer"),
      allowNull: false,
      defaultValue: "bank",
    },
    bank_account_id: { type: DataTypes.BIGINT, allowNull: true },
    transaction_reference: { type: DataTypes.STRING(100), allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    },
    status: {
      type: DataTypes.ENUM("draft", "posted"),
      allowNull: false,
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },
    gl_entry_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "vendor_refunds",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
