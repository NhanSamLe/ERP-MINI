import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface FiscalYearAttrs {
  id: number;
  company_id: number | null;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
}

type FiscalYearCreation = Optional<FiscalYearAttrs, "id">;

export class FiscalYear extends Model<FiscalYearAttrs, FiscalYearCreation> implements FiscalYearAttrs {
  public id!: number;
  public company_id!: number | null;
  public name!: string;
  public start_date!: string;
  public end_date!: string;
  public status!: "open" | "closed";
}

FiscalYear.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM("open", "closed"), defaultValue: "open" },
  },
  { sequelize, tableName: "fiscal_years", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
