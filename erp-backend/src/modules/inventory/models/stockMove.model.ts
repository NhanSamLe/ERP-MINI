import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockMoveAttrs {
  id: number;
  move_no: string;
  move_date: Date;
  type: "receipt" | "issue" | "transfer" | "adjustment";
  warehouse_id?: number;
  reference_type?: string;
  reference_id?: number;
  status: "draft" | "posted" | "cancelled";
  note?: string;
}

type StockMoveCreation = Optional<StockMoveAttrs, "id" | "status">;

export class StockMove extends Model<StockMoveAttrs, StockMoveCreation>
  implements StockMoveAttrs {
  public id!: number;
  public move_no!: string;
  public move_date!: Date;
  public type!: "receipt" | "issue" | "transfer" | "adjustment";
  public warehouse_id?: number;
  public reference_type?: string;
  public reference_id?: number;
  public status!: "draft" | "posted" | "cancelled";
  public note?: string;
}

StockMove.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    move_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    move_date: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.ENUM("receipt","issue","transfer","adjustment"), allowNull: false },
    warehouse_id: { type: DataTypes.BIGINT },
    reference_type: { type: DataTypes.STRING(50) },
    reference_id: { type: DataTypes.BIGINT },
    status: { type: DataTypes.ENUM("draft","posted","cancelled"), defaultValue: "draft" },
    note: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: "stock_moves", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
