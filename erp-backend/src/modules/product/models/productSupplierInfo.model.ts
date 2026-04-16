import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ProductSupplierInfoAttrs {
  id: number;
  product_id: number;
  supplier_id: number;
  supplier_product_code?: string | null;
  supplier_product_name?: string | null;
  min_order_qty?: number | null;
  lead_time_days?: number | null;
  price?: number | null;
  currency_id?: number | null;
  is_preferred: boolean;
}

type ProductSupplierInfoCreation = Optional<
  ProductSupplierInfoAttrs,
  "id" | "is_preferred"
>;

export class ProductSupplierInfo
  extends Model<ProductSupplierInfoAttrs, ProductSupplierInfoCreation>
  implements ProductSupplierInfoAttrs
{
  public id!: number;
  public product_id!: number;
  public supplier_id!: number;
  public supplier_product_code?: string | null;
  public supplier_product_name?: string | null;
  public min_order_qty?: number | null;
  public lead_time_days?: number | null;
  public price?: number | null;
  public currency_id?: number | null;
  public is_preferred!: boolean;
}

ProductSupplierInfo.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    supplier_id: { type: DataTypes.BIGINT, allowNull: false },
    supplier_product_code: { type: DataTypes.STRING(100), allowNull: true },
    supplier_product_name: { type: DataTypes.STRING(255), allowNull: true },
    min_order_qty: { type: DataTypes.DECIMAL(18, 3), allowNull: true },
    lead_time_days: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    is_preferred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "product_supplier_info",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
