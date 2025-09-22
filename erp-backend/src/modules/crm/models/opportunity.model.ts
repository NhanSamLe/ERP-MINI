import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface OpportunityAttrs {
  id: number;
  lead_id?: number;
  customer_id?: number;
  name: string;
  stage: "prospecting" | "negotiation" | "won" | "lost";
  expected_value?: number;
  probability?: number;
  owner_id?: number;
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
  },
  { sequelize, tableName: "crm_opportunities", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
