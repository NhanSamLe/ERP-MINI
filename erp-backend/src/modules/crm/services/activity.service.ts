// ========================================================================
//  CRM ACTIVITY SERVICE – FULL ENTERPRISE VERSION (ALL FUNCTIONS)
// ========================================================================

import {
  Activity,
  CallActivity,
  EmailActivity,
  MeetingActivity,
  TaskActivity,
  Lead,
  Opportunity,
  Partner,
  User,
} from "../../../models";

import { Op } from "sequelize";
import { ActivityType, ActivityStatus } from "../../../core/types/enum";
import {
  CreateActivityDto,
  CreateCallActivityDto,
  CreateEmailActivityDto,
  CreateMeetingActivityDto,
  CreateTaskActivityDto,
  UpdateActivityDto,
  UpdateCallDetailDto,
  UpdateEmailDetailDto,
  UpdateMeetingDetailDto,
  UpdateTaskDetailDto,
  ReassignActivityDto,
} from "../dto/activity.dto";

import { sendEmail2, EmailAttachment } from "../../../core/utils/email";
import { addTimeline } from "./timeLine.service";
import { markLeadContacted } from "./lead.service";
import { calculateLeadScore } from "./scoringRule.service";
// ========================================================================
// HELPERS
// ========================================================================
function requireField(v: any, field: string) {
  if (!v && v !== 0) throw new Error(`Thiếu: ${field}`);
}


// log event
async function logTimeline(
  activity: Activity,
  event_type: string,
  title: string,
  description?: string
) {
  return addTimeline({
    related_type: activity.related_type as any,
    related_id: activity.related_id,
    event_type,
    title,
    description: description ?? '',
    created_by: activity.owner_id ?? 1,
  });
}

async function recalculateLeadForActivity(activity: Activity | null) {
  if (!activity || activity.related_type !== "lead") return;
  await calculateLeadScore(activity.related_id).catch(e => console.error("Score Error", e));
}

async function markLeadContactedForActivity(activity: Activity | null) {
  if (!activity || activity.related_type !== "lead") return;
  await markLeadContacted(activity.related_id);
}

// ======================================================================================
// FULL INCLUDE RELATIONS
// ======================================================================================
const FULL_INCLUDE = [
  { model: CallActivity, as: "call" },
  { model: EmailActivity, as: "email" },
  { model: MeetingActivity, as: "meeting" },
  { model: TaskActivity, as: "task" },
  { model: Lead, as: "lead" },
  {
    model: Opportunity,
    as: "opportunity",
    include: [{ model: Lead, as: "lead" }, { model: Partner, as: "customer" }],
  },
  { model: Partner, as: "customer" },
  { model: User, as: "owner", attributes: ["full_name", "email", "phone"] },
];

// ========================================================================
// 🔥 ACTIVITY CORE
// ========================================================================

export async function createActivity(dto: CreateActivityDto) {
  const activity = await Activity.create({
    related_type: dto.related_type,
    related_id: dto.related_id,
    activity_type: dto.activity_type,
    subject: dto.subject || "",
    owner_id: dto.owner_id,
    due_at: dto.due_at || null,
    notes: dto.notes || null,
    status: "pending",
    priority: dto.priority ?? null,
    done: false,
  });

  const des = `Tiêu đề: ${dto.subject || "Không có"}, Hạn chót: ${dto.due_at || "Chưa đặt"}`;
  await logTimeline(activity, "activity_created", "Tạo hoạt động mới", des);
  await recalculateLeadForActivity(activity);
  return activity;
}

export async function getActivityDetail(id: number) {
  return Activity.findByPk(id, { include: FULL_INCLUDE });
}

export async function updateActivity(dto: UpdateActivityDto) {
  const activity = await Activity.findByPk(dto.activityId);
  if (!activity) throw new Error("Activity không tồn tại");

  await activity.update({
    subject: dto.subject ?? activity.subject ?? '',
    due_at: dto.due_at ?? activity.due_at ?? null,
    notes: dto.notes ?? activity.notes ?? null,
    priority: dto.priority ?? activity.priority ?? null,
  });

  const changes: string[] = [];
  if (dto.subject && dto.subject !== activity.subject) changes.push(`Tiêu đề -> ${dto.subject}`);
  if (dto.due_at && dto.due_at !== activity.due_at) changes.push(`Hạn chót -> ${dto.due_at}`);
  if (dto.notes && dto.notes !== activity.notes) changes.push(`Cập nhật ghi chú`);

  await logTimeline(activity, "activity_updated", `Cập nhật hoạt động: ${activity.subject}`, changes.length > 0 ? changes.join(", ") : "Cập nhật thông tin chung");
  await recalculateLeadForActivity(activity);
  return activity;
}

