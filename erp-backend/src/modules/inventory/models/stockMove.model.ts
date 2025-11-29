import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface StockMoveAttrs {
  id: number;
  move_no: string;
  move_date: Date;
  type: "receipt" | "issue" | "transfer" | "adjustment";
  warehouse_from_id?: number | null;
  warehouse_to_id?: number | null;
  reference_type?: "purchase_order" | "sale_order" | "transfer" | "adjustment";
  reference_id?: number | null;
  status: "draft" | "posted" | "cancelled";
  note?: string;
}

type StockMoveCreation = Optional<StockMoveAttrs, "id" | "status">;

export class StockMove
  extends Model<StockMoveAttrs, StockMoveCreation>
  implements StockMoveAttrs
{
  public id!: number;
  public move_no!: string;
  public move_date!: Date;
  public type!: "receipt" | "issue" | "transfer" | "adjustment";
  public warehouse_from_id?: number | null;
  public warehouse_to_id?: number | null;
  public reference_type?:
    | "purchase_order"
    | "sale_order"
    | "transfer"
    | "adjustment";
  public reference_id?: number | null;
  public status!: "draft" | "posted" | "cancelled";
  public note?: string;
}

StockMove.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    move_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    move_date: { type: DataTypes.DATE, allowNull: false },
    type: {
      type: DataTypes.ENUM("receipt", "issue", "transfer", "adjustment"),
      allowNull: false,
    },
    warehouse_from_id: { type: DataTypes.BIGINT, allowNull: true },
    warehouse_to_id: { type: DataTypes.BIGINT, allowNull: true },
    reference_type: {
      type: DataTypes.ENUM(
        "purchase_order",
        "sale_order",
        "transfer",
        "adjustment"
      ),
      allowNull: false,
    },
    reference_id: { type: DataTypes.BIGINT, allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "posted", "cancelled"),
      defaultValue: "draft",
    },
    note: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    tableName: "stock_moves",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
