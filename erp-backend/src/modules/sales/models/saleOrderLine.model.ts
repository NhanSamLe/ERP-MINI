import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface SaleOrderLineAttrs {
  id: number;
  order_id: number;
  product_id?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate_id?: number;
  line_total?: number;
}

type SaleOrderLineCreation = Optional<SaleOrderLineAttrs, "id">;

export class SaleOrderLine extends Model<SaleOrderLineAttrs, SaleOrderLineCreation> implements SaleOrderLineAttrs {
  public id!: number;
  public order_id!: number;
  public product_id?: number;
  public description?: string;
  public quantity?: number;
  public unit_price?: number;
  public tax_rate_id?: number;
  public line_total?: number;
}

SaleOrderLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT },
    description: { type: DataTypes.STRING(255) },
    quantity: { type: DataTypes.DECIMAL(18,3) },
    unit_price: { type: DataTypes.DECIMAL(18,2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    line_total: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "sale_order_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
