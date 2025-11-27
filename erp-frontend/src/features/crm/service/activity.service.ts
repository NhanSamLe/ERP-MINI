import * as api from "../api/activity.api";
import {
  CreateCallActivityDto,
  CreateEmailActivityDto,
  CreateMeetingActivityDto,
  CreateTaskActivityDto,
  UpdateActivityDto,
  UpdateCallDetailDto,
  UpdateEmailDetailDto,
  UpdateMeetingDetailDto,
  UpdateTaskDetailDto,
  Activity,
} from "../dto/activity.dto";
export async function createCallActivity(data: CreateCallActivityDto) {
  const res = await api.createCallActivity(data);
  return res.data.data as Activity;
}

export async function createEmailActivity(data: CreateEmailActivityDto) {
  const res = await api.createEmailActivity(data);
  return res.data.data as Activity;
}

export async function createMeetingActivity(data: CreateMeetingActivityDto) {
  const res = await api.createMeetingActivity(data);
  return res.data.data as Activity;
}

export async function createTaskActivity(data: CreateTaskActivityDto) {
  const res = await api.createTaskActivity(data);
  return res.data.data as Activity;
}

/* ============================================
   2. UPDATE activity chính
============================================ */
export async function updateActivity( data: UpdateActivityDto) {
  const res = await api.updateActivity(data.activityId,data);
  return res.data.data as Activity;
}

/* ============================================
   3. UPDATE detail bảng phụ
============================================ */
export async function updateCallDetail(activityId: number, data: UpdateCallDetailDto) {
  const res = await api.updateCallDetail(activityId, data);
  return res.data.data;
}

export async function updateEmailDetail(activityId: number, data: UpdateEmailDetailDto) {
  const res = await api.updateEmailDetail(activityId, data);
  return res.data.data;
}

export async function updateMeetingDetail(activityId: number, data: UpdateMeetingDetailDto) {
  const res = await api.updateMeetingDetail(activityId, data);
  return res.data.data;
}

export async function updateTaskDetail(activityId: number, data: UpdateTaskDetailDto) {
  const res = await api.updateTaskDetail(activityId, data);
  return res.data.data;
}

/* ============================================
   4. START / COMPLETE TASK
============================================ */
export async function startTask(activityId: number) {
  const res = await api.startTask(activityId);
  return res.data.data ;
}

export async function completeTask(activityId: number) {
  const res = await api.finishTask(activityId);
  return res.data.data;
}


/* ============================================
   6. DELETE
============================================ */
export async function deleteActivity(id: number) {
  const res = await api.deleteActivity(id);
  return res.data.data;
}

/* ============================================
   7. GET LIST
============================================ */
export async function getAllActivities() {
  const res = await api.getAllActivities();
  return res.data.data as Activity[];
}

export async function getMyActivities() {
  const res = await api.getMyActivities();
  return res.data.data as Activity[];
}

export async function getTodayActivities() {
  const res = await api.getTodayActivities();
  return res.data.data as Activity[];
}

export async function getActivitiesFor(type: string, id: number) {
  const res = await api.getActivitiesFor(type, id);
  return res.data.data as Activity[];
}

/* ============================================
   8. GET DETAIL theo loại
============================================ */
export async function getActivityDetail(id: number) {
  const res = await api.getActivityDetail(id);
  return res.data.data as Activity;
}

export async function cancelMeeting(activityId: number, reason?: string) {
  const res = await api.cancelMeeting(activityId, reason);
  return res.data;
}

// ===============================
//      CANCEL CALL ACTIVITY
// ===============================
export async function cancelCallActivity(activityId: number, reason?: string) {
  const res = await api.cancelCallActivity(activityId, reason);
  return res.data ;
}

// ===============================
//      CANCEL EMAIL ACTIVITY
// ===============================
export async function cancelEmailActivity(activityId: number) {
  const res = await api.cancelEmailActivity(activityId);
  return res.data;
}

// ===============================
//      COMPLETE MEETING
// ===============================
export async function completeMeeting(activityId: number) {
  const res = await api.completeMeeting(activityId);
  return res.data;
}

// ===============================
//      SEND EMAIL
// ===============================
export async function sendEmailForActivity(activityId: number) {
  const res = await api.sendEmailForActivity(activityId);
  return res.data;
}