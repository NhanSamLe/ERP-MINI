import { ActivityType, ActivityRelatedType, TaskStatus } from "../../../types/enum";
import {Lead} from "./lead.dto"
import { Opportunity } from "./opportunity.dto";
import {Partner} from "../../partner/store/partner.types"

export interface CreateActivityDto {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  activity_type: "call" | "email" | "meeting" | "task";
  subject?: string;
  owner_id: number;
  due_at?: Date | null;
  notes?: string | null;
  priority?: "low" | "medium" | "high" | null;
}
export interface CreateCallActivityDto {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  subject?: string;
  owner_id: number;
  due_at?: Date | null;
  notes?: string | null;
  call_from: string;
  call_to: string;
  is_inbound?: boolean | null;
  priority?: "low" | "medium" | "high" | null;
}

export interface CreateEmailActivityDto {
 related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  subject?: string;
  owner_id: number;
  due_at?: Date | null;
  notes?: string | null;
  direction: "in" | "out";
  email_from?: string | null;
  email_to?: string | null;
  priority?: "low" | "medium" | "high" | null;
}
export interface CreateMeetingActivityDto {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  subject: string;
  owner_id: number;
  start_at: Date;
  end_at: Date;
  location?: string | null;
  attendees?: string | null;
  meeting_link?: string | null;
  reminder_at?: Date | null;
  notes?: string | null;
  priority?: "low" | "medium" | "high" | null;
}
export interface CreateTaskActivityDto {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  subject: string;
  owner_id: number;
  due_at: Date;
  priority?: "low" | "medium" | "high";
  status?: "Not Started" | "In Progress" | "Completed";
  reminder_at?: Date | null;
  notes?: string | null;
}
export interface UpdateActivityDto {
  activityId: number;
  subject?: string;
  due_at?: Date | null;
  notes?: string | null;
  priority?: "low" | "medium" | "high" | null;
}
export interface UpdateCallDetailDto {
  activity_id: number;
  duration?: number | null;
  result?: 
    "connected" |
    "no_answer" |
    "busy" |
    "failed" |
    "call_back" |
    "wrong_number" |
    null;
  recording_url?: string | null;

}
export interface UpdateEmailDetailDto {
  activity_id: number;
  subject?: string;
  cc?: string | null;
  bcc?: string | null;
  html_body?: string | null;
  text_body?: string | null;
}
export interface CompleteActivityDto {
  activityId: number;
  notes?: string | null;
}
export interface ReassignActivityDto {
  activityId: number;
  newUserId: number;
}
export interface SendEmailActivityDto {
  activity_id: number;
}
export interface TrackEmailOpenedDto {
  message_id: string;
}
export interface UpdateMeetingDetailDto {
  activity_id: number;
  start_at?: Date | null;
  end_at?: Date | null;
  location?: string | null;
  attendees?: string | null;
  meeting_link?: string | null;
  reminder_at?: Date | null;
  meeting_notes?: string | null;

}
export interface UpdateTaskDetailDto {
  activity_id: number;
  status?: TaskStatus;
  reminder_at?: Date | null;
}
export interface CallDetail {
  id: number;
  activity_id: number;
  duration?: number | null;
  call_from?: string | null;
  call_to?: string | null;
  result?: 
    "connected" |
    "no_answer" |
    "busy" |
    "failed" |
    "call_back" |
    "wrong_number" |
    null;
  recording_url?: string | null;
  is_inbound?: boolean | null;
}
export interface EmailDetail {
  id: number;
  activity_id: number;
  direction: "in" | "out";
  email_from?: string | null;
  email_to?: string | null;
  status?: string | null;
  message_id?: string | null;
  cc?: string | null;
  bcc?: string | null;
  html_body?: string | null;
  text_body?: string | null;
  sent_via?: string | null;
  error_message?: string | null;
  subject?: string| null;
}
export interface MeetingDetail {
  id: number;
  activity_id: number;
  start_at: string;
  end_at: string;
  location?: string | null;
  attendees?: string | null;
  meeting_link?: string | null;
  reminder_at?: Date | null;
  meeting_notes?: string | null;
}
export interface TaskDetail {
  id: number;
  activity_id: number;
  status?: "Not Started" | "In Progress" | "Completed";
  reminder_at?: string | null;
}

export interface Activity {
  id: number;

  activity_type: ActivityType;
  related_type: ActivityRelatedType;
  related_id: number;

  subject?: string | null;
  notes?: string | null;

  done: boolean;
  due_at?: string | null;          // ISO date string
  completed_at?: string | null;    // ISO date string
  created_at?: string;
  updated_at?: string;

  owner_id?: number;

  // --- DETAIL TỪ 4 BẢNG PHỤ ---
  call?: CallDetail | null;
  email?: EmailDetail | null;
  meeting?: MeetingDetail | null;
  task?: TaskDetail | null;

  // --- LIÊN KẾT CRM ---
  lead?: Lead | null;
  opportunity?: Opportunity | null;
  customer?: Partner | null;
  owner?: User | null;
  priority?: "low" | "medium" | "high" | null;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface User {
  full_name: string;
  email: string;
  phone: string;
}

export interface TimelineEvent {
  id: number;
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;

  event_type: string;          // vd: lead_created, opportunity_won, meeting_completed
  title: string;               // tiêu đề ngắn
  description?: string | null; // mô tả chi tiết (optional)

  created_by?: number | null;  
  created_at: string;          // dạng ISO từ API
}