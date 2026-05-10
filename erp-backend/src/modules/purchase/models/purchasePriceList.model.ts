import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchasePriceListAttrs {
  id: number;
  name: string;
  code?: string | null;
  currency_id?: number | null;
  /** NULL = áp dụng cho mọi NCC; có giá trị = chỉ áp dụng cho NCC này */
  supplier_id?: number | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_by: number;
}

type PurchasePriceListCreation = Optional<PurchasePriceListAttrs, "id">;

export class PurchasePriceList
  extends Model<PurchasePriceListAttrs, PurchasePriceListCreation>
  implements PurchasePriceListAttrs
{
  public id!: number;
  public name!: string;
  public code?: string | null;
  public currency_id?: number | null;
  public supplier_id?: number | null;
  public is_active!: boolean;
  public start_date?: string | null;
  public end_date?: string | null;
  public notes?: string | null;
  public created_by!: number;
}

PurchasePriceList.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "purchase_price_lists",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