// export async function completeActivity(activityId: number, notes?: string ) {
//   const activity = await Activity.findByPk(activityId);
//   if (!activity) throw new Error("Activity không tồn tại");

//   await activity.update({
//     status: "completed",
//     done: true,
//     completed_at: new Date(),
//     notes: notes ?? activity.notes ?? null,
//   });

//   await logTimeline(activity, "activity_completed", "Activity hoàn thành");
//   return activity;
// }

export async function deleteActivity(activityId: number, userId: number) {
  const activity = await Activity.findByPk(activityId);
  if (!activity) throw new Error("Activity không tồn tại");
  if (activity.owner_id !== userId) throw new Error("Không có quyền");
  if (activity.status === "completed") {
    throw new Error("Activity đã hoàn tất, không thể xoá");
  }
  await activity.update({
    is_deleted: true,
    deleted_at: new Date(),
    deleted_by: userId
  });
  await logTimeline(activity, "activity_deleted", "Xoá activity: " + activity.subject);
  await recalculateLeadForActivity(activity);
  return true;
}

export async function reassignActivity(dto: ReassignActivityDto, managerId: number) {
  const activity = await Activity.findByPk(dto.activityId);
  if (!activity) throw new Error("Activity không tồn tại");

  const old = activity.owner_id;

  await activity.update({ owner_id: dto.newUserId });

  await addTimeline({
    related_type: activity.related_type,
    related_id: activity.related_id,
    event_type: "activity_reassigned",
    title: `Chuyển quyền: ${activity.subject}`,
    description: `Chuyển từ User ${old} → ${dto.newUserId}`,
    created_by: managerId,
  });

  return activity;
}

export const getAllActivities = () =>
  Activity.findAll({ include: FULL_INCLUDE, order: [["created_at", "DESC"]] });

export const getMyActivities = (id: number) =>
  Activity.findAll({
    where: { owner_id: id },
    include: FULL_INCLUDE,
    order: [["created_at", "DESC"]],
  });

export const getTodayActivities = (userId: number) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  return Activity.findAll({
    where: {
      owner_id: userId,
      done: false,
      due_at: { [Op.gte]: today, [Op.lt]: tomorrow },
    },
    include: FULL_INCLUDE,
  });
};

export const getActivitiesFor = (type: string, id: number) =>
  Activity.findAll({
    where: { related_type: type, related_id: id },
    include: FULL_INCLUDE,
    order: [["created_at", "DESC"]],
  });

export const getTimeline = getActivitiesFor;

// ========================================================================
// 🔥 CALL FLOW
// ========================================================================

export async function createCallActivity(dto: CreateCallActivityDto) {
  requireField(dto.call_from, "call_from");
  requireField(dto.call_to, "call_to");

  const activity = await Activity.create({
    related_type: dto.related_type,
    related_id: dto.related_id,
    activity_type: ActivityType.CALL,
    subject: dto.subject ?? "",
    owner_id: dto.owner_id,
    due_at: dto.due_at ?? null,
    notes: dto.notes ?? null,
    priority: dto.priority ?? null,
  });

  const detail = await CallActivity.create({
    activity_id: activity.id,
    call_from: dto.call_from,
    call_to: dto.call_to,
    is_inbound: dto.is_inbound ?? null,
  });
  await logTimeline(activity, "call_created", `Tạo cuộc gọi: ${dto.subject}`, `Từ: ${dto.call_from} → Đến: ${dto.call_to}`);
  await markLeadContactedForActivity(activity);
  await recalculateLeadForActivity(activity);
  return { activity, detail };
}

