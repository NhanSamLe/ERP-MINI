import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PayrollConfigAttrs {
  id: number;
  config_key: string;
  config_value: string;
  description?: string | null;
}

type PayrollConfigCreation = Optional<PayrollConfigAttrs, "id" | "description">;

export class PayrollConfig
  extends Model<PayrollConfigAttrs, PayrollConfigCreation>
  implements PayrollConfigAttrs
{
  public id!: number;
  public config_key!: string;
  public config_value!: string;
  public description!: string | null;
}

PayrollConfig.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    config_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    config_value: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "payroll_configs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
