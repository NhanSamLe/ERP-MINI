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
  },
  { sequelize, tableName: "crm_leads", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
