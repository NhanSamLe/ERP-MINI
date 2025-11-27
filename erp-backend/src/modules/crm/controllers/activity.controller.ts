import { Request, Response } from "express";
import * as activityService from "../services/activity.service";

// ======================================================
// 1. CREATE ACTIVITY - 4 LOẠI
// ======================================================

export const createCallActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await activityService.createCallActivity({
      ...req.body,
      owner_id: user.id,
    });

    return res.status(201).json({
      message: "Tạo hoạt động gọi điện thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const createEmailActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await activityService.createEmailActivity({
      ...req.body,
      owner_id: user.id,
    });

    return res.status(201).json({
      message: "Tạo hoạt động email thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const createMeetingActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await activityService.createMeetingActivity({
      ...req.body,
      owner_id: user.id,
    });

    return res.status(201).json({
      message: "Tạo cuộc họp thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const createTaskActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await activityService.createTaskActivity({
      ...req.body,
      owner_id: user.id,
    });

    return res.status(201).json({
      message: "Tạo công việc thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ======================================================
// 2. UPDATE – chung + chi tiết
// ======================================================

export const updateActivity = async (req: Request, res: Response) => {
  try {
    const updated = await activityService.updateActivity(req.body);

    return res.json({
      message: "Cập nhật Activity thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateCallDetail = async (req: Request, res: Response) => {
  try {
    const updated = await activityService.updateCallDetail(req.body);
    return res.json({ 
      message: "Cập nhật Call detail thành công", 
      data: updated 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateEmailDetail = async (req: Request, res: Response) => {
  try {
    const updated = await activityService.updateEmailDetail(req.body);
    return res.json({ 
      message: "Cập nhật Email detail thành công", 
      data: updated 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateMeetingDetail = async (req: Request, res: Response) => {
  try {
    const updated = await activityService.updateMeetingDetail(req.body);
    return res.json({ 
      message: "Cập nhật Meeting detail thành công", 
      data: updated 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateTaskDetail = async (req: Request, res: Response) => {
  try {
    const updated = await activityService.updateTaskDetail(req.body);
    return res.json({
      message: "Cập nhật Task detail thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// export const completeActivity = async (req: Request, res: Response) => {
//   try {
//     const user = (req as any).user;
//     if (!user) return res.status(401).json({ message: "Unauthorized" });
//     const {activityId,notes } = req.body;
//     const result = await activityService.completeActivity(activityId,notes);

//     return res.json({
//       message: "Hoàn thành Activity thành công",
//       data: result,
//     });
//   } catch (err: any) {
//     return res.status(400).json({ message: err.message });
//   }
// };

// ======================================================
// 3. TASK STATUS: Start / Complete
// ======================================================

export const startTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await activityService.startTask(req.body.activityId, user.id);

    return res.json({
      message: "Bắt đầu task thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await activityService.completeTask(req.body.activityId, user.id);

    return res.json({
      message: "Hoàn thành task thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ======================================================
// 4. REASSIGN ACTIVITY
// ======================================================

export const reassignActivity = async (req: Request, res: Response) => {
  try {
    const manager = (req as any).user;
    const { activityId, newUserId } = req.body;

    const result = await activityService.reassignActivity(
      { activityId, newUserId },
      manager.id
    );

    return res.json({
      message: "Chuyển Activity thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ======================================================
// 5. DETAIL theo từng loại
// ======================================================

export const getActivityDetail = async (req: Request, res: Response) => {
  try {
    const result = await activityService.getActivityDetail(Number(req.params.id));
    return res.json({ data: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ======================================================
// 6. LIST
// ======================================================

export const getAllActivities = async (req: Request, res: Response) => {
  try {
    const data = await activityService.getAllActivities();
    return res.json({ 
      message: "Danh sách tất cả Activity", 
      data 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getMyActivities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await activityService.getMyActivities(user.id);

    return res.json({ 
      message: "Danh sách Activity của tôi", 
      data 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getTodayActivities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await activityService.getTodayActivities(user.id);

    return res.json({ 
      message: "Danh sách hôm nay", 
      data 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getActivitiesFor = async (req: Request, res: Response) => {
  try {
    const type = req.params.type as string;
    const id = Number(req.params.id);

    const data = await activityService.getActivitiesFor(type, id);

    return res.json({ 
      message: "Danh sách Activity", 
      data 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const type = req.params.type as string;
    const id = Number(req.params.id);

    const data = await activityService.getTimeline(type, id);

    return res.json({ 
      message: "Timeline", 
      data 
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ======================================================
// 7. DELETE
// ======================================================

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const deleted = await activityService.deleteActivity(
      Number(req.params.id),
      user.id
    );

    return res.json({
      message: "Xóa hoạt động thành công",
      data: deleted,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const cancelMeeting = async (req: Request, res: Response) => {
  try {
    const { activity_id, reason } = req.body;

    await activityService.cancelMeeting({ activity_id, reason });

    return res.json({
      message: "Huỷ cuộc họp thành công",
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/**
 * 2. CANCEL CALL
 */
export const cancelCallActivity = async (req: Request, res: Response) => {
  try {
    const { activity_id, reason } = req.body;

    const result = await activityService.cancelCallActivity(
      Number(activity_id),
      reason
    );

    return res.json({
      message: "Huỷ cuộc gọi thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/**
 * 3. CANCEL EMAIL ACTIVITY
 */
export const cancelEmailActivity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { activity_id } = req.body;

    await activityService.cancelEmailActivity(
      Number(activity_id),
      user.id
    );

    return res.json({
      message: "Huỷ email activity thành công",
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/**
 * 4. COMPLETE MEETING
 */
export const completeMeeting = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.body;

    await activityService.completeMeeting(Number(activity_id));

    return res.json({
      message: "Hoàn thành cuộc họp thành công",
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/**
 * 5. SEND EMAIL FOR ACTIVITY
 */
export const sendEmailForActivity = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.body;

    const email = await activityService.sendEmailForActivity({
      activity_id: Number(activity_id),
    });

    return res.json({
      message: "Gửi email thành công",
      data: email,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
