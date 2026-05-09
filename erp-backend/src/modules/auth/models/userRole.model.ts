import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface UserRoleAttrs {
  id: number;
  user_id: number;
  role_id: number;
}

type UserRoleCreation = Optional<UserRoleAttrs, "id">;

export class UserRole extends Model<UserRoleAttrs, UserRoleCreation> implements UserRoleAttrs {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
}

UserRole.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    role_id: { type: DataTypes.BIGINT, allowNull: false },
  },
  { sequelize, tableName: "user_roles", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
