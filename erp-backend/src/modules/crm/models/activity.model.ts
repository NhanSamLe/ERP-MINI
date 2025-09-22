import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ActivityAttrs {
  id: number;
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  activity_type: "call" | "email" | "meeting" | "task";
  subject?: string;
  due_at?: Date;
  done: boolean;
  owner_id?: number;
}

type ActivityCreation = Optional<ActivityAttrs, "id" | "done">;

export class Activity extends Model<ActivityAttrs, ActivityCreation> implements ActivityAttrs {
  public id!: number;
  public related_type!: "lead" | "opportunity" | "customer";
  public related_id!: number;
  public activity_type!: "call" | "email" | "meeting" | "task";
  public subject?: string;
  public due_at?: Date;
  public done!: boolean;
  public owner_id?: number;

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
  },
  { sequelize, tableName: "crm_activities", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
