
import { Lead } from "../../dto/lead.dto";

export interface LeadState {
  allLeads: Lead[];
  // myLeads: Lead[];
  todayLeads: Lead[];
  currentLead: Lead | null;
  loading: boolean;
  error: string | null;
}