export async function updateCallDetail(dto: UpdateCallDetailDto) {
  const detail = await CallActivity.findOne({
    where: { activity_id: dto.activity_id }
  });
  if (!detail) throw new Error("Call detail không tồn tại");

  // Update thông tin cuộc gọi
  await detail.update({
    duration: dto.duration ?? null,
    result: dto.result ?? null,
    recording_url: dto.recording_url ?? null,
  });


  // Cuộc gọi đã kết thúc khi có result
  if (dto.result) {
    const activity = await Activity.findByPk(dto.activity_id);
    if (activity) {
      await activity.update({
        status: "completed",
        done: true,
        completed_at: new Date(),
      });

      await logTimeline(activity, "call_completed", "Cuộc gọi hoàn thành: " + activity.subject);
      await recalculateLeadForActivity(activity);
    }
  }

  return detail;
}
export async function cancelCallActivity(activityId: number, reason?: string) {
  const activity = await Activity.findByPk(activityId);
  if (!activity) throw new Error("Activity không tồn tại");
  if (activity.status === "completed") {
    throw new Error("Cuộc gọi đã hoàn tất, không thể hủy");
  }
  const newNotes = reason !== undefined ? reason : (activity.notes ?? null);
  // Cập nhật trạng thái hủy
  await activity.update({
    status: "cancelled",
    done: true,
    completed_at: new Date(),
    notes: newNotes,
  });

  // Ghi timeline hủy
  await logTimeline(
    activity,
    "call_cancelled",
    "Cuộc gọi bị hủy: " + activity.subject,
    reason || ""
  );

  await recalculateLeadForActivity(activity);
  return activity;
}

// ========================================================================
// 🔥 EMAIL FLOW
// ========================================================================

export async function createEmailActivity(dto: CreateEmailActivityDto) {
  let status1 = ActivityStatus.IN_PROGRESS
  let isDone = false;
  if (dto.direction === "in") {
    status1 = ActivityStatus.COMPLETED,
      isDone = true;
  }
  const activity = await Activity.create({
    related_type: dto.related_type,
    related_id: dto.related_id,
    activity_type: ActivityType.EMAIL,
    subject: dto.subject || "",
    owner_id: dto.owner_id,
    due_at: dto.due_at || null,
    notes: dto.notes || null,
    priority: dto.priority || null,
    status: status1,
    done: isDone
  });
  await EmailActivity.create({
    activity_id: activity.id,
    direction: dto.direction,
    email_from: dto.email_from ?? null,
    email_to: dto.email_to ?? null,
    sent_via: "system",
  });

  await logTimeline(activity, "email_created", `Tạo Email: ${dto.subject}`, `Từ: ${dto.email_from || "Hệ thống"} → Đến: ${dto.email_to}`);
  await recalculateLeadForActivity(activity);

  return activity;
}

export async function sendEmailForActivity(
  dto: { activity_id: number },
  attachments?: EmailAttachment[]
) {
  const email = await EmailActivity.findOne({ where: { activity_id: dto.activity_id } });
  if (!email) throw new Error("Email detail không tồn tại");

  try {
    const info = await sendEmail2(
      email.email_to!,
      email.subject || "",
      email.text_body || "",
      email.html_body || undefined,
      email.cc || null,
      email.bcc || null,
      attachments
    );
    await email.update({ status: "sent", message_id: info.messageId });

    await Activity.update(
      { done: true, status: "completed", completed_at: new Date() },
      { where: { id: dto.activity_id } }
    );

    const activity = await Activity.findByPk(dto.activity_id);
    await logTimeline(activity!, "email_sent", "Email đã gửi: " + activity!.subject);
    await markLeadContactedForActivity(activity);
    await recalculateLeadForActivity(activity);
  } catch (err: any) {
    await email.update({ status: "failed", error_message: err.message });
  }

  return email;
}

export async function updateEmailDetail(dto: UpdateEmailDetailDto) {
  const detail = await EmailActivity.findOne({ where: { activity_id: dto.activity_id } });
  if (!detail) throw new Error("Email detail không tồn tại");

  await detail.update({
    subject: dto.subject ?? detail.subject ?? null,
    email_to: (dto as any).email_to ?? detail.email_to ?? null,
    cc: dto.cc ?? detail.cc ?? null,
    bcc: dto.bcc ?? detail.bcc ?? null,
    html_body: dto.html_body ?? detail.html_body ?? null,
    text_body: dto.text_body ?? detail.text_body ?? null,
  });
  return detail;
}


