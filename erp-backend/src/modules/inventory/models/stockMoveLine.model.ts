import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockMoveLineAttrs {
  id: number;
  move_id: number;
  product_id: number;
  quantity?: number;
  uom?: string;
}

type StockMoveLineCreation = Optional<StockMoveLineAttrs, "id">;

export class StockMoveLine extends Model<StockMoveLineAttrs, StockMoveLineCreation>
  implements StockMoveLineAttrs {
  public id!: number;
  public move_id!: number;
  public product_id!: number;
  public quantity?: number;
  public uom?: string;
}

StockMoveLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    move_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(18,3) },
    uom: { type: DataTypes.STRING(50) },
  },
  { sequelize, tableName: "stock_move_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
