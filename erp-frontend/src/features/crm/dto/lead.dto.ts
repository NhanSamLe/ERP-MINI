import { LeadStage } from "../../../types/enum";
import { User } from "./activity.dto";
import { Opportunity } from "./opportunity.dto";
import { Partner } from "../../partner/store/partner.types";
export interface CreateLeadDto {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  source_id?: number | null;
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue?: number | null;
}
export interface UpdateLeadEvaluationDto {
  leadId: number;
  has_budget?: boolean;
  ready_to_buy?: boolean;
  expected_timeline?: string
  notes?: string;
}
export interface UpdateLeadBasicDto {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  source_id?: number | null;
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue?: number | null;
}
export interface ConvertLeadToOpportunityDto {
  leadId: number;
  name?: string;
  expected_value?: number;
  notes?: string;
  closing_date?: Date | null;
}
export interface MarkLeadLostDto {
  leadId: number;
  reason: string;
}
export interface LeadScoreReason {
  rule_id: number;
  rule_name: string;
  field: string;
  operator: string;
  value: string | null;
  actual: unknown;
  score: number;
}
export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  source_id?: number | null;
  leadSource?: { id: number; name: string; description?: string | null; is_active?: boolean };
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue?: number | null;
  branch_id?: number | null;
  branch?: { id: number; name: string; code?: string } | null;
  customer_id?: number | null;
  customer?: Partner | null;
  lead_score?: number | null;
  score_grade?: "cold" | "warm" | "hot" | null;
  score_reasons?: LeadScoreReason[] | null;
  last_scored_at?: string | null;
  last_activity_date?: string | null;
  assigned_to?: number;
  stage: LeadStage;
  contacted_at?: Date;        // Thời điểm sales liên hệ lần đầu
  qualified_at?: Date;        // Thời điểm chuyển sang qualified
  qualified_by?: number;      // User ID của người qualify
  lost_at?: Date | null;        // Thời điểm chuyển sang lost
  lost_reason?: string | null;       // Lý do lost
  // Thông tin đánh giá nhanh của sales (optional)
  has_budget?: boolean;       // "Khách có tiền không?"
  ready_to_buy?: boolean;     // "Mua được không?"
  expected_timeline?: string; // "Khi nào mua?" - VD: "this_week", "this_month", "next_quarter"
  assignedUser?: User;
  created_at: string;
  updated_at?: string;
  opportunities?: Opportunity[];
}
