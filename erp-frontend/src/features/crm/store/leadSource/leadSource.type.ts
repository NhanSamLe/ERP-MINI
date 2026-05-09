import { LeadSource } from "../../dto/leadSource.dto";

export interface LeadSourceState {
  leadSources: LeadSource[];
  loading: boolean;
  error: string | null;
}
