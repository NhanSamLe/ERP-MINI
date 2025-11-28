import { LeadStage } from "../../../types/enum";
import { User } from "./activity.dto";
import { Opportunity } from "./opportunity.dto";
export interface CreateLeadDto {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
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
export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
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
  opportunities?: Opportunity[];
}