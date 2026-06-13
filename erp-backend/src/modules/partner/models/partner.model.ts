import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PartnerAttrs {
  id: number;
  company_id?: number | null;
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
  // Phase 1 enhancements
  credit_limit?: number;
  payment_term_id?: number | null;
  currency_id?: number | null;
  is_customer?: boolean;
  is_supplier?: boolean;
  website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  sales_person_id?: number | null;
}

type PartnerCreation = Optional<PartnerAttrs, "id" | "status">;

export class Partner extends Model<PartnerAttrs, PartnerCreation> implements PartnerAttrs {
  public id!: number;
  public company_id?: number | null;
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
  // Phase 1 enhancements
  public credit_limit?: number;
  public payment_term_id?: number | null;
  public currency_id?: number | null;
  public is_customer?: boolean;
  public is_supplier?: boolean;
  public website?: string | null;
  public industry?: string | null;
  public company_size?: string | null;
  public sales_person_id?: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Partner.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: true },
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
    // Phase 1 enhancements
    credit_limit: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    payment_term_id: { type: DataTypes.BIGINT, allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    is_customer: { type: DataTypes.TINYINT, defaultValue: 0 },
    is_supplier: { type: DataTypes.TINYINT, defaultValue: 0 },
    website: { type: DataTypes.STRING(255), allowNull: true },
    industry: { type: DataTypes.STRING(100), allowNull: true },
    company_size: { type: DataTypes.STRING(50), allowNull: true },
    sales_person_id: { type: DataTypes.BIGINT, allowNull: true },
  },
  { 
    sequelize, 
    tableName: "partners", 
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
    hooks: {
      beforeSave: async (partner: Partner, options) => {
        if (partner.type === "customer") {
          partner.is_customer = true;
          partner.is_supplier = false;
        } else if (partner.type === "supplier") {
          partner.is_customer = false;
          partner.is_supplier = true;
        } else if (partner.type === "internal") {
          partner.is_customer = false;
          partner.is_supplier = false;
        }
      },
      afterDestroy: async (partner: Partner, options) => {
        const { Activity } = require("../../../models/index");
        if (Activity) {
          await Activity.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { related_type: 'customer', related_id: partner.id } }
          );
        }
      }
    }
  }
);
