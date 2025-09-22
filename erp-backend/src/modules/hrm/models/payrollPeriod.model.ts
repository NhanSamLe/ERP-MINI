import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollPeriodAttrs {
  id: number;
  branch_id: number;
  period_code: string;
  start_date: Date;
  end_date: Date;
  status: "open" | "processed" | "closed";
}

type PayrollPeriodCreation = Optional<PayrollPeriodAttrs, "id" | "status">;

export class PayrollPeriod extends Model<PayrollPeriodAttrs, PayrollPeriodCreation> implements PayrollPeriodAttrs {
  public id!: number;
  public branch_id!: number;
  public period_code!: string;
  public start_date!: Date;
  public end_date!: Date;
  public status!: "open" | "processed" | "closed";
}

PayrollPeriod.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    period_code: { type: DataTypes.STRING(20), allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM("open","processed","closed"), defaultValue: "open" }
  },
  { sequelize, tableName: "payroll_periods", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
