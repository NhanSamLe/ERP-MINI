import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockMoveLineAttrs {
  id: number;
  move_id: number;
  product_id: number;
  quantity?: number;
  uom_id?: number | null;
  location_from_id?: number | null;
  location_to_id?: number | null;
  lot_id?: number | null;
}

type StockMoveLineCreation = Optional<
  StockMoveLineAttrs,
  "id" | "uom_id" | "location_from_id" | "location_to_id" | "lot_id"
>;

export class StockMoveLine
  extends Model<StockMoveLineAttrs, StockMoveLineCreation>
  implements StockMoveLineAttrs
{
  public id!: number;
  public move_id!: number;
  public product_id!: number;
  public quantity?: number;
  public uom_id?: number | null;
  public location_from_id?: number | null;
  public location_to_id?: number | null;
  public lot_id?: number | null;
}

StockMoveLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    move_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(18, 3) },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    location_from_id: { type: DataTypes.BIGINT, allowNull: true },
    location_to_id: { type: DataTypes.BIGINT, allowNull: true },
    lot_id: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    sequelize,
    tableName: "stock_move_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
