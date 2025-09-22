import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../../../config/db";
import { Company } from "./company.model";

export interface BranchAttrs {
  id: number;
  company_id: number;
  code: string;
  name: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  tax_code?: string;
  bank_account?: string;
  bank_name?: string;
  status: "active" | "inactive";
}

type BranchCreation = Optional<BranchAttrs, "id" | "status">;

export class Branch extends Model<BranchAttrs, BranchCreation> implements BranchAttrs {
  public id!: number;
  public company_id!: number;
  public code!: string;
  public name!: string;
  public address?: string;
  public province?: string;
  public district?: string;
  public ward?: string;
  public tax_code?: string;
  public bank_account?: string;
  public bank_name?: string;
  public status!: "active" | "inactive";
}

Branch.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.TEXT },
    province: { type: DataTypes.STRING(100) },
    district: { type: DataTypes.STRING(100) },
    ward: { type: DataTypes.STRING(100) },
    tax_code: { type: DataTypes.STRING(50) },
    bank_account: { type: DataTypes.STRING(50) },
    bank_name: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  },
  { sequelize, tableName: "branches", timestamps: true , createdAt: "created_at", updatedAt: "updated_at"}
);

// // Quan hệ
// Company.hasMany(Branch, { foreignKey: "company_id", as: "branches" });
// Branch.belongsTo(Company, { foreignKey: "company_id", as: "company" });