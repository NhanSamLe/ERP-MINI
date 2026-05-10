import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseRfqLineAttrs {
  id: number;
  rfq_id: number;
  product_id: number;
  description?: string | null;
  quantity: number;
  uom_id?: number | null;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate_id?: number | null;
  line_total: number;
  line_tax: number;
  line_total_after_tax: number;
  lead_time_days?: number | null;
}

type PurchaseRfqLineCreation = Optional<
  PurchaseRfqLineAttrs,
  | "id"
  | "unit_price"
  | "discount_percent"
  | "discount_amount"
  | "line_total"
  | "line_tax"
  | "line_total_after_tax"
>;

export class PurchaseRfqLine
  extends Model<PurchaseRfqLineAttrs, PurchaseRfqLineCreation>
  implements PurchaseRfqLineAttrs
{
  public id!: number;
  public rfq_id!: number;
  public product_id!: number;
  public description?: string | null;
  public quantity!: number;
  public uom_id?: number | null;
  public unit_price!: number;
  public discount_percent!: number;
  public discount_amount!: number;
  public tax_rate_id?: number | null;
  public line_total!: number;
  public line_tax!: number;
  public line_total_after_tax!: number;
  public lead_time_days?: number | null;
}

PurchaseRfqLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    rfq_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    unit_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax_rate_id: { type: DataTypes.BIGINT, allowNull: true },
    line_total: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    line_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    line_total_after_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lead_time_days: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_rfq_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
