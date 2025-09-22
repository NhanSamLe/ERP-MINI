import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface CurrencyAttrs {
  id: number;
  code: string;
  name?: string;
  symbol?: string;
}

type CurrencyCreation = Optional<CurrencyAttrs, "id">;

export class Currency extends Model<CurrencyAttrs, CurrencyCreation> implements CurrencyAttrs {
  public id!: number;
  public code!: string;
  public name?: string;
  public symbol?: string;
}

Currency.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.CHAR(3), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100) },
    symbol: { type: DataTypes.STRING(10) },
  },
  { sequelize, tableName: "currencies", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
