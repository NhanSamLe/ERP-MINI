import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface OpportunityAttrs {
  id: number;
  lead_id?: number;
  customer_id?: number | null;
  name: string | null;
  stage: "prospecting" | "negotiation" | "won" | "lost";
  expected_value?: number | null;
  probability?: number | null;
  owner_id?: number;
  closing_date?: Date  | null;
  loss_reason?: string | null;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by?: number | null;
  // Phase 2 pipeline
  pipeline_id?: number | null;
  pipeline_stage_id?: number | null;
  branch_id?: number | null;
  next_action?: string | null;
  next_action_date?: Date | null;
  lost_reason?: string | null;
  actual_close_date?: Date | null;
  // Multi-Currency
  currency_id?: number | null;
  exchange_rate?: number;
}

type OpportunityCreation = Optional<OpportunityAttrs, "id">;

export class Opportunity extends Model<OpportunityAttrs, OpportunityCreation> implements OpportunityAttrs {
  public id!: number;
  public lead_id?: number;
  public customer_id?: number;
  public name!: string;
  public stage!: "prospecting" | "negotiation" | "won" | "lost";
  public expected_value?: number;
  public probability?: number;
  public owner_id?: number;
  public closing_date?: Date;     
  public loss_reason?: string;    
  public is_deleted?: boolean;
  public deleted_at?: Date | null;
  public deleted_by?: number | null;
  // Phase 2 pipeline
  public pipeline_id?: number | null;
  public pipeline_stage_id?: number | null;
  public branch_id?: number | null;
  public next_action?: string | null;
  public next_action_date?: Date | null;
  public actual_close_date?: Date | null;
  // Multi-Currency
  public currency_id?: number | null;
  public exchange_rate?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Opportunity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    lead_id: { type: DataTypes.BIGINT },
    customer_id: { type: DataTypes.BIGINT },
    name: { type: DataTypes.STRING(255), allowNull: false },
    stage: { type: DataTypes.ENUM("prospecting", "negotiation", "won", "lost") },
    expected_value: { type: DataTypes.DECIMAL(18, 2) },
    probability: { type: DataTypes.DECIMAL(5, 2) },
    owner_id: { type: DataTypes.BIGINT },
    closing_date: { type: DataTypes.DATE },
    loss_reason: { type: DataTypes.STRING(255) },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.BIGINT, allowNull: true },
    // Phase 2 pipeline
    pipeline_id: { type: DataTypes.BIGINT, allowNull: true },
    pipeline_stage_id: { type: DataTypes.BIGINT, allowNull: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: true },
    next_action: { type: DataTypes.STRING(255), allowNull: true },
    next_action_date: { type: DataTypes.DATE, allowNull: true },
    actual_close_date: { type: DataTypes.DATE, allowNull: true },
    // Multi-Currency
    currency_id: { type: DataTypes.BIGINT, allowNull: true },
    exchange_rate: { type: DataTypes.DECIMAL(18, 6), defaultValue: 1.000000 },
  },
  { 
    sequelize, 
    tableName: "crm_opportunities", 
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
    hooks: {
      afterUpdate: async (opp: Opportunity, options) => {
        if (opp.changed('is_deleted') && opp.is_deleted) {
          const { Activity } = require("../../../models/index");
          if (Activity) {
            await Activity.update(
              { is_deleted: true, deleted_at: new Date(), deleted_by: opp.deleted_by },
              { where: { related_type: 'opportunity', related_id: opp.id } }
            );
          }
        }
      }
    }
  }
);
