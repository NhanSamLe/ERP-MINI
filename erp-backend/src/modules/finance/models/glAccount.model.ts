import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlAccountAttrs {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
  is_group: boolean;
  level: number;
  reconcile: boolean;
  is_active: boolean;
  description: string | null;
}

type GlAccountCreation = Optional<
  GlAccountAttrs,
  "id" | "parent_id" | "is_group" | "level" | "reconcile" | "is_active" | "description"
>;

export class GlAccount
  extends Model<GlAccountAttrs, GlAccountCreation>
  implements GlAccountAttrs
{
  public id!: number;
  public parent_id!: number | null;
  public code!: string;
  public name!: string;
  public type!: "asset" | "liability" | "equity" | "revenue" | "expense";
  public normal_side!: "debit" | "credit";
  public is_group!: boolean;
  public level!: number;
  public reconcile!: boolean;
  public is_active!: boolean;
  public description!: string | null;

  // virtual — populated khi include children
  public children?: GlAccount[];
}

GlAccount.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    parent_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
      references: { model: "gl_accounts", key: "id" },
    },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.ENUM("asset", "liability", "equity", "revenue", "expense"),
      allowNull: false,
    },
    normal_side: {
      type: DataTypes.ENUM("debit", "credit"),
      allowNull: false,
    },
    is_group: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    level: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
    reconcile: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "gl_accounts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
