import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface CostCenterAttrs {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  status: "active" | "inactive";
}

type CostCenterCreation = Optional<CostCenterAttrs, "id" | "status">;

export class CostCenter extends Model<CostCenterAttrs, CostCenterCreation> implements CostCenterAttrs {
  public id!: number;
  public branch_id!: number;
  public code!: string;
  public name!: string;
  public status!: "active" | "inactive";
}

CostCenter.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    tableName: "cost_centers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
