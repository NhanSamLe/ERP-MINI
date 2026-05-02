import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
export interface ScoringRuleAttrs { id: number; name: string; field: string; operator: string; value: string | null; score: number; is_active: boolean; }
type ScoringRuleCreation = Optional<ScoringRuleAttrs, "id">;
export class ScoringRule extends Model<ScoringRuleAttrs, ScoringRuleCreation> implements ScoringRuleAttrs {
  public id!: number; public name!: string; public field!: string; public operator!: string; public value!: string | null; public score!: number; public is_active!: boolean;
}
ScoringRule.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  field: { type: DataTypes.STRING(50), allowNull: false },
  operator: { type: DataTypes.ENUM("equals","not_equals","contains","greater_than","less_than","is_true","is_false"), allowNull: false },
  value: { type: DataTypes.STRING(255) },
  score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
}, { sequelize, tableName: "crm_scoring_rules", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
