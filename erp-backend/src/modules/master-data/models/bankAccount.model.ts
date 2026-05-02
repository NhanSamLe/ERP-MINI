import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface BankAccountAttrs {
  id: number;
  company_id: number | null;
  branch_id: number | null;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_branch: string | null;
  currency_id: number | null;
  gl_account_id: number | null;
  is_default: boolean;
  is_active: boolean;
}

type BankAccountCreation = Optional<BankAccountAttrs, "id">;

export class BankAccount extends Model<BankAccountAttrs, BankAccountCreation> implements BankAccountAttrs {
  public id!: number;
  public company_id!: number | null;
  public branch_id!: number | null;
  public account_name!: string;
  public account_number!: string;
  public bank_name!: string;
  public bank_branch!: string | null;
  public currency_id!: number | null;
  public gl_account_id!: number | null;
  public is_default!: boolean;
  public is_active!: boolean;
}

BankAccount.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: true },
    account_name: { type: DataTypes.STRING(200), allowNull: false },
    account_number: { type: DataTypes.STRING(50), allowNull: false },
    bank_name: { type: DataTypes.STRING(200), allowNull: false },
    bank_branch: { type: DataTypes.STRING(200), allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    gl_account_id: { type: DataTypes.BIGINT, allowNull: true },
    is_default: { type: DataTypes.TINYINT, defaultValue: 0 },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  },
  { sequelize, tableName: "bank_accounts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
