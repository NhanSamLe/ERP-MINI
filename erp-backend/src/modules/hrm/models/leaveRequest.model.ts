import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface LeaveRequestAttrs {
  id: number;
  employee_id: number;
  branch_id: number;
  start_date: string; // DATEONLY is returned as YYYY-MM-DD string
  end_date: string;   // DATEONLY
  half_day: "none" | "morning" | "afternoon";
  leave_type: "annual" | "sick" | "unpaid" | "maternity";
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type LeaveRequestCreation = Optional<
  LeaveRequestAttrs,
  "id" | "half_day" | "leave_type" | "status" | "reason" | "approved_by" | "approved_at"
>;

export class LeaveRequest
  extends Model<LeaveRequestAttrs, LeaveRequestCreation>
  implements LeaveRequestAttrs
{
  public id!: number;
  public employee_id!: number;
  public branch_id!: number;
  public start_date!: string;
  public end_date!: string;
  public half_day!: "none" | "morning" | "afternoon";
  public leave_type!: "annual" | "sick" | "unpaid" | "maternity";
  public reason?: string | null;
  public status!: "pending" | "approved" | "rejected";
  public approved_by?: number | null;
  public approved_at?: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LeaveRequest.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.BIGINT, allowNull: false },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    half_day: {
      type: DataTypes.ENUM("none", "morning", "afternoon"),
      allowNull: false,
      defaultValue: "none",
    },
    leave_type: {
      type: DataTypes.ENUM("annual", "sick", "unpaid", "maternity"),
      allowNull: false,
      defaultValue: "annual",
    },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    approved_by: { type: DataTypes.BIGINT, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "leave_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
