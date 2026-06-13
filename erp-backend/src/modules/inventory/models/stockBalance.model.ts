import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockBalanceAttrs {
  id: number;
  warehouse_id: number;
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
  quantity: number;
  unit_cost?: number | null;
  total_value?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

type StockBalanceCreation = Optional<
  StockBalanceAttrs,
  "id" | "quantity" | "unit_cost" | "total_value" | "location_id" | "lot_id"
>;

export class StockBalance
  extends Model<StockBalanceAttrs, StockBalanceCreation>
  implements StockBalanceAttrs
{
  public id!: number;
  public warehouse_id!: number;
  public product_id!: number;
  public location_id?: number | null;
  public lot_id?: number | null;
  public quantity!: number;
  public unit_cost?: number | null;
  public total_value?: number | null;
  public created_at?: Date;
  public updated_at?: Date;
}

StockBalance.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    location_id: { type: DataTypes.BIGINT, allowNull: true },
    lot_id: { type: DataTypes.BIGINT, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
    unit_cost: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      defaultValue: 0,
    },
    total_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "stock_balances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
