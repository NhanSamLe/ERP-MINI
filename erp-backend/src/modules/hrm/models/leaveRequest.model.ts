import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface LeaveRequestAttrs {
  id: number;
  employee_id: number;
  leave_type_id: number;
  from_date: Date;
  to_date: Date;
  total_days: number;
  reason?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: number;
}

type Creation = Optional<
  LeaveRequestAttrs,
  "id" | "status" | "approved_by"
>;

export class LeaveRequest extends Model<
  LeaveRequestAttrs,
  Creation
> implements LeaveRequestAttrs {
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public from_date!: Date;
  public to_date!: Date;
  public total_days!: number;
  public reason?: string;
  public status!: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  public approved_by?: number;
}

LeaveRequest.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.BIGINT, allowNull: false },
    leave_type_id: { type: DataTypes.BIGINT, allowNull: false },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    total_days: { type: DataTypes.DECIMAL(5,1), allowNull: false },
    reason: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "approved",
        "rejected",
        "cancelled"
      ),
      defaultValue: "draft",
    },
    approved_by: { type: DataTypes.BIGINT },
  },
  {
    sequelize,
    tableName: "leave_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);