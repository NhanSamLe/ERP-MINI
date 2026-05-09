import { OpportunityStage } from "../../../types/enum";
import {Lead} from "./lead.dto"
import { Partner } from "../../partner/store/partner.types";
import {User} from "./activity.dto"
export interface CreateOpportunityDto {
  related_type: "lead" | "customer";
  related_id: number;
  name: string;
  expected_value?: number;
  probability?: number;
  stage?: OpportunityStage;
  closing_date?: string | null;
  pipeline_id?: number | null;
  pipeline_stage_id?: number | null;
  next_action?: string | null;
  next_action_date?: string | null;
  currency_id?: number | null;
  exchange_rate?: number;
}
export interface UpdateOpportunityDto {
  oppId: number;
  name?: string;
  expected_value?: number;
  probability?: number;
  closing_date?: string | null;
  notes?: string;
  next_action?: string | null;
  next_action_date?: string | null;
  actual_close_date?: string | null;
  currency_id?: number | null;
  exchange_rate?: number;
}
export interface Opportunity {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  name: string;
  stage: OpportunityStage | string;
  expected_value?: number | null;
  probability?: number | null;
  owner_id: number | null;
  pipeline_id?: number | null;
  pipeline_stage_id?: number | null;
  closing_date: string | null;
  loss_reason?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  actual_close_date?: string | null;
  currency_id?: number | null;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
  lead: Lead | null;
  customer: Partner | null;
  owner: User | null;
}
export interface MarkWonResponse {
  opp: Opportunity;
  customer: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    type: "customer";
  };
}

    