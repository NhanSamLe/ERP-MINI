import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface TaskActivityAttrs {
  id: number;
  activity_id: number;
  status?: "Not Started" | "In Progress" | "Completed" | null;
  reminder_at?: Date | null;
}

type TaskActivityCreation = Optional<TaskActivityAttrs, "id">;

export class TaskActivity
  extends Model<TaskActivityAttrs, TaskActivityCreation>
  implements TaskActivityAttrs
{
  public id!: number;
  public activity_id!: number;
  public status?: "Not Started" | "In Progress" | "Completed" | null;
  public reminder_at?: Date | null;
}

TaskActivity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    activity_id: { type: DataTypes.BIGINT, allowNull: false },
    status: {
      type: DataTypes.ENUM("Not Started", "In Progress", "Completed"),
      defaultValue: "Not Started",
    },
    reminder_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "crm_activity_tasks",
    timestamps: false,
  }
);
