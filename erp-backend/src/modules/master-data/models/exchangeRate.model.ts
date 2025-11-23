import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import { Currency } from "./currency.model";

export interface ExchangeRateAttrs {
  id: number;
  base_currency_id: number;
  quote_currency_id: number;
  rate: number;
  valid_date: string;
}

type ExchangeRateCreation = Optional<ExchangeRateAttrs, "id">;

export class ExchangeRate extends Model<ExchangeRateAttrs, ExchangeRateCreation> implements ExchangeRateAttrs {
  public id!: number;
  public base_currency_id!: number;
  public quote_currency_id!: number;
  public rate!: number;
  public valid_date!: string;
}

ExchangeRate.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    base_currency_id: { type: DataTypes.BIGINT, allowNull: false },
    quote_currency_id: { type: DataTypes.BIGINT, allowNull: false },
    rate: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
    valid_date: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { sequelize, tableName: "exchange_rates", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

// // Quan hệ
// Currency.hasMany(ExchangeRate, { foreignKey: "base_currency_id", as: "baseRates" });
// Currency.hasMany(ExchangeRate, { foreignKey: "quote_currency_id", as: "quoteRates" });
// ExchangeRate.belongsTo(Currency, { foreignKey: "base_currency_id", as: "baseCurrency" });
// ExchangeRate.belongsTo(Currency, { foreignKey: "quote_currency_id", as: "quoteCurrency" });
