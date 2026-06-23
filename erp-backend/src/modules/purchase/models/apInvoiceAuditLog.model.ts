import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type AuditAction =
  | "created"
  | "auto_created"
  | "override_duplicate"
  | "mismatch_accepted"
  | "mismatch_overridden"
  | "manual_override";

export interface ApInvoiceAuditLogAttrs {
  id: number;
  ap_invoice_id: number;
  action: AuditAction;
  source?: "manual" | "ai_ocr" | null;
  ocr_confidence?: number | null;
  matching_status?: string | null;
  matching_details?: Record<string, any> | null;
  override_reason?: string | null;
  created_by: number;
  created_at?: Date;
}

type ApInvoiceAuditLogCreation = Optional<ApInvoiceAuditLogAttrs, "id">;

export class ApInvoiceAuditLog
  extends Model<ApInvoiceAuditLogAttrs, ApInvoiceAuditLogCreation>
  implements ApInvoiceAuditLogAttrs
{
  public id!: number;
  public ap_invoice_id!: number;
  public action!: AuditAction;
  public source?: "manual" | "ai_ocr" | null;
  public ocr_confidence?: number | null;
  public matching_status?: string | null;
  public matching_details?: Record<string, any> | null;
  public override_reason?: string | null;
  public created_by!: number;
  public created_at?: Date;
}

ApInvoiceAuditLog.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    ap_invoice_id: { type: DataTypes.BIGINT, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    source: { type: DataTypes.STRING(20), allowNull: true },
    ocr_confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    matching_status: { type: DataTypes.STRING(20), allowNull: true },
    matching_details: { type: DataTypes.JSON, allowNull: true },
    override_reason: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "ap_invoice_audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // audit logs không cần updatedAt
  },
);
