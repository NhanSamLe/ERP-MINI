import { Opportunity } from "../../dto/opportunity.dto";

export interface OpportunityState {
  allOpportunities: Opportunity[];
  detail: Opportunity | null;
  loading: boolean;
  error: string | null;
}