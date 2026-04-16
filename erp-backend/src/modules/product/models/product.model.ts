import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import { ProductCategory } from "./productCategory.model";
import { TaxRate } from "../../master-data/models/taxRate.model";
import { ProductImage } from "./productImage.model";

export interface ProductAttrs {
  id: number;
  category_id?: number;
  sku: string;
  name: string;
  barcode?: string;
  // UOM
  uom_id?: number | null;
  purchase_uom_id?: number | null;
  // Product type, source & stock
  product_type?: "storable" | "consumable" | "service";
  source_type?: "purchased" | "manufactured";
  min_stock_qty?: number | null;
  // Extra attributes
  internal_ref?: string | null;
  weight?: number | null;
  volume?: number | null;
  warranty_months?: number | null;
  notes?: string | null;
  // Pricing
  origin?: string;
  cost_price?: number;
  sale_price?: number;
  tax_rate_id?: number;
  status: "active" | "inactive";
  image_url?: string | null;
  image_public_id?: string | null;
  description?: string | null;
  images?: ProductImage[];
}

type ProductCreation = Optional<
  ProductAttrs,
  "id" | "status" | "product_type" | "source_type"
>;

export class Product
  extends Model<ProductAttrs, ProductCreation>
  implements ProductAttrs
{
  public id!: number;
  public category_id?: number;
  public sku!: string;
  public name!: string;
  public barcode?: string;
  public uom_id?: number | null;
  public purchase_uom_id?: number | null;
  public product_type?: "storable" | "consumable" | "service";
  public source_type?: "purchased" | "manufactured";
  public min_stock_qty?: number | null;
  public internal_ref?: string | null;
  public weight?: number | null;
  public volume?: number | null;
  public warranty_months?: number | null;
  public notes?: string | null;
  public origin?: string;
  public cost_price?: number;
  public sale_price?: number;
  public tax_rate_id?: number;
  public status!: "active" | "inactive";
  public image_url?: string | null;
  public image_public_id?: string | null;
  public description?: string | null;
  public images?: ProductImage[];
}

Product.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT },
    sku: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    barcode: { type: DataTypes.STRING(100) },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    purchase_uom_id: { type: DataTypes.BIGINT, allowNull: true },
    product_type: {
      type: DataTypes.ENUM("storable", "consumable", "service"),
      allowNull: false,
      defaultValue: "storable",
    },
    source_type: {
      type: DataTypes.ENUM("purchased", "manufactured"),
      allowNull: false,
      defaultValue: "purchased",
    },
    min_stock_qty: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: true,
      defaultValue: 0,
    },
    internal_ref: { type: DataTypes.STRING(100), allowNull: true },
    weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    volume: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    warranty_months: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    origin: { type: DataTypes.STRING(100) },
    cost_price: { type: DataTypes.DECIMAL(18, 2) },
    sale_price: { type: DataTypes.DECIMAL(18, 2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    image_url: { type: DataTypes.STRING(255), allowNull: true },
    image_public_id: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// // Quan hệ
// Product.belongsTo(ProductCategory, { foreignKey: "category_id", as: "category" });
// ProductCategory.hasMany(Product, { foreignKey: "category_id", as: "products" });

// Product.belongsTo(TaxRate, { foreignKey: "tax_rate_id", as: "taxRate" });
// TaxRate.hasMany(Product, { foreignKey: "tax_rate_id", as: "products" });
