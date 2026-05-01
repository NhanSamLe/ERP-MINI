import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import { Uom } from "./uom.model";

export interface UomConversionAttrs {
  id: number;
  product_id?: number | null;
  from_uom_id: number;
  to_uom_id: number;
  factor: number;
}

type UomConversionCreation = Optional<UomConversionAttrs, "id" | "product_id">;

export class UomConversion
  extends Model<UomConversionAttrs, UomConversionCreation>
  implements UomConversionAttrs
{
  public id!: number;
  public product_id?: number | null;
  public from_uom_id!: number;
  public to_uom_id!: number;
  public factor!: number;
}

UomConversion.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    from_uom_id: { type: DataTypes.BIGINT, allowNull: false },
    to_uom_id: { type: DataTypes.BIGINT, allowNull: false },
    factor: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
  },
  {
    sequelize,
    tableName: "uom_conversions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// // Quan hệ
// Uom.hasMany(UomConversion, { foreignKey: "from_uom_id", as: "fromConversions" });
// Uom.hasMany(UomConversion, { foreignKey: "to_uom_id", as: "toConversions" });
// UomConversion.belongsTo(Uom, { foreignKey: "from_uom_id", as: "fromUom" });
// UomConversion.belongsTo(Uom, { foreignKey: "to_uom_id", as: "toUom" });
