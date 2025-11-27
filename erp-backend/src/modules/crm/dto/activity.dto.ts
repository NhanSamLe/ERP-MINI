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
export interface UpdateActivityDto {
  activityId: number;
  subject?: string;
  due_at?: Date | null;
  notes?: string | null;
  
}
export interface CompleteActivityDto {
  activityId: number;
  notes?: string | null;
}
export interface ReassignActivityDto {
  activityId: number;
  newUserId: number;
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
export interface UpdateEmailDetailDto {
  activity_id: number;
  cc?: string | null;
  bcc?: string | null;
  html_body?: string | null;
  text_body?: string | null;
}
export interface SendEmailActivityDto {
  activity_id: number;
}
export interface TrackEmailOpenedDto {
  message_id: string;
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
export interface CancelMeetingDto {
  activity_id: number;
  reason?: string | null;
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
export interface UpdateTaskDetailDto {
  activity_id: number;
  status?: "Not Started" | "In Progress" | "Completed" | null;
  reminder_at?: Date | null;
}
export interface TaskActionDto {
  activity_id: number;
}
export interface TimelineEventDto {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  event_type: string;
  title: string;
  description?: string | null;
  created_by?: number | null;
}
export interface AutoLeadDto {
  lead_id: number;
  user_id: number;
}
export interface AutoReassignDto {
  activity_id: number;
  old_owner: number;
  new_owner: number;
}
export interface AutoTaskOverdueDto {
  task_activity_id: number;
}
export interface AutoDealDto {
  opp_id: number;
  user_id: number;
}
