import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PaymentTermAttrs {
  id: number;
  name: string;
  code: string | null;
  days: number;
  description: string | null;
  is_active: boolean;
  company_id: number | null; // NULL = system template, số = của công ty đó
}

type PaymentTermCreation = Optional<PaymentTermAttrs, "id" | "company_id">;

export class PaymentTerm extends Model<PaymentTermAttrs, PaymentTermCreation> implements PaymentTermAttrs {
  public id!: number;
  public name!: string;
  public code!: string | null;
  public days!: number;
  public description!: string | null;
  public is_active!: boolean;
  public company_id!: number | null;
}

PaymentTerm.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    company_id: { type: DataTypes.BIGINT, allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "payment_terms",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["code", "company_id"] }],
  }
);
