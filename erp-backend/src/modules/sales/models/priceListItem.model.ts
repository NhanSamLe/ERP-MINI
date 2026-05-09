import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface PriceListItemAttrs { id: number; price_list_id: number; product_id: number; min_quantity: number; unit_price: number; discount_percent: number; start_date: string | null; end_date: string | null; }
type PriceListItemCreation = Optional<PriceListItemAttrs, "id">;
export class PriceListItem extends Model<PriceListItemAttrs, PriceListItemCreation> implements PriceListItemAttrs {
  public id!: number; public price_list_id!: number; public product_id!: number; public min_quantity!: number; public unit_price!: number; public discount_percent!: number; public start_date!: string | null; public end_date!: string | null;
}
PriceListItem.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  price_list_id: { type: DataTypes.BIGINT, allowNull: false },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  min_quantity: { type: DataTypes.DECIMAL(18, 3), defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
}, { sequelize, tableName: "price_list_items", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
