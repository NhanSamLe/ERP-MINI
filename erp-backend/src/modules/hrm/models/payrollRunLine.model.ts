import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollRunLineAttrs {
  id: number;
  run_id: number;
  employee_id: number;
  amount: number;
}

type PayrollRunLineCreation = Optional<PayrollRunLineAttrs, "id">;

export class PayrollRunLine extends Model<PayrollRunLineAttrs, PayrollRunLineCreation> implements PayrollRunLineAttrs {
  public id!: number;
  public run_id!: number;
  public employee_id!: number;
  public amount!: number;
}

PayrollRunLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    run_id: { type: DataTypes.BIGINT, allowNull: false },
    employee_id: { type: DataTypes.BIGINT, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18,2), allowNull: false }
  },
  { sequelize, tableName: "payroll_run_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
