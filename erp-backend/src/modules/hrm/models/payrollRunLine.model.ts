import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollRunLineAttrs {
  id: number;
  run_id: number;
  employee_id: number;
  amount: number;

  present_days?: number;
  absent_days?: number;
  leave_days?: number;
  late_days?: number;

  base_salary?: number;
  daily_rate?: number;
  gross_amount?: number;
  total_earning?: number;
  total_deduction?: number;
  pit_amount?: number;
  net_amount?: number;
}

type PayrollRunLineCreation = Optional<
  PayrollRunLineAttrs,
  | "id"
  | "present_days"
  | "absent_days"
  | "leave_days"
  | "late_days"
  | "base_salary"
  | "daily_rate"
  | "gross_amount"
  | "total_earning"
  | "total_deduction"
  | "pit_amount"
  | "net_amount"
>;

export class PayrollRunLine
  extends Model<PayrollRunLineAttrs, PayrollRunLineCreation>
  implements PayrollRunLineAttrs
{
  public id!: number;
  public run_id!: number;
  public employee_id!: number;
  public amount!: number;

  public present_days?: number;
  public absent_days?: number;
  public leave_days?: number;
  public late_days?: number;

  public base_salary?: number;
  public daily_rate?: number;
  public gross_amount?: number;
  public total_earning?: number;
  public total_deduction?: number;
  public pit_amount?: number;
  public net_amount?: number;
}

PayrollRunLine.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    run_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    employee_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },

    present_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    absent_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    leave_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    late_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    base_salary: DataTypes.DECIMAL(18, 2),
    daily_rate: DataTypes.DECIMAL(18, 2),
    gross_amount: DataTypes.DECIMAL(18, 2),
    total_earning: DataTypes.DECIMAL(18, 2),
    total_deduction: DataTypes.DECIMAL(18, 2),

    pit_amount: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0,
    },

    net_amount: DataTypes.DECIMAL(18, 2),
  },
  {
    sequelize,
    tableName: "payroll_run_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);