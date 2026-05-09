import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface LeadSourceAttrs { id: number; name: string; description: string | null; is_active: boolean; }
type LeadSourceCreation = Optional<LeadSourceAttrs, "id">;
export class LeadSource extends Model<LeadSourceAttrs, LeadSourceCreation> implements LeadSourceAttrs {
  public id!: number; public name!: string; public description!: string | null; public is_active!: boolean;
}
LeadSource.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
}, { sequelize, tableName: "crm_lead_sources", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
