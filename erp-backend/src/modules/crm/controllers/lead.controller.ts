import { Request, Response } from "express";
import * as leadService from "../services/lead.service";

export const getLeads = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isManager = ["SALESMANAGER"].includes(user.role);

    const leads = isManager
      ? await leadService.getAllLeads()
      : await leadService.getMyLeads(user.id);

    return res.json({
      message: isManager
        ? "Lấy toàn bộ Lead thành công"
        : "Lấy Lead của user thành công",
      data: leads,
    });

  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const getLeadById = async (req: Request, res: Response) => {
    try {
    const leadId = Number(req.params.leadId);
    const lead = await leadService.getLeadById(leadId);
    return res.json({
        message: "Lấy chi tiết Lead thành công",    
        data: lead,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  } 
};
export const createLead = async (req: Request, res: Response) => {
  try {
    const assigned_to = (req as any).user.id;
    const { name, email, phone, source} = req.body;

    const lead = await leadService.createLead({
      name,
      email,
      phone,
      source,
      assigned_to,
    });

    return res.status(201).json({
      message: "Tạo lead thành công",
      data: lead,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   5. UPDATE BASIC INFO
================================ */
export const updateLeadBasic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const leadId = Number(req.params.leadId);
     const role = (req as any).user.role;
    const updated = await leadService.updateLeadBasic(leadId, req.body, userId, role);

    return res.json({
      message: "Cập nhật thông tin Lead thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   6. UPDATE EVALUATION (budget, buy-ready...)
================================ */
export const updateLeadEvaluation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
     const role = (req as any).user.role;
    const updated = await leadService.updateLeadEvaluation(userId,role, req.body);

    return res.json({
      message: "Cập nhật thông tin đánh giá Lead thành công",
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   7. CONVERT TO CUSTOMER
================================ */
export const convertToCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { leadId } = req.body;
     const role = (req as any).user.role;
    const result = await leadService.convertToCustomer(leadId, userId,role);

    return res.json({
      message: "Convert Lead sang Customer thành công",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   8. MARK AS LOST
================================ */
export const markAsLost = async (req: Request, res: Response) => {
  try {
    const { leadId, reason } = req.body;
    const userId = (req as any).user.id;
     const role = (req as any).user.role;
    const lead = await leadService.markAsLost(leadId, userId, role,reason);

    return res.json({
      message: "Lead đã được chuyển sang LOST",
      data: lead,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   9. REASSIGN LEAD
================================ */
export const reassignLead = async (req: Request, res: Response) => {
  try {
    const { leadId, newUserId } = req.body;
    const managerId = (req as any).user.id;

    const lead = await leadService.reassignLead(leadId, newUserId, managerId);

    return res.json({
      message: "Lead đã được chuyển người phụ trách",
      data: lead,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   10. REOPEN LOST LEAD
================================ */
export const reopenLead = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);
    const userId = (req as any).user.id;

    const lead = await leadService.reopenLead(leadId, userId);

    return res.json({
      message: "Mở lại Lead thành công",
      data: lead,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   11. GET LEADS BY STAGE
================================ */
export const getLeadByStage = async (req: Request, res: Response) => {
  try {
    const stage = req.params.stage;
    const leads = await leadService.getLeadByStage(stage as any);

    return res.json({
      message: "Lấy Lead theo stage thành công",
      data: leads
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ================================
   12. DELETE LEAD
================================ */
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const ok = await leadService.deleteLead(leadId, userId, role);

    return res.json({
      message: "Xóa Lead thành công",
      data: ok,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getTodayLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const leads = await leadService.getTodayLeads(user.role, user.id);
    return res.json({
      message: "Lấy danh sách Lead thành công",
      data: leads,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
}
};