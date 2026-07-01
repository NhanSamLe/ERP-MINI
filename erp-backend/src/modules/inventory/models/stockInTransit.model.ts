import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockInTransitAttrs {
  id: number;
  stock_move_id: number;
  product_id: number;
  warehouse_from_id: number;
  warehouse_to_id: number;
  qty: number;
  unit_cost?: number | null;
  lot_id?: number | null;
  location_from_id?: number | null;
  location_to_id?: number | null;
  dispatched_at: Date;
  received_at?: Date | null;
}

type StockInTransitCreation = Optional<
  StockInTransitAttrs,
  "id" | "unit_cost" | "lot_id" | "location_from_id" | "location_to_id" | "received_at"
>;

/**
 * Model đại diện cho hàng hóa đang trên đường vận chuyển.
 * 
 * Vòng đời:
 *   [Tạo] khi Warehouse Manager approve phiếu transfer (Phase 1 — kho nguồn xuất)
 *   [Xóa] khi kho đích confirm nhận hàng (Phase 2 — kho đích cộng tồn kho)
 */
export class StockInTransit
  extends Model<StockInTransitAttrs, StockInTransitCreation>
  implements StockInTransitAttrs
{
  public id!: number;
  public stock_move_id!: number;
  public product_id!: number;
  public warehouse_from_id!: number;
  public warehouse_to_id!: number;
  public qty!: number;
  public unit_cost?: number | null;
  public lot_id?: number | null;
  public location_from_id?: number | null;
  public location_to_id?: number | null;
  public dispatched_at!: Date;
  public received_at?: Date | null;
}

StockInTransit.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    stock_move_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    warehouse_from_id: { type: DataTypes.BIGINT, allowNull: false },
    warehouse_to_id: { type: DataTypes.BIGINT, allowNull: false },
    qty: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
    unit_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    lot_id: { type: DataTypes.BIGINT, allowNull: true },
    location_from_id: { type: DataTypes.BIGINT, allowNull: true },
    location_to_id: { type: DataTypes.BIGINT, allowNull: true },
    dispatched_at: { type: DataTypes.DATE, allowNull: false },
    received_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "stock_in_transit",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
