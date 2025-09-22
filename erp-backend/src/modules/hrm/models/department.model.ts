import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface DepartmentAttrs {
  id: number;
  branch_id: number;
  code: string;
  name: string;
}

type DepartmentCreation = Optional<DepartmentAttrs, "id">;

export class Department extends Model<DepartmentAttrs, DepartmentCreation> implements DepartmentAttrs {
  public id!: number;
  public branch_id!: number;
  public code!: string;
  public name!: string;
}

Department.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false }
  },
  { sequelize, tableName: "departments", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
