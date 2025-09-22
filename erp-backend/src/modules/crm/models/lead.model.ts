import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface LeadAttrs {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  assigned_to?: number;
  stage: "new" | "qualified" | "lost";
}

type LeadCreation = Optional<LeadAttrs, "id" | "stage">;

export class Lead extends Model<LeadAttrs, LeadCreation> implements LeadAttrs {
  public id!: number;
  public name!: string;
  public email?: string;
  public phone?: string;
  public source?: string;
  public assigned_to?: number;
  public stage!: "new" | "qualified" | "lost";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lead.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    source: { type: DataTypes.STRING(50) },
    assigned_to: { type: DataTypes.BIGINT },
    stage: { type: DataTypes.ENUM("new", "qualified", "lost"), defaultValue: "new" },
  },
  { sequelize, tableName: "crm_leads", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
