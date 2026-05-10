import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type ReturnCondition = "good" | "damaged" | "defective";

export interface PurchaseReturnLineAttrs {
  id: number;
  return_id: number;
  product_id: number;
  po_line_id?: number | null;
  quantity_returned: number;
  quantity_confirmed: number;
  quantity_rejected: number;
  unit_price: number;
  line_total: number;
  reason?: string | null;
  condition: ReturnCondition;
}

type PurchaseReturnLineCreation = Optional<
  PurchaseReturnLineAttrs,
  "id" | "quantity_confirmed" | "quantity_rejected" | "line_total" | "condition"
>;

export class PurchaseReturnLine
  extends Model<PurchaseReturnLineAttrs, PurchaseReturnLineCreation>
  implements PurchaseReturnLineAttrs
{
  public id!: number;
  public return_id!: number;
  public product_id!: number;
  public po_line_id?: number | null;
  public quantity_returned!: number;
  public quantity_confirmed!: number;
  public quantity_rejected!: number;
  public unit_price!: number;
  public line_total!: number;
  public reason?: string | null;
  public condition!: ReturnCondition;
}

PurchaseReturnLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    return_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    po_line_id: { type: DataTypes.BIGINT, allowNull: true },
    quantity_returned: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
    quantity_confirmed: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
    },
    quantity_rejected: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 0,
    },
    unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    line_total: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
    condition: {
      type: DataTypes.ENUM("good", "damaged", "defective"),
      allowNull: false,
      defaultValue: "good",
    },
  },
  {
    sequelize,
    tableName: "purchase_return_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
