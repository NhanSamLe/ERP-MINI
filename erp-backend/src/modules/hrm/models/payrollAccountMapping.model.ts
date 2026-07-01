import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PayrollMappingItemType =
  | "salary"
  | "social_insurance_company"
  | "social_insurance_employee"
  | "pit"
  | "net_payable";

export interface PayrollAccountMappingAttrs {
  id: number;
  branch_id: number;
  department_id?: number | null;
  item_type: PayrollMappingItemType;
  account_id: number;
}

type PayrollAccountMappingCreation = Optional<PayrollAccountMappingAttrs, "id" | "department_id">;

export class PayrollAccountMapping
  extends Model<PayrollAccountMappingAttrs, PayrollAccountMappingCreation>
  implements PayrollAccountMappingAttrs
{
  public id!: number;
  public branch_id!: number;
  public department_id?: number | null;
  public item_type!: PayrollMappingItemType;
  public account_id!: number;
}

PayrollAccountMapping.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    department_id: { type: DataTypes.BIGINT, allowNull: true },
    item_type: {
      type: DataTypes.ENUM(
        "salary",
        "social_insurance_company",
        "social_insurance_employee",
        "pit",
        "net_payable"
      ),
      allowNull: false,
    },
    account_id: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "payroll_account_mappings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
