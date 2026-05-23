import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PraStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "cancelled";

export type ReturnType = "refund" | "replacement" | "debit_note";

export interface PurchaseReturnAuthorizationAttrs {
  id: number;
  branch_id: number;
  pra_no: string;
  purchase_order_id: number;
  ap_invoice_id?: number | null;
  supplier_id: number;
  reason: string;
  return_type: ReturnType;
  status: PraStatus;
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_return_amount: number;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  notes?: string | null;
}

type PraCreation = Optional<
  PurchaseReturnAuthorizationAttrs,
  "id" | "status" | "approval_status" | "total_return_amount"
>;

export class PurchaseReturnAuthorization
  extends Model<PurchaseReturnAuthorizationAttrs, PraCreation>
  implements PurchaseReturnAuthorizationAttrs
{
  public id!: number;
  public branch_id!: number;
  public pra_no!: string;
  public purchase_order_id!: number;
  public ap_invoice_id?: number | null;
  public supplier_id!: number;
  public reason!: string;
  public return_type!: ReturnType;
  public status!: PraStatus;
  public approval_status!:
    | "draft"
    | "waiting_approval"
    | "approved"
    | "rejected";
  public total_return_amount!: number;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public notes?: string | null;
}

PurchaseReturnAuthorization.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    pra_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    purchase_order_id: { type: DataTypes.BIGINT, allowNull: false },
    ap_invoice_id: { type: DataTypes.BIGINT, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    return_type: {
      type: DataTypes.ENUM("refund", "replacement", "debit_note"),
      allowNull: false,
      defaultValue: "debit_note",
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "submitted",
        "approved",
        "rejected",
        "processing",
        "completed",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },
    total_return_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    reject_reason: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_return_authorizations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
