import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchasePriceListItemAttrs {
  id: number;
  price_list_id: number;
  product_id: number;
  /** Override NCC cụ thể cho dòng này (nếu price list là chung) */
  supplier_id?: number | null;
  /** Số lượng tối thiểu để áp dụng giá này (price break) */
  min_quantity: number;
  unit_price: number;
  discount_percent: number;
  uom_id?: number | null;
  /** Thời gian giao hàng cam kết (ngày) */
  lead_time_days?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

type PurchasePriceListItemCreation = Optional<
  PurchasePriceListItemAttrs,
  "id" | "min_quantity" | "discount_percent"
>;

export class PurchasePriceListItem
  extends Model<PurchasePriceListItemAttrs, PurchasePriceListItemCreation>
  implements PurchasePriceListItemAttrs
{
  public id!: number;
  public price_list_id!: number;
  public product_id!: number;
  public supplier_id?: number | null;
  public min_quantity!: number;
  public unit_price!: number;
  public discount_percent!: number;
  public uom_id?: number | null;
  public lead_time_days?: number | null;
  public start_date?: string | null;
  public end_date?: string | null;
}

PurchasePriceListItem.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    price_list_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    min_quantity: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    uom_id: { type: DataTypes.BIGINT, allowNull: true },
    lead_time_days: { type: DataTypes.INTEGER, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    sequelize,
    tableName: "purchase_price_list_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
