import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import { Product } from "./product.model";

export interface ProductImageAttrs {
  id: number;
  product_id: number;
  image_url: string;
  image_public_id: string;
}

type ProductImageCreation = Optional<ProductImageAttrs, "id">;

export class ProductImage
  extends Model<ProductImageAttrs, ProductImageCreation>
  implements ProductImageAttrs
{
  public id!: number;
  public product_id!: number;
  public image_url!: string;
  public image_public_id!: string;
}
ProductImage.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    image_url: { type: DataTypes.STRING(255), allowNull: false },
    image_public_id: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    sequelize,
    tableName: "product_images",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
