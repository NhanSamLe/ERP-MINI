import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface AttendanceAttrs {
  id: number;
  branch_id: number;
  employee_id: number;
  work_date: Date;
  check_in?: Date;
  check_out?: Date;
  working_hours?: number;
  status: "present" | "absent" | "leave" | "late";
  note?: string;
}

type AttendanceCreation = Optional<AttendanceAttrs, "id" | "status">;

export class Attendance
  extends Model<AttendanceAttrs, AttendanceCreation>
  implements AttendanceAttrs
{
  id!: number;
  branch_id!: number;
  employee_id!: number;
  work_date!: Date;
  check_in?: Date;
  check_out?: Date;
  working_hours?: number;
  status!: "present" | "absent" | "leave" | "late";
  note?: string;
}

Attendance.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    employee_id: { type: DataTypes.BIGINT, allowNull: false },
    work_date: { type: DataTypes.DATEONLY, allowNull: false },
    check_in: { type: DataTypes.DATE },
    check_out: { type: DataTypes.DATE },
    working_hours: { type: DataTypes.DECIMAL(5, 2) },
    status: {
      type: DataTypes.ENUM("present", "absent", "leave", "late"),
      defaultValue: "present",
    },
    note: { type: DataTypes.STRING(255) },
  },
  {
    sequelize,
    tableName: "attendances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
