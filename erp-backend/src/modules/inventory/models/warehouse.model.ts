import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface WarehouseAttrs {
  id: number;
  branch_id?: number;
  code: string;
  name: string;
  address?: string;
}

type WarehouseCreation = Optional<WarehouseAttrs, "id">;

export class Warehouse extends Model<WarehouseAttrs, WarehouseCreation>
  implements WarehouseAttrs {
  public id!: number;
  public branch_id?: number;
  public code!: string;
  public name!: string;
  public address?: string;
}

Warehouse.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT },
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: "warehouses", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
