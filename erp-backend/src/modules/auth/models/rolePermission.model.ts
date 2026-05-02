import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface RolePermissionAttrs {
  id: number;
  role_id: number;
  permission_id: number;
}

type RolePermissionCreation = Optional<RolePermissionAttrs, "id">;

export class RolePermission extends Model<RolePermissionAttrs, RolePermissionCreation> implements RolePermissionAttrs {
  public id!: number;
  public role_id!: number;
  public permission_id!: number;
}

RolePermission.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.BIGINT, allowNull: false },
    permission_id: { type: DataTypes.BIGINT, allowNull: false },
  },
  { sequelize, tableName: "role_permissions", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
