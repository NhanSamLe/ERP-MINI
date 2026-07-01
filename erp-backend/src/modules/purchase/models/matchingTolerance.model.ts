import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface MatchingToleranceAttrs {
  id: number;
  branch_id: number;
  supplier_id?: number | null;
  category_id?: number | null;
  price_tolerance_pct: number;
  qty_tolerance_pct: number;
  amount_tolerance_abs: number;
  priority: number;
  is_active: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

type MatchingToleranceCreation = Optional<
  MatchingToleranceAttrs,
  | "id"
  | "supplier_id"
  | "category_id"
  | "price_tolerance_pct"
  | "qty_tolerance_pct"
  | "amount_tolerance_abs"
  | "priority"
  | "is_active"
>;

export class MatchingTolerance
  extends Model<MatchingToleranceAttrs, MatchingToleranceCreation>
  implements MatchingToleranceAttrs
{
  public id!: number;
  public branch_id!: number;
  public supplier_id?: number | null;
  public category_id?: number | null;
  public price_tolerance_pct!: number;
  public qty_tolerance_pct!: number;
  public amount_tolerance_abs!: number;
  public priority!: number;
  public is_active!: boolean;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MatchingTolerance.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    supplier_id: { type: DataTypes.BIGINT, allowNull: true },
    category_id: { type: DataTypes.BIGINT, allowNull: true },
    price_tolerance_pct: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    qty_tolerance_pct: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    amount_tolerance_abs: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "matching_tolerances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
