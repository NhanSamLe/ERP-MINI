import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PartnerAttrs {
  id: number;
  type: "customer" | "supplier" | "internal";
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_code?: string | null;
  cccd?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  status: "active" | "inactive";
}

type PartnerCreation = Optional<PartnerAttrs, "id" | "status">;

export class Partner extends Model<PartnerAttrs, PartnerCreation> implements PartnerAttrs {
  public id!: number;
  public type!: "customer" | "supplier" | "internal";
  public name!: string;
  public contact_person?: string;
  public phone?: string;
  public email?: string;
  public tax_code?: string;
  public cccd?: string;
  public address?: string;
  public province?: string;
  public district?: string;
  public ward?: string;
  public bank_account?: string;
  public bank_name?: string;
  public status!: "active" | "inactive";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Partner.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM("customer", "supplier", "internal"), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    contact_person: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    tax_code: { type: DataTypes.STRING(50) },
    cccd: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.TEXT },
    province: { type: DataTypes.STRING(100) },
    district: { type: DataTypes.STRING(100) },
    ward: { type: DataTypes.STRING(100) },
    bank_account: { type: DataTypes.STRING(50) },
    bank_name: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  },
  { sequelize, tableName: "partners", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
