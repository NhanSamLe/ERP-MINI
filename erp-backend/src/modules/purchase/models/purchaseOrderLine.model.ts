import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseOrderLineAttrs {
  id: number;
  po_id: number;
  product_id?: number;
  quantity?: number;
  unit_price?: number;
  tax_rate_id?: number;
  line_total?: number;
}

type PurchaseOrderLineCreation = Optional<PurchaseOrderLineAttrs, "id">;

export class PurchaseOrderLine extends Model<PurchaseOrderLineAttrs, PurchaseOrderLineCreation>
  implements PurchaseOrderLineAttrs {
  public id!: number;
  public po_id!: number;
  public product_id?: number;
  public quantity?: number;
  public unit_price?: number;
  public tax_rate_id?: number;
  public line_total?: number;
}

PurchaseOrderLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT },
    quantity: { type: DataTypes.DECIMAL(18,3) },
    unit_price: { type: DataTypes.DECIMAL(18,2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    line_total: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "purchase_order_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
