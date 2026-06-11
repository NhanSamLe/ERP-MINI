import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockReservationAttrs {
  id: number;
  product_id: number;
  warehouse_id: number;
  qty: number;
  reference_type: "sale_order" | "transfer";
  reference_id: number;
  status: "active" | "released" | "fulfilled";
  released_at?: Date | null;
  fulfilled_at?: Date | null;
}

type StockReservationCreation = Optional<
  StockReservationAttrs,
  "id" | "status" | "released_at" | "fulfilled_at"
>;

export class StockReservation
  extends Model<StockReservationAttrs, StockReservationCreation>
  implements StockReservationAttrs
{
  public id!: number;
  public product_id!: number;
  public warehouse_id!: number;
  public qty!: number;
  public reference_type!: "sale_order" | "transfer";
  public reference_id!: number;
  public status!: "active" | "released" | "fulfilled";
  public released_at?: Date | null;
  public fulfilled_at?: Date | null;
}

StockReservation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    qty: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
    reference_type: {
      type: DataTypes.ENUM("sale_order", "transfer"),
      allowNull: false,
    },
    reference_id: { type: DataTypes.BIGINT, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "released", "fulfilled"),
      allowNull: false,
      defaultValue: "active",
    },
    released_at: { type: DataTypes.DATE, allowNull: true },
    fulfilled_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "stock_reservations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
