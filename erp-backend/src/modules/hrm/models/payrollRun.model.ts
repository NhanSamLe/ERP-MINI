import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollRunAttrs {
  id: number;
  period_id: number;
  run_no: string;
  status: "draft" | "posted";
}

type PayrollRunCreation = Optional<PayrollRunAttrs, "id" | "status">;

export class PayrollRun extends Model<PayrollRunAttrs, PayrollRunCreation> implements PayrollRunAttrs {
  public id!: number;
  public period_id!: number;
  public run_no!: string;
  public status!: "draft" | "posted";
}

PayrollRun.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    period_id: { type: DataTypes.BIGINT, allowNull: false },
    run_no: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.ENUM("draft","posted"), defaultValue: "draft" }
  },
  { sequelize, tableName: "payroll_runs", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
