import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface PipelineAttrs { id: number; name: string; description: string | null; is_default: boolean; is_active: boolean; }
type PipelineCreation = Optional<PipelineAttrs, "id">;
export class Pipeline extends Model<PipelineAttrs, PipelineCreation> implements PipelineAttrs {
  public id!: number; public name!: string; public description!: string | null; public is_default!: boolean; public is_active!: boolean;
}
Pipeline.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  is_default: { type: DataTypes.TINYINT, defaultValue: 0 },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
}, { sequelize, tableName: "crm_pipelines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
