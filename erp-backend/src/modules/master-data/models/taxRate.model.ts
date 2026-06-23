import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface TaxRateAttrs {
  id: number;
  code: string;
  name: string;
  type: "VAT" | "CIT" | "PIT" | "IMPORT" | "EXPORT" | "EXCISE" | "ENVIRONMENTAL" | "OTHER";
  rate: number;
  applies_to: "sale" | "purchase" | "both";
  is_vat: boolean;
  effective_date: Date;
  expiry_date?: Date | null;
  status: "active" | "inactive";
  company_id: number | null; // NULL = chuẩn quốc gia, số = custom của công ty
}

type TaxRateCreation = Optional<TaxRateAttrs, "id" | "is_vat" | "status" | "effective_date" | "expiry_date" | "company_id">;

export class TaxRate extends Model<TaxRateAttrs, TaxRateCreation> implements TaxRateAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
  public type!: TaxRateAttrs["type"];
  public applies_to!: TaxRateAttrs["applies_to"];
  public rate!: number;
  public is_vat!: boolean;
  public effective_date!: Date;
  public expiry_date?: Date | null;
  public status!: "active" | "inactive";
  public company_id!: number | null;
}

TaxRate.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "VAT",
        "CIT",
        "PIT",
        "IMPORT",
        "EXPORT",
        "EXCISE",
        "ENVIRONMENTAL",
        "OTHER"
      ),
      defaultValue: "VAT",
    },
    rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    applies_to: {
      type: DataTypes.ENUM("sale", "purchase", "both"),
      defaultValue: "both",
    },
    is_vat: { type: DataTypes.BOOLEAN, defaultValue: true },
    effective_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expiry_date: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
    company_id: { type: DataTypes.BIGINT, allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "tax_rates",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["code", "company_id"] }],
  }
);
