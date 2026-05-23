import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type ApDebitNoteStatus = "draft" | "posted" | "applied" | "cancelled";

export interface ApDebitNoteAttrs {
  id: number;
  branch_id: number;
  debit_note_no: string;
  purchase_return_id?: number | null;
  original_ap_invoice_id?: number | null;
  supplier_id: number;
  debit_note_date: string;
  status: ApDebitNoteStatus;
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  currency_id?: number | null;
  exchange_rate?: number;
  gl_entry_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  notes?: string | null;
}

type ApDebitNoteCreation = Optional<
  ApDebitNoteAttrs,
  | "id"
  | "status"
  | "approval_status"
  | "total_before_tax"
  | "total_tax"
  | "total_after_tax"
>;

export class ApDebitNote
  extends Model<ApDebitNoteAttrs, ApDebitNoteCreation>
  implements ApDebitNoteAttrs
{
  public id!: number;
  public branch_id!: number;
  public debit_note_no!: string;
  public purchase_return_id?: number | null;
  public original_ap_invoice_id?: number | null;
  public supplier_id!: number;
  public debit_note_date!: string;
  public status!: ApDebitNoteStatus;
  public approval_status!:
    | "draft"
    | "waiting_approval"
    | "approved"
    | "rejected";
  public total_before_tax!: number;
  public total_tax!: number;
  public total_after_tax!: number;
  public currency_id?: number | null;
  public exchange_rate?: number;
  public gl_entry_id?: number | null;
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public notes?: string | null;
}

ApDebitNote.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    debit_note_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    purchase_return_id: { type: DataTypes.BIGINT, allowNull: true },
    original_ap_invoice_id: { type: DataTypes.BIGINT, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: false },
    debit_note_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("draft", "posted", "applied", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },
    total_before_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_after_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1.0,
    },
    gl_entry_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    reject_reason: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "ap_debit_notes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
