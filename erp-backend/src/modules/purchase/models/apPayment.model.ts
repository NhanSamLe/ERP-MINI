import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApPaymentAttrs {
  id: number;
  payment_no: string;
  supplier_id?: number;
  payment_date?: Date;
  amount?: number;
  method: "cash" | "bank" | "transfer";
  status: "draft" | "posted" | "completed" | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  // Phase 1 — allocation tracking + bank info
  allocation_status: "unallocated" | "partially_allocated" | "fully_allocated";
  currency_id?: number | null;
  exchange_rate?: number;
  bank_account_id?: number | null;
  transaction_reference?: string | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  branch_id: number;
}

type ApPaymentCreation = Optional<ApPaymentAttrs, "id" | "status">;

export class ApPayment
  extends Model<ApPaymentAttrs, ApPaymentCreation>
  implements ApPaymentAttrs
{
  public id!: number;
  public payment_no!: string;
  public supplier_id?: number;
  public payment_date?: Date;
  public amount?: number;
  public method!: "cash" | "bank" | "transfer";
  public status!: "draft" | "posted" | "completed" | "cancelled";
  public approval_status!:
    | "draft"
    | "waiting_approval"
    | "approved"
    | "rejected";
  public allocation_status!:
    | "unallocated"
    | "partially_allocated"
    | "fully_allocated";
  public currency_id?: number | null;
  public exchange_rate?: number;
  public bank_account_id?: number | null;
  public transaction_reference?: string | null;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public branch_id!: number;
}

ApPayment.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    payment_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.BIGINT },
    payment_date: { type: DataTypes.DATE },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    method: {
      type: DataTypes.ENUM("cash", "bank", "transfer"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "posted", "completed", "cancelled"),
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    },
    allocation_status: {
      type: DataTypes.ENUM(
        "unallocated",
        "partially_allocated",
        "fully_allocated",
      ),
      allowNull: false,
      defaultValue: "unallocated",
    },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    },
    bank_account_id: { type: DataTypes.BIGINT, allowNull: true },
    transaction_reference: { type: DataTypes.STRING(100), allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT },
    submitted_at: { type: DataTypes.DATE },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.STRING(255) },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "ap_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
