import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../../../config/db";

export interface UserAttrs {
  id: number;
  branch_id: number;
  username: string;
  password_hash: string;
  full_name?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  reset_token?: string;
  reset_expires_at?: Date;
}

type UserCreation = Optional<UserAttrs, "id">;

export class User extends Model<UserAttrs, UserCreation> implements UserAttrs {
  public id!: number;
  public branch_id!: number;
  public username!: string;
  public password_hash!: string;
  public full_name?: string;
  public email?: string;
  public phone?: string;
  public is_active!: boolean;
  public reset_token?: string;
  public reset_expires_at?: Date;
}

User.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    reset_token: { type: DataTypes.STRING(255) },
    reset_expires_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "users", timestamps: true , createdAt: "created_at", updatedAt: "updated_at"}
);