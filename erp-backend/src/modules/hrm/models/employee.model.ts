import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface EmployeeAttrs {
  id: number;
  branch_id: number;
  emp_code: string;
  full_name: string;
  gender: "male" | "female" | "other";
  birth_date?: Date;
  cccd?: string;
  hire_date?: Date;
  contract_type: "trial" | "official" | "seasonal";
  department_id?: number;
  position_id?: number;
  base_salary: number;
  bank_account?: string;
  bank_name?: string;
  status: "active" | "inactive";
}

type EmployeeCreation = Optional<EmployeeAttrs, "id" | "status">;

export class Employee extends Model<EmployeeAttrs, EmployeeCreation> implements EmployeeAttrs {
  public id!: number;
  public branch_id!: number;
  public emp_code!: string;
  public full_name!: string;
  public gender!: "male" | "female" | "other";
  public birth_date?: Date;
  public cccd?: string;
  public hire_date?: Date;
  public contract_type!: "trial" | "official" | "seasonal";
  public department_id?: number;
  public position_id?: number;
  public base_salary!: number;
  public bank_account?: string;
  public bank_name?: string;
  public status!: "active" | "inactive";
}

Employee.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    emp_code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    gender: { type: DataTypes.ENUM("male", "female", "other"), allowNull: false },
    birth_date: { type: DataTypes.DATE },
    cccd: { type: DataTypes.STRING(20) },
    hire_date: { type: DataTypes.DATE },
    contract_type: { type: DataTypes.ENUM("trial", "official", "seasonal"), allowNull: false },
    department_id: { type: DataTypes.BIGINT },
    position_id: { type: DataTypes.BIGINT },
    base_salary: { type: DataTypes.DECIMAL(18,2), allowNull: false },
    bank_account: { type: DataTypes.STRING(50) },
    bank_name: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM("active","inactive"), defaultValue: "active" }
  },
  { sequelize, tableName: "employees", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
