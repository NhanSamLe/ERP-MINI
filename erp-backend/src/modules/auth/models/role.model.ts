import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../../../config/db";
export interface RoleAttrs {
  id: number;
  code: string;
  name: string;
}

type RoleCreation = Optional<RoleAttrs, "id">;

export class Role extends Model<RoleAttrs, RoleCreation> implements RoleAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
}

Role.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: "roles", timestamps: true ,   createdAt: "created_at", updatedAt: "updated_at"}
);