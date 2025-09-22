import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../../../config/db";
export interface UserRoleAttrs {
  user_id: number;
  role_id: number;
}

export class UserRole extends Model<UserRoleAttrs> implements UserRoleAttrs {
  public user_id!: number;
  public role_id!: number;
}

UserRole.init(
  {
    user_id: { type: DataTypes.BIGINT, primaryKey: true },
    role_id: { type: DataTypes.BIGINT, primaryKey: true },
  },
  { sequelize, tableName: "user_roles", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);