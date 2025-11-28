
import { Lead } from "../../dto/lead.dto";

export interface LeadState {
  allLeads: Lead[];
  // myLeads: Lead[];
  todayLeads: Lead[];
  loading: boolean;
  error: string | null;
}
