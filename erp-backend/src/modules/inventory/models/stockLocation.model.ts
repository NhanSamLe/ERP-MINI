import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type StockLocationType =
  | "view"
  | "internal"
  | "input"
  | "output"
  | "customer"
  | "supplier"
  | "transit";

export interface StockLocationAttrs {
  id: number;
  warehouse_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  type: StockLocationType;
  is_active: boolean;
  path?: string | null;
}

type StockLocationCreation = Optional<
  StockLocationAttrs,
  "id" | "is_active" | "parent_id" | "path"
>;

export class StockLocation
  extends Model<StockLocationAttrs, StockLocationCreation>
  implements StockLocationAttrs
{
  public id!: number;
  public warehouse_id!: number;
  public parent_id?: number | null;
  public name!: string;
  public code!: string;
  public type!: StockLocationType;
  public is_active!: boolean;
  public path?: string | null;
}

StockLocation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    parent_id: { type: DataTypes.BIGINT, allowNull: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM(
        "view",
        "internal",
        "input",
        "output",
        "customer",
        "supplier",
        "transit",
      ),
      allowNull: false,
      defaultValue: "internal",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    path: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    tableName: "stock_locations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
