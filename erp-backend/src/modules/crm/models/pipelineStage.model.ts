import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface PipelineStageAttrs { id: number; pipeline_id: number; name: string; sequence: number; probability: number; is_won: boolean; is_lost: boolean; color: string | null; }
type PipelineStageCreation = Optional<PipelineStageAttrs, "id">;
export class PipelineStage extends Model<PipelineStageAttrs, PipelineStageCreation> implements PipelineStageAttrs {
  public id!: number; public pipeline_id!: number; public name!: string; public sequence!: number; public probability!: number; public is_won!: boolean; public is_lost!: boolean; public color!: string | null;
}
PipelineStage.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  pipeline_id: { type: DataTypes.BIGINT, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  probability: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  is_won: { type: DataTypes.TINYINT, defaultValue: 0 },
  is_lost: { type: DataTypes.TINYINT, defaultValue: 0 },
  color: { type: DataTypes.STRING(20) },
}, { sequelize, tableName: "crm_pipeline_stages", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
