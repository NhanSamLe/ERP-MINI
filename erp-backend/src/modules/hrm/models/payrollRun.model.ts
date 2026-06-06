import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollRunAttrs {
  id: number;
  period_id: number;
  run_no: string;
  status: "draft" | "posted";
  approval_status: "draft" | "waiting_chief_accountant" | "waiting_ceo" | "approved" | "rejected";
  submitted_at?: Date | null;
  approved_by?: number | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
}

type PayrollRunCreation = Optional<PayrollRunAttrs, "id" | "status" | "approval_status">;

export class PayrollRun extends Model<PayrollRunAttrs, PayrollRunCreation> implements PayrollRunAttrs {
  public id!: number;
  public period_id!: number;
  public run_no!: string;
  public status!: "draft" | "posted";
  public approval_status!: "draft" | "waiting_chief_accountant" | "waiting_ceo" | "approved" | "rejected";
  public submitted_at?: Date | null;
  public approved_by?: number | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
}

PayrollRun.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    period_id: { type: DataTypes.BIGINT, allowNull: false },
    run_no: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.ENUM("draft", "posted"), defaultValue: "draft" },
    approval_status: {
      type: DataTypes.ENUM("draft", "waiting_chief_accountant", "waiting_ceo", "approved", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    reject_reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: "payroll_runs", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
