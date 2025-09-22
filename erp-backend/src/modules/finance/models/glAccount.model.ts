import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlAccountAttrs {
  id: number;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
}

type GlAccountCreation = Optional<GlAccountAttrs, "id">;

export class GlAccount extends Model<GlAccountAttrs, GlAccountCreation> implements GlAccountAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
  public type!: "asset" | "liability" | "equity" | "revenue" | "expense";
  public normal_side!: "debit" | "credit";
}

GlAccount.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM("asset", "liability", "equity", "revenue", "expense"), allowNull: false },
    normal_side: { type: DataTypes.ENUM("debit", "credit"), allowNull: false },
  },
  { sequelize, tableName: "gl_accounts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
