import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PositionAttrs {
  id: number;
  branch_id: number;
  name: string;
}

type PositionCreation = Optional<PositionAttrs, "id">;

export class Position extends Model<PositionAttrs, PositionCreation> implements PositionAttrs {
  public id!: number;
  public branch_id!: number;
  public name!: string;
}

Position.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false }
  },
  { sequelize, tableName: "positions", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
