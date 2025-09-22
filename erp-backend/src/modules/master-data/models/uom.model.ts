import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface UomAttrs {
  id: number;
  code: string;
  name: string;
}

type UomCreation = Optional<UomAttrs, "id">;

export class Uom extends Model<UomAttrs, UomCreation> implements UomAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
}

Uom.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
  },
  { sequelize, tableName: "uoms", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
