import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../../../config/db"; // sửa path tùy cấu trúc project

export interface CompanyAttrs {
  id: number;
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  phone?: string;
  email?: string;
  website?: string;
  bank_account?: string;
  bank_name?: string;
  // Setup wizard fields
  is_setup_done: boolean;
  logo_url?: string;
  logo_public_id?: string;
  industry?: string;
  employee_count?: string;
  fiscal_year_start_month: number;
  default_currency: string;
}

type CompanyCreation = Optional<CompanyAttrs, "id" | "is_setup_done" | "fiscal_year_start_month" | "default_currency">;

export class Company extends Model<CompanyAttrs, CompanyCreation> implements CompanyAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
  public tax_code?: string;
  public address?: string;
  public province?: string;
  public district?: string;
  public ward?: string;
  public phone?: string;
  public email?: string;
  public website?: string;
  public bank_account?: string;
  public bank_name?: string;
  // Setup wizard fields
  public is_setup_done!: boolean;
  public logo_url?: string;
  public logo_public_id?: string;
  public industry?: string;
  public employee_count?: string;
  public fiscal_year_start_month!: number;
  public default_currency!: string;
}

Company.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    tax_code: { type: DataTypes.STRING(50) },
    address: { type: DataTypes.TEXT },
    province: { type: DataTypes.STRING(100) },
    district: { type: DataTypes.STRING(100) },
    ward: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    website: { type: DataTypes.STRING(100) },
    bank_account: { type: DataTypes.STRING(50) },
    bank_name: { type: DataTypes.STRING(100) },
    // Setup wizard fields
    is_setup_done: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    logo_public_id: { type: DataTypes.STRING(255), allowNull: true },
    industry: { type: DataTypes.STRING(100), allowNull: true },
    employee_count: { type: DataTypes.STRING(20), allowNull: true },
    fiscal_year_start_month: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
    default_currency: { type: DataTypes.STRING(10), defaultValue: 'VND', allowNull: false },
  },
  { sequelize, tableName: "companies", timestamps: true , createdAt: "created_at", updatedAt: "updated_at"}
);
