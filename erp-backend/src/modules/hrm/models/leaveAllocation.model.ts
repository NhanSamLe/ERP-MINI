import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface LeaveAllocationAttrs {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  used_days: number;
}

type Creation = Optional<LeaveAllocationAttrs, "id" | "used_days">;

export class LeaveAllocation extends Model<
  LeaveAllocationAttrs,
  Creation
> implements LeaveAllocationAttrs {
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public year!: number;
  public total_days!: number;
  public used_days!: number;
}

LeaveAllocation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.BIGINT, allowNull: false },
    leave_type_id: { type: DataTypes.BIGINT, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    total_days: { type: DataTypes.DECIMAL(5,1), allowNull: false },
    used_days: { type: DataTypes.DECIMAL(5,1), defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "leave_allocations",
    timestamps: false,
  }
);