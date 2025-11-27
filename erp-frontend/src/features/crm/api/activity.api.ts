import axiosClient from "../../../api/axiosClient";

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
} from "../dto/activity.dto";

export const createCallActivity = (data: CreateCallActivityDto) =>
  axiosClient.post("/crm/activities/call", data);

export const createEmailActivity = (data: CreateEmailActivityDto) =>
  axiosClient.post("/crm/activities/email", data);

export const createMeetingActivity = (data: CreateMeetingActivityDto) =>
  axiosClient.post("/crm/activities/meeting", data);

export const createTaskActivity = (data: CreateTaskActivityDto) =>
  axiosClient.post("/crm/activities/task", data);

export const updateActivity = (activityId: number, data: UpdateActivityDto) =>
  axiosClient.put(`/crm/activities/${activityId}`, data);

export const updateCallDetail = (activityId: number, data: UpdateCallDetailDto) =>
  axiosClient.put(`/crm/activities/call/${activityId}`, data);

export const updateEmailDetail = (activityId: number, data: UpdateEmailDetailDto) =>
  axiosClient.put(`/crm/activities/email/${activityId}`, data);

export const updateMeetingDetail = (activityId: number, data: UpdateMeetingDetailDto) =>
  axiosClient.put(`/crm/activities/meeting/${activityId}`, data);

export const updateTaskDetail = (activityId: number, data: UpdateTaskDetailDto) =>
  axiosClient.put(`/crm/activities/task/${activityId}`, data);

export const getAllActivities = () =>
  axiosClient.get("/crm/activities");

export const getMyActivities = () =>
  axiosClient.get("/crm/activities/my");

export const getTodayActivities = () =>
  axiosClient.get("/crm/activities/today");

export const getActivitiesFor = (
  relatedType: string,
  relatedId: number
) =>
  axiosClient.get(`/crm/activities/for/${relatedType}/${relatedId}`);

  export const getTimeline = (
  relatedType: string,
  relatedId: number
) =>
  axiosClient.get(`/crm/activities/for/${relatedType}/${relatedId}`);

export const getActivityDetail = (id: number) =>
  axiosClient.get(`/crm/activities/${id}`);


export const deleteActivity = (activityId: number) =>
  axiosClient.delete(`/crm/activities/${activityId}`);

export const reassignActivity = (activityId: number, newUserId: number) =>
  axiosClient.patch("/crm/activities/reassign", { activityId, newUserId });

export const startTask = (activityId: number) =>
  axiosClient.patch(`/crm/activities/task/start/${activityId}`);

export const finishTask = (activityId: number) =>
  axiosClient.patch(`/crm/activities/task/complete/${activityId}`);

export const cancelMeeting = (activityId: number, reason?: string) =>
  axiosClient.post("/crm/activities/meeting/cancel", {
    activity_id: activityId,
    reason,
  });

export const cancelCallActivity = (activityId: number, reason?: string) =>
  axiosClient.post("/crm/activities/call/cancel", {
    activity_id: activityId,
    reason,
  });

export const cancelEmailActivity = (activityId: number) =>
  axiosClient.post("/crm/activities/email/cancel", {
    activity_id: activityId,
  });

export const completeMeeting = (activityId: number) =>
  axiosClient.post("/crm/activities/meeting/complete", {
    activity_id: activityId,
  });

export const sendEmailForActivity = (activityId: number) =>
  axiosClient.post("/crm/activities/email/send", {
    activity_id: activityId,
});

