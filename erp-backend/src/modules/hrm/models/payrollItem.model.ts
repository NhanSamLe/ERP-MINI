import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PayrollItemType = "earning" | "deduction";

export interface PayrollItemAttrs {
  id: number;
  branch_id: number;
  item_code: string;
  name: string;
  type: PayrollItemType;
  is_taxable: boolean;
  is_active: boolean;
}

type PayrollItemCreation = Optional<
  PayrollItemAttrs,
  "id" | "is_taxable" | "is_active"
>;

export class PayrollItem
  extends Model<PayrollItemAttrs, PayrollItemCreation>
  implements PayrollItemAttrs
{
  public id!: number;
  public branch_id!: number;
  public item_code!: string;
  public name!: string;
  public type!: PayrollItemType;
  public is_taxable!: boolean;
  public is_active!: boolean;
}

PayrollItem.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    item_code: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.ENUM("earning", "deduction"),
      allowNull: false,
    },
    is_taxable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "payroll_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
