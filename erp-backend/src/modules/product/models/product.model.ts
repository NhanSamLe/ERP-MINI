import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import { ProductCategory } from "./productCategory.model";
import { TaxRate } from "../../master-data/models/taxRate.model";

export interface ProductAttrs {
  id: number;
  category_id?: number;
  sku: string;
  name: string;
  barcode?: string;
  uom?: string;
  origin?: string;
  cost_price?: number;
  sale_price?: number;
  tax_rate_id?: number;
  status: "active" | "inactive";
}

type ProductCreation = Optional<ProductAttrs, "id" | "status">;

export class Product extends Model<ProductAttrs, ProductCreation> implements ProductAttrs {
  public id!: number;
  public category_id?: number;
  public sku!: string;
  public name!: string;
  public barcode?: string;
  public uom?: string;
  public origin?: string;
  public cost_price?: number;
  public sale_price?: number;
  public tax_rate_id?: number;
  public status!: "active" | "inactive";
}

Product.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT },
    sku: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    barcode: { type: DataTypes.STRING(100) },
    uom: { type: DataTypes.STRING(50) },
    origin: { type: DataTypes.STRING(100) },
    cost_price: { type: DataTypes.DECIMAL(18, 2) },
    sale_price: { type: DataTypes.DECIMAL(18, 2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  },
  { sequelize, tableName: "products", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

// // Quan hệ
// Product.belongsTo(ProductCategory, { foreignKey: "category_id", as: "category" });
// ProductCategory.hasMany(Product, { foreignKey: "category_id", as: "products" });

// Product.belongsTo(TaxRate, { foreignKey: "tax_rate_id", as: "taxRate" });
// TaxRate.hasMany(Product, { foreignKey: "tax_rate_id", as: "products" });
