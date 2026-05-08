import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseOrderLineAttrs {
  id: number;
  po_id: number;
  product_id?: number;
  quantity?: number;
  uom_id?: number;
  qty_in_stock_uom?: number;
  unit_price?: number;
  discount?: number;
  tax_rate_id?: number;
  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
}

type PurchaseOrderLineCreation = Optional<PurchaseOrderLineAttrs, "id">;

export class PurchaseOrderLine
  extends Model<PurchaseOrderLineAttrs, PurchaseOrderLineCreation>
  implements PurchaseOrderLineAttrs
{
  public id!: number;
  public po_id!: number;
  public product_id?: number;
  public quantity?: number;
  public uom_id?: number;
  public qty_in_stock_uom?: number;
  public unit_price?: number;
  public discount?: number;
  public tax_rate_id?: number;
  public line_total?: number;
  public line_tax?: number;
  public line_total_after_tax?: number;
}

PurchaseOrderLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT },
    quantity: { type: DataTypes.DECIMAL(18, 3) },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    qty_in_stock_uom: { type: DataTypes.DECIMAL(18, 3), allowNull: true },
    unit_price: { type: DataTypes.DECIMAL(18, 2) },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    tax_rate_id: { type: DataTypes.BIGINT },
    line_total: { type: DataTypes.DECIMAL(18, 2) },
    line_tax: { type: DataTypes.DECIMAL(18, 2) },
    line_total_after_tax: { type: DataTypes.DECIMAL(18, 2) },
  },
  {
    sequelize,
    tableName: "purchase_order_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
