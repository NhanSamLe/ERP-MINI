import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockLotAttrs {
  id: number;
  product_id: number;
  lot_no: string;
  serial_no?: string | null;
  manufacture_date?: string | null; // DATEONLY → string 'YYYY-MM-DD'
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
}

type StockLotCreation = Optional<
  StockLotAttrs,
  | "id"
  | "serial_no"
  | "manufacture_date"
  | "expiry_date"
  | "supplier_id"
  | "notes"
>;

export class StockLot
  extends Model<StockLotAttrs, StockLotCreation>
  implements StockLotAttrs
{
  public id!: number;
  public product_id!: number;
  public lot_no!: string;
  public serial_no?: string | null;
  public manufacture_date?: string | null;
  public expiry_date?: string | null;
  public supplier_id?: number | null;
  public notes?: string | null;
}

StockLot.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    lot_no: { type: DataTypes.STRING(100), allowNull: false },
    serial_no: { type: DataTypes.STRING(100), allowNull: true },
    manufacture_date: { type: DataTypes.DATEONLY, allowNull: true },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "stock_lots",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