export async function cancelEmailActivity(activityId: number, userId: number) {
  const activity = await Activity.findByPk(activityId);
  if (!activity) throw new Error("Activity không tồn tại");
  // Email inbound (đã nhận) thì không được cancel
  if (activity.status === ActivityStatus.COMPLETED) {
    throw new Error("Email đã hoàn tất, không thể huỷ");
  }
  // Update trạng thái sang canceled
  await activity.update({
    done: true,
    status: ActivityStatus.CANCELLED,
  });
  await logTimeline(
    activity,
    "email_canceled",
    "Email đã bị huỷ: " + activity.subject,
    `Huỷ bởi user ${userId}`
  );

  await recalculateLeadForActivity(activity);
  return true;
}


// ========================================================================
// 🔥 MEETING FLOW
// ========================================================================

export async function createMeetingActivity(dto: CreateMeetingActivityDto) {


  const activity = await Activity.create({
    related_type: dto.related_type,
    related_id: dto.related_id,
    activity_type: "meeting",
    subject: dto.subject,
    owner_id: dto.owner_id,
    due_at: dto.start_at,
    priority: dto.priority || null,
    notes: dto.notes ?? ''
  });

  await MeetingActivity.create({
    activity_id: activity.id,
    start_at: dto.start_at,
    end_at: dto.end_at,
    location: dto.location ?? null,
    attendees: dto.attendees ?? null,
    meeting_link: dto.meeting_link ?? null,
    reminder_at: dto.reminder_at ?? null,
  });

  const meetingDes = `Thời gian: ${dto.start_at} - ${dto.end_at}, Địa điểm: ${dto.location || "Online"}`;
  await logTimeline(activity, "meeting_created", `Tạo cuộc họp: ${dto.subject}`, meetingDes);
  await markLeadContactedForActivity(activity);
  await recalculateLeadForActivity(activity);
  return activity;
}

export async function updateMeetingDetail(dto: UpdateMeetingDetailDto) {
  const detail = await MeetingActivity.findOne({ where: { activity_id: dto.activity_id } });
  if (!detail) throw new Error("Meeting detail không tồn tại");

  await detail.update({
    start_at: dto.start_at ?? detail.start_at ?? null,
    end_at: dto.end_at ?? detail.end_at ?? null,
    location: dto.location ?? detail.location ?? null,
    attendees: dto.attendees ?? detail.attendees ?? null,
    meeting_link: dto.meeting_link ?? detail.meeting_link ?? null,
    reminder_at: dto.reminder_at ?? detail.reminder_at ?? null,
    meeting_notes: dto.meeting_notes ?? detail.meeting_notes ?? null,
  });
  if (dto.meeting_notes !== undefined && dto.meeting_notes !== null && dto.meeting_notes.trim() !== "") {
    const activity = await Activity.findByPk(dto.activity_id);

    if (detail.end_at && detail.end_at > new Date()) {
      return {
        success: false,
        message: "Cuộc họp chưa kết thúc nên không thể hoàn thành",
      };
    }

    if (activity && activity.status !== "completed") {
      await activity.update({
        done: true,
        status: "completed",
        completed_at: new Date(),
      });

      await logTimeline(
        activity,
        "meeting_completed",
        "Cuộc họp hoàn thành: " + activity.subject,
        "Đã cập nhật biên bản cuộc họp"
      );
    }
  }
  const updatedActivity = await Activity.findByPk(dto.activity_id);
  await recalculateLeadForActivity(updatedActivity);
  return detail;
}

export async function cancelMeeting(dto: { activity_id: number; reason?: string }) {
  const activity = await Activity.findByPk(dto.activity_id);
  if (!activity) throw new Error("Activity không tồn tại");

  await activity.update({
    done: true,
    status: "cancelled",
    completed_at: new Date(),
    notes: dto.reason ?? ''
  });

  await MeetingActivity.update(
    { cancelled_at: new Date() },
    { where: { activity_id: dto.activity_id } }
  );

  await logTimeline(activity, "meeting_cancelled", "Huỷ cuộc họp: " + activity.subject, dto.reason);
  await recalculateLeadForActivity(activity);
}

