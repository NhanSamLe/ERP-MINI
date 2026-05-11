import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface LeaveTypeAttrs {
  id: number;
  name: string;
  is_paid: boolean;
  max_days?: number;
  carry_forward: boolean;
}

type LeaveTypeCreation = Optional<LeaveTypeAttrs, "id" | "max_days">;

export class LeaveType extends Model<LeaveTypeAttrs, LeaveTypeCreation>
  implements LeaveTypeAttrs {
  public id!: number;
  public name!: string;
  public is_paid!: boolean;
  public max_days?: number;
  public carry_forward!: boolean;
}

LeaveType.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    is_paid: { type: DataTypes.BOOLEAN, defaultValue: true },
    max_days: { type: DataTypes.INTEGER },
    carry_forward: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: "leave_types",
    timestamps: false,
  }
);