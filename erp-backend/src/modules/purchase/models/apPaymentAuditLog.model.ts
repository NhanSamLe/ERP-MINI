import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type ApPaymentAuditAction =
  | "CREATE"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "ALLOCATE"
  | "COMPLETE";

export interface ApPaymentAuditLogAttrs {
  id: number;
  payment_id: number;
  action: ApPaymentAuditAction;
  old_status?: string | null;
  new_status?: string | null;
  details?: Record<string, any> | null;
  created_by: number;
  created_at?: Date;
}

type ApPaymentAuditLogCreation = Optional<
  ApPaymentAuditLogAttrs,
  "id" | "created_at"
>;

export class ApPaymentAuditLog
  extends Model<ApPaymentAuditLogAttrs, ApPaymentAuditLogCreation>
  implements ApPaymentAuditLogAttrs
{
  public id!: number;
  public payment_id!: number;
  public action!: ApPaymentAuditAction;
  public old_status?: string | null;
  public new_status?: string | null;
  public details?: Record<string, any> | null;
  public created_by!: number;
  public created_at?: Date;
}

ApPaymentAuditLog.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    payment_id: { type: DataTypes.BIGINT, allowNull: false },
    action: { type: DataTypes.STRING(20), allowNull: false },
    old_status: { type: DataTypes.STRING(50), allowNull: true },
    new_status: { type: DataTypes.STRING(50), allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "ap_payment_audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // audit logs không cần updatedAt
  },
);
