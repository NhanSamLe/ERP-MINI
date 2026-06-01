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
  contacted_at?: Date;        // Thời điểm sales liên hệ lần đầu
  qualified_at?: Date;        // Thời điểm chuyển sang qualified
  qualified_by?: number;      // User ID của người qualify
  lost_at?: Date | null;        // Thời điểm chuyển sang lost
  lost_reason?: string | null;       // Lý do lost
  
  // Thông tin đánh giá nhanh của sales (optional)
  has_budget?: boolean;       // "Khách có tiền không?"
  ready_to_buy?: boolean;     // "Mua được không?"
  expected_timeline?: string; // "Khi nào mua?" - VD: "this_week", "this_month", "next_quarter"
  created_at?: Date;   // <── thêm dòng này
  updated_at?: Date;   // <── thêm dòng này
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by?: number | null;
  // Phase 2 B2B enhancements
  branch_id?: number | null;
  customer_id?: number | null;
  source_id?: number | null;
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue?: number | null;
  lead_score?: number;
  score_grade?: "cold" | "warm" | "hot" | null;
  score_reasons?: any[] | null;
  last_scored_at?: Date | null;
  last_activity_date?: Date | null;
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
  public contacted_at?: Date;
  public qualified_at?: Date
  public qualified_by?: number;
  public lost_at?: Date | null;
  public lost_reason?: string | null;
  public has_budget?: boolean;
  public ready_to_buy?: boolean;
  public expected_timeline?: string;
  public is_deleted?: boolean;
  public deleted_at?: Date | null;
  public deleted_by?: number | null;
  // Phase 2 B2B
  public branch_id?: number | null;
  public customer_id?: number | null;
  public source_id?: number | null;
  public company_name?: string | null;
  public job_title?: string | null;
  public industry?: string | null;
  public company_size?: string | null;
  public annual_revenue?: number | null;
  public lead_score?: number;
  public score_grade?: "cold" | "warm" | "hot" | null;
  public score_reasons?: any[] | null;
  public last_scored_at?: Date | null;
  public last_activity_date?: Date | null;
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
    contacted_at: { type: DataTypes.DATE },
    qualified_at: { type: DataTypes.DATE },
    qualified_by: { type: DataTypes.BIGINT },
    lost_at: { type: DataTypes.DATE, allowNull: true },
    lost_reason: { type: DataTypes.STRING(255), allowNull: true },
    has_budget: { type: DataTypes.BOOLEAN },
    ready_to_buy: { type: DataTypes.BOOLEAN },
    expected_timeline: { type: DataTypes.STRING(50) },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.BIGINT, allowNull: true },
    // Phase 2 B2B
    branch_id: { type: DataTypes.BIGINT, allowNull: true },
    customer_id: { type: DataTypes.BIGINT, allowNull: true },
    source_id: { type: DataTypes.BIGINT, allowNull: true },
    company_name: { type: DataTypes.STRING(200), allowNull: true },
    job_title: { type: DataTypes.STRING(100), allowNull: true },
    industry: { type: DataTypes.STRING(100), allowNull: true },
    company_size: { type: DataTypes.STRING(50), allowNull: true },
    annual_revenue: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    lead_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    score_grade: { type: DataTypes.ENUM("cold", "warm", "hot"), allowNull: true },
    score_reasons: { type: DataTypes.JSON, allowNull: true },
    last_scored_at: { type: DataTypes.DATE, allowNull: true },
    last_activity_date: { type: DataTypes.DATE, allowNull: true },
  },
  { 
    sequelize, 
    tableName: "crm_leads", 
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
    hooks: {
      afterUpdate: async (lead: Lead, options) => {
        if (lead.changed('is_deleted') && lead.is_deleted) {
          const { Activity } = require("../../../models/index");
          if (Activity) {
            await Activity.update(
              { is_deleted: true, deleted_at: new Date(), deleted_by: lead.deleted_by },
              { where: { related_type: 'lead', related_id: lead.id } }
            );
          }
        }
      }
    }
  }
);
