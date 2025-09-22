import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface TaxRateAttrs {
  id: number;
  code: string;
  name: string;
  rate: number;
  is_vat: boolean;
  effective_date: Date;
  status: "active" | "inactive";
}

type TaxRateCreation = Optional<TaxRateAttrs, "id" | "is_vat" | "status" | "effective_date">;

export class TaxRate extends Model<TaxRateAttrs, TaxRateCreation> implements TaxRateAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
  public rate!: number;
  public is_vat!: boolean;
  public effective_date!: Date;
  public status!: "active" | "inactive";
}

TaxRate.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    is_vat: { type: DataTypes.BOOLEAN, defaultValue: true },
    effective_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  },
  { sequelize, tableName: "tax_rates", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);