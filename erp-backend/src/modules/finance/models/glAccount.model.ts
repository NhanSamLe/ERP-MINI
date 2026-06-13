import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlAccountAttrs {
  id: number;
  company_id?: number | null;  // NULL = global fallback, number = chart of accounts rieng cong ty
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
  is_active?: boolean;
  parent_id?: number | null;  // Hỗ trợ cây tài khoản cha-con
  description?: string | null;
}

type GlAccountCreation = Optional<GlAccountAttrs, "id" | "company_id" | "is_active" | "parent_id" | "description">;

export class GlAccount extends Model<GlAccountAttrs, GlAccountCreation> implements GlAccountAttrs {
  public id!: number;
  public company_id?: number | null;
  public code!: string;
  public name!: string;
  public type!: "asset" | "liability" | "equity" | "revenue" | "expense";
  public normal_side!: "debit" | "credit";
  public is_active?: boolean;
  public parent_id?: number | null;
  public description?: string | null;
}

GlAccount.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: true, defaultValue: null },
    // (code, company_id) phải unique — mỗi công ty có chart of accounts riêng
    code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM("asset", "liability", "equity", "revenue", "expense"), allowNull: false },
    normal_side: { type: DataTypes.ENUM("debit", "credit"), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    parent_id: { type: DataTypes.BIGINT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "gl_accounts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["company_id", "code"] },
    ],
  }
);
