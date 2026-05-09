import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApInvoiceAttrs {
  id: number;
  po_id?: number;
  invoice_no: string;
  invoice_date?: Date;
  due_date?: Date;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  status: "draft" | "posted" | "partially_paid" | "paid" | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  branch_id: number;
  supplier_id?: number | null;
  invoice_series?: string | null;
  invoice_template?: string | null;
  tax_code?: string | null;
  source: "manual" | "ai_ocr";
  invoice_document_id?: number | null;
  ocr_confidence?: number | null;
  matching_status: "pending" | "matched" | "mismatch";
  matching_details?: Record<string, any> | null;
}

type ApInvoiceCreation = Optional<
  ApInvoiceAttrs,
  "id" | "status" | "source" | "matching_status"
>;

export class ApInvoice
  extends Model<ApInvoiceAttrs, ApInvoiceCreation>
  implements ApInvoiceAttrs
{
  public id!: number;
  public po_id?: number;
  public invoice_no!: string;
  public invoice_date?: Date;
  public due_date?: Date;
  public total_before_tax?: number;
  public total_tax?: number;
  public total_after_tax?: number;
  public status!: "draft" | "posted" | "partially_paid" | "paid" | "cancelled";
  public approval_status!:
    | "draft"
    | "waiting_approval"
    | "approved"
    | "rejected";
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public branch_id!: number;
  public supplier_id?: number | null;
  public invoice_series?: string | null;
  public invoice_template?: string | null;
  public tax_code?: string | null;
  public source!: "manual" | "ai_ocr";
  public invoice_document_id?: number | null;
  public ocr_confidence?: number | null;
  public matching_status!: "pending" | "matched" | "mismatch";
  public matching_details?: Record<string, any> | null;
}

ApInvoice.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.BIGINT },
    invoice_no: { type: DataTypes.STRING(50), allowNull: false },
    invoice_date: { type: DataTypes.DATE },
    due_date: { type: DataTypes.DATE },
    total_before_tax: { type: DataTypes.DECIMAL(18, 2) },
    total_tax: { type: DataTypes.DECIMAL(18, 2) },
    total_after_tax: { type: DataTypes.DECIMAL(18, 2) },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "posted",
        "partially_paid",
        "paid",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT },
    submitted_at: { type: DataTypes.DATE },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.STRING(255) },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    invoice_series: { type: DataTypes.STRING(50), allowNull: true },
    invoice_template: { type: DataTypes.STRING(100), allowNull: true },
    tax_code: { type: DataTypes.STRING(50), allowNull: true },
    source: {
      type: DataTypes.ENUM("manual", "ai_ocr"),
      allowNull: false,
      defaultValue: "manual",
    },
    invoice_document_id: { type: DataTypes.BIGINT, allowNull: true },
    ocr_confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    matching_status: {
      type: DataTypes.ENUM("pending", "matched", "mismatch"),
      allowNull: false,
      defaultValue: "pending",
    },
    matching_details: { type: DataTypes.JSON, allowNull: true },
  },
  {
    sequelize,
    tableName: "ap_invoices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
