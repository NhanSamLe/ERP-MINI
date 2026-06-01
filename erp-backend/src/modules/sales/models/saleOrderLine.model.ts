import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SaleOrderLineAttrs {
  id: number;
  order_id: number;
  product_id?: number;
  description?: string;
  quantity?: number;
  uom_id?: number | null;
  unit_price?: number;
  tax_rate_id?: number;
  line_total?: number;
  line_tax?: number;              // line_total * tax_rate%
  line_total_after_tax?: number;  // line_total + line_tax
  discount_percent?: number;
  discount_amount?: number;
}

type SaleOrderLineCreation = Optional<SaleOrderLineAttrs, "id">;

export class SaleOrderLine extends Model<SaleOrderLineAttrs, SaleOrderLineCreation> implements SaleOrderLineAttrs {
  public id!: number;
  public order_id!: number;
  public product_id?: number;
  public description?: string;
  public quantity?: number;
  public uom_id?: number | null;
  public unit_price?: number;
  public tax_rate_id?: number;
  public line_total?: number;
  public line_tax?: number;
  public line_total_after_tax?: number;
  public discount_percent?: number;
  public discount_amount?: number;
}

SaleOrderLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT },
    description: { type: DataTypes.STRING(255) },
    quantity: { type: DataTypes.DECIMAL(18,3) },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    unit_price: { type: DataTypes.DECIMAL(18,2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    line_total: { type: DataTypes.DECIMAL(18,2) },
    line_tax: { type: DataTypes.DECIMAL(18, 2) },
    line_total_after_tax: { type: DataTypes.DECIMAL(18, 2) },
    discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  },
  { sequelize, tableName: "sale_order_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
