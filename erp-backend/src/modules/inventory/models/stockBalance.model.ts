import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockBalanceAttrs {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity: number;
}

type StockBalanceCreation = Optional<StockBalanceAttrs, "id" | "quantity">;

export class StockBalance extends Model<StockBalanceAttrs, StockBalanceCreation>
  implements StockBalanceAttrs {
  public id!: number;
  public warehouse_id!: number;
  public product_id!: number;
  public quantity!: number;
}

StockBalance.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(18,3), defaultValue: 0 },
  },
  { sequelize, tableName: "stock_balances", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
