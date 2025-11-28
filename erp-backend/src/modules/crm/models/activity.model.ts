import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ActivityAttrs {
  id: number;
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  activity_type: "call" | "email" | "meeting" | "task";
  subject?: string;
  due_at?: Date | null;
  done: boolean;
  owner_id?: number;
  notes?: string | null;
  completed_at?: Date | null;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | null;
  is_auto?: boolean;   
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by?: number | null;
}

type ActivityCreation = Optional<ActivityAttrs, "id" | "done">;

export class Activity extends Model<ActivityAttrs, ActivityCreation> implements ActivityAttrs {
  public id!: number;
  public related_type!: "lead" | "opportunity" | "customer";
  public related_id!: number;
  public activity_type!: "call" | "email" | "meeting" | "task";
  public subject?: string;
  public due_at?: Date | null;
  public done!: boolean;
  public completed_at?: Date | null;  
  public owner_id?: number;
  public notes?: string;
  public status!: "pending" | "in_progress" | "completed" | "cancelled";
  public priority?: "low" | "medium" | "high";
  public is_auto?: boolean;  
  public is_deleted?: boolean;
  public deleted_at?: Date | null;
  public deleted_by?: number | null; 
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Activity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    related_type: { type: DataTypes.ENUM("lead", "opportunity", "customer"), allowNull: false },
    related_id: { type: DataTypes.BIGINT, allowNull: false },
    activity_type: { type: DataTypes.ENUM("call", "email", "meeting", "task"), allowNull: false },
    subject: { type: DataTypes.STRING(255) },
    due_at: { type: DataTypes.DATE },
    done: { type: DataTypes.BOOLEAN, defaultValue: false },
    owner_id: { type: DataTypes.BIGINT },
    notes: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "cancelled"),
      defaultValue: "pending",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: true,
    },
    completed_at: { type: DataTypes.DATE },
    is_auto: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    deleted_at: { type: DataTypes.DATE },
    deleted_by: { type: DataTypes.BIGINT },
  },
  { sequelize, tableName: "crm_activities", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
