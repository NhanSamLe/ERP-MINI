import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface PriceListAttrs { id: number; name: string; code: string | null; currency_id: number | null; type: "sales"|"purchase"; is_active: boolean; start_date: string | null; end_date: string | null; }
type PriceListCreation = Optional<PriceListAttrs, "id">;
export class PriceList extends Model<PriceListAttrs, PriceListCreation> implements PriceListAttrs {
  public id!: number; public name!: string; public code!: string | null; public currency_id!: number | null; public type!: "sales"|"purchase"; public is_active!: boolean; public start_date!: string | null; public end_date!: string | null;
}
PriceList.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(20), unique: true },
  currency_id: { type: DataTypes.BIGINT },
  type: { type: DataTypes.ENUM("sales","purchase"), defaultValue: "sales" },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
}, { sequelize, tableName: "price_lists", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
