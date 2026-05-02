import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PermissionAttrs {
  id: number;
  code: string;
  name: string;
  module: string;
  resource: string;
  action: "view" | "create" | "update" | "delete" | "approve" | "export";
}

type PermissionCreation = Optional<PermissionAttrs, "id">;

export class Permission extends Model<PermissionAttrs, PermissionCreation> implements PermissionAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
  public module!: string;
  public resource!: string;
  public action!: "view" | "create" | "update" | "delete" | "approve" | "export";
}

Permission.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    module: { type: DataTypes.STRING(50), allowNull: false },
    resource: { type: DataTypes.STRING(100), allowNull: false },
    action: {
      type: DataTypes.ENUM("view", "create", "update", "delete", "approve", "export"),
      allowNull: false,
    },
  },
  { sequelize, tableName: "permissions", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
