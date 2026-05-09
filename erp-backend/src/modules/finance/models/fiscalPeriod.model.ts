import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface FiscalPeriodAttrs {
  id: number;
  fiscal_year_id: number;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  closed_by: number | null;
  closed_at: Date | null;
}

type FiscalPeriodCreation = Optional<FiscalPeriodAttrs, "id">;

export class FiscalPeriod extends Model<FiscalPeriodAttrs, FiscalPeriodCreation> implements FiscalPeriodAttrs {
  public id!: number;
  public fiscal_year_id!: number;
  public name!: string;
  public period_number!: number;
  public start_date!: string;
  public end_date!: string;
  public status!: "open" | "closed";
  public closed_by!: number | null;
  public closed_at!: Date | null;
}

FiscalPeriod.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    fiscal_year_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    period_number: { type: DataTypes.INTEGER, allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM("open", "closed"), defaultValue: "open" },
    closed_by: { type: DataTypes.BIGINT, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "fiscal_periods", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
