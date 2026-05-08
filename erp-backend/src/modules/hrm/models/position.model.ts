import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PositionAttrs {
  id: number;
  branch_id: number;
  name: string;
  status: "active" | "inactive";
}

type PositionCreation = Optional<PositionAttrs, "id" | "status">;

export class Position extends Model<PositionAttrs, PositionCreation> implements PositionAttrs {
  public id!: number;
  public branch_id!: number;
  public name!: string;
  public status!: "active" | "inactive";
}

Position.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" }
  },
  { sequelize, tableName: "positions", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
