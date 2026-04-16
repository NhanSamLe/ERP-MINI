import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PhysicalInventoryLineAttrs {
  id: number;
  inventory_id: number;
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
  theoretical_qty: number;
  counted_qty: number;
  difference_qty: number;
  unit_cost?: number | null;
}

type PhysicalInventoryLineCreation = Optional<
  PhysicalInventoryLineAttrs,
  | "id"
  | "theoretical_qty"
  | "counted_qty"
  | "difference_qty"
  | "location_id"
  | "lot_id"
  | "unit_cost"
>;

export class PhysicalInventoryLine
  extends Model<PhysicalInventoryLineAttrs, PhysicalInventoryLineCreation>
  implements PhysicalInventoryLineAttrs
{
  public id!: number;
  public inventory_id!: number;
  public product_id!: number;
  public location_id?: number | null;
  public lot_id?: number | null;
  public theoretical_qty!: number;
  public counted_qty!: number;
  public difference_qty!: number;
  public unit_cost?: number | null;
}

PhysicalInventoryLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    inventory_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    location_id: { type: DataTypes.BIGINT, allowNull: true },
    lot_id: { type: DataTypes.BIGINT, allowNull: true },
    theoretical_qty: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
    },
    counted_qty: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
    },
    difference_qty: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
    },
    unit_cost: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  },
  {
    sequelize,
    tableName: "physical_inventory_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
