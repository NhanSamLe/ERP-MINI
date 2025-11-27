import {Lead} from "./lead.dto"
import { Activity } from "./activity.dto"; 
import { Opportunity } from "./opportunity.dto";
export interface SummaryStats {
  totalLeads: number;
  contactedLeads: number;
  newLeadsToday: number;
  qualifiedLeads: number;

  totalOpp: number;
  wonOpp: number;
  lostOpp: number;
  winRate: number;

  totalRevenue: number;

  activitiesToday: {
    totalActivitiesToday: number;
    callsToday: number;
    emailsToday: number;
    meetingsToday: number;
    tasksToday: number;
  };
}

// ---------------------------------------------
// Pipeline (Funnel)
// ---------------------------------------------
export interface PipelineItem {
  stage: string;
  count: number;
}

// ---------------------------------------------
// Charts
// ---------------------------------------------
export interface Activity7DayItem {
  date: string;      // yyyy-mm-dd
  count: number;
}

export interface Leads7DayItem {
  date: string;
  count: number;
}

export interface Revenue30DayItem {
  date: string;
  total: number;
}

export interface DashboardCharts {
  activity7d: Activity7DayItem[];
  leads7d: Leads7DayItem[];
  revenue30d: Revenue30DayItem[];
}

// ---------------------------------------------
// Recent items displayed in table
// ---------------------------------------------
export interface RecentData {
  leads: Lead[];          // Bạn có thể đổi nếu có Lead type
  opportunities: Opportunity[];  // Cũng có thể đổi nếu có Opp type
  activities: Activity[];     // Activity DTO
}

// ---------------------------------------------
// Overall Dashboard Response
// ---------------------------------------------
export interface SalesDashboardData {
  summary: SummaryStats;
  pipeline: PipelineItem[];
  charts: DashboardCharts;
  recent: RecentData;
}