export async function completeMeeting(activityId: number) {
  const activity = await Activity.findByPk(activityId);
  if (!activity) {
    return { success: false, message: "Không tìm thấy activity" };
  }

  const detail = await MeetingActivity.findOne({ where: { activity_id: activityId } });
  if (!detail) {
    return { success: false, message: "Không tìm thấy chi tiết cuộc họp" };
  }

  // Chưa tới giờ kết thúc
  if (!detail.end_at || detail.end_at >= new Date()) {
    return {
      success: false,
      message: "Cuộc họp chưa đeén giờ hoặc chưa kết thúc, không thể hoàn thành",
    };
  }

  // Đã kết thúc -> Mark completed
  await activity.update({
    done: true,
    status: "completed",
    completed_at: new Date(),
  });

  await logTimeline(activity, "meeting_completed", "Cuộc họp hoàn thành: " + activity.subject);
  await recalculateLeadForActivity(activity);

  return {
    success: true,
    message: "Đánh dấu cuộc họp hoàn thành thành công",
    activity,
  };
}


// ========================================================================
// 🔥 TASK FLOW
// ========================================================================

export async function createTaskActivity(dto: CreateTaskActivityDto) {
  const activity = await Activity.create({
    related_type: dto.related_type,
    related_id: dto.related_id,
    activity_type: "task",
    subject: dto.subject,
    owner_id: dto.owner_id,
    due_at: dto.due_at,
  });

  await TaskActivity.create({
    activity_id: activity.id,
    status: dto.status ?? "Not Started",
    reminder_at: dto.reminder_at ?? null,
  });

  await logTimeline(activity, "task_created", `Tạo công việc: ${dto.subject}`, `Trạng thái: ${dto.status || "Not Started"}, Hạn chót: ${dto.due_at || "Chưa đặt"}`);

  await recalculateLeadForActivity(activity);
  return activity;
}

export async function updateTaskDetail(dto: UpdateTaskDetailDto) {
  const detail = await TaskActivity.findOne({ where: { activity_id: dto.activity_id } });
  if (!detail) throw new Error("Task detail không tồn tại");

  await detail.update({
    status: dto.status ?? detail.status ?? null,
    reminder_at: dto.reminder_at ?? detail.reminder_at ?? null,
  });

  return detail;
}

export async function startTask(activity_id: number, user_id: number) {
  const activity = await Activity.findByPk(activity_id);
  if (!activity) throw new Error("Activity không tồn tại");
  if (activity.owner_id !== user_id) throw new Error("Không có quyền");

  const detail = await TaskActivity.findOne({ where: { activity_id } });
  if (!detail) throw new Error("Task detail không tồn tại");

  await detail.update({ status: "In Progress" });
  await activity.update({ status: "in_progress" });

  await logTimeline(activity, "task_started", "Công việc bắt đầu: " + activity.subject);
  await markLeadContactedForActivity(activity);
  await recalculateLeadForActivity(activity);
  return detail;
}

export async function completeTask(activity_id: number, user_id: number) {
  const activity = await Activity.findByPk(activity_id);
  if (!activity) throw new Error("Activity không tồn tại");
  if (activity.owner_id !== user_id) throw new Error("Không có quyền");

  const detail = await TaskActivity.findOne({ where: { activity_id } });
  if (!detail) {
    throw new Error("Activity không tồn tại");
  }
  await detail.update({ status: "Completed" });
  await activity.update({
    done: true,
    status: "completed",
    completed_at: new Date(),
  });

  await logTimeline(activity, "task_completed", "Công việc hoàn thành: " + activity.subject);
  await recalculateLeadForActivity(activity);

  return activity;
}

// CRON CHECK OVERDUE
export async function checkOverdueTasks() {
  const tasks = await Activity.findAll({
    where: {
      activity_type: "task",
      done: false,
      due_at: { [Op.lt]: new Date() },
    },
  });

  for (const task of tasks) {
    await logTimeline(task, "task_overdue", "Công việc quá hạn: " + task.subject);
  }
}

// CRON REMINDER
export async function triggerTaskReminder() {
  const tasks = await TaskActivity.findAll({
    where: {
      reminder_at: { [Op.lte]: new Date() },
    },
    include: [{ model: Activity, as: "activity" }],
  });

  for (const _t of tasks) {
    // reminder logic placeholder
  }
}
export async function autoTaskOverdueActivity(dto: { task_activity_id: number }) {
  const activity = await Activity.findByPk(dto.task_activity_id);
  if (!activity) return;

  await logTimeline(activity, "task_overdue", "Công việc quá hạn: " + activity.subject);
}

// ========================================================================
// DONE
// ========================================================================
