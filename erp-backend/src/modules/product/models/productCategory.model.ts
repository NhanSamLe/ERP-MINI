import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ProductCategoryAttrs {
  id: number;
  name: string;
  parent_id?: number;
  status: boolean;
}

type ProductCategoryCreation = Optional<ProductCategoryAttrs, "id">;

export class ProductCategory
  extends Model<ProductCategoryAttrs, ProductCategoryCreation>
  implements ProductCategoryAttrs
{
  public id!: number;
  public name!: string;
  public parent_id?: number;
  public status!: boolean;
}

ProductCategory.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    parent_id: { type: DataTypes.BIGINT },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "product_categories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// // Self-relation
// ProductCategory.hasMany(ProductCategory, { foreignKey: "parent_id", as: "children" });
// ProductCategory.belongsTo(ProductCategory, { foreignKey: "parent_id", as: "parent" });
