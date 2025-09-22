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
}

type CompanyCreation = Optional<CompanyAttrs, "id">;

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
  },
  { sequelize, tableName: "companies", timestamps: true , createdAt: "created_at", updatedAt: "updated_at"}
);
