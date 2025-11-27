import { Request, Response } from "express";
import * as opportunityService from "../services/opportunity.service";
import { OpportunityStage } from "../../../core/types/enum";

/* ============================================================
   1. GET ALL OPPORTUNITIES
============================================================ */
export const getOpportunities  = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isManager = ["SALESMANAGER","ADMIN"].includes(user.role);

    const opportunity = isManager
      ? await opportunityService.getAllOpportunities()
      : await opportunityService.getMyOpportunities(user.id);

    return res.json({
      message: isManager
        ? "Lấy toàn bộ danh sách Opportunity thành công"
        : "Lấy danh sách Opportunity của user thành công",
      data: opportunity,
    });

  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// export const getAllOpportunities = async (req: Request, res: Response) => {
//   try {
//     const data = await opportunityService.getAllOpportunities();
//     return res.json({
//       message: "Lấy danh sách Opportunity thành công",
//       data,
//     });
//   } catch (err: any) {
//     return res.status(400).json({ message: err.message });
//   }
// };

/* ============================================================
   2. GET OPPORTUNITY BY ID
============================================================ */
export const getOpportunityById = async (req: Request, res: Response) => {
  try {
    const oppId = Number(req.params.oppId);
    const data = await opportunityService.getOpportunityById(oppId);

    return res.json({
      message: "Lấy Opportunity thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   3. CREATE OPPORTUNITY
============================================================ */
export const createOpportunity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { lead_id, name, expected_value, probability, stage, closing_date } =
      req.body;

    const data = await opportunityService.createOpportunity({
      lead_id,
      owner_id: user.id,
      name,
      expected_value,
      probability,
      stage,
      closing_date,
    });

    return res.status(201).json({
      message: "Tạo Opportunity thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   4. UPDATE OPPORTUNITY
============================================================ */
export const updateOpportunity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = Number(req.params.oppId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const data = await opportunityService.updateOpportunity(user.id,user.role, {
      oppId,
      ...req.body,
    });

    return res.json({
      message: "Cập nhật Opportunity thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   5. MOVE TO NEGOTIATION
============================================================ */
export const moveToNegotiation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = Number(req.params.oppId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const data = await opportunityService.moveToNegotiation(oppId, user.id, user.role);

    return res.json({
      message: "Chuyển sang Negotiation thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   6. MARK WON
============================================================ */
export const markWon = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = Number(req.params.oppId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const data = await opportunityService.markWon(oppId, user.id, user.role);

    return res.json({
      message: "Chuyển Opportunity sang WON thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   7. MARK LOST
============================================================ */
export const markLost = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = Number(req.params.oppId);
    const { reason } = req.body;

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!reason) return res.status(400).json({ message: "reason là bắt buộc" });

    const data = await opportunityService.markLost(user.id,user.role, { oppId, reason });

    return res.json({
      message: "Chuyển Opportunity sang LOST thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   8. REASSIGN OPPORTUNITY
============================================================ */
export const reassignOpportunity = async (req: Request, res: Response) => {
  try {
    const manager = (req as any).user;
    const oppId = Number(req.params.oppId);
    const { newUserId } = req.body;

    if (!manager) return res.status(401).json({ message: "Unauthorized" });
    if (!newUserId)
      return res.status(400).json({ message: "newUserId là bắt buộc" });

    const data = await opportunityService.reassignOpportunity(
      oppId,
      newUserId,
      manager.id
    );

    return res.json({
      message: "Reassign Opportunity thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   9. GET MY OPPORTUNITIES
============================================================ */
// export const getMyOpportunities = async (req: Request, res: Response) => {
//   try {
//     const user = (req as any).user;
//     if (!user) return res.status(401).json({ message: "Unauthorized" });

//     let stage = req.query.stage as OpportunityStage | undefined;

//     if (stage && !Object.values(OpportunityStage).includes(stage)) {
//       return res.status(400).json({ message: "Stage không hợp lệ" });
//     }

//     const data = await opportunityService.getMyOpportunities(user.id, stage);

//     return res.json({
//       message: "Lấy danh sách Opportunity của bạn thành công",
//       data,
//     });
//   } catch (err: any) {
//     return res.status(400).json({ message: err.message });
//   }
// };

/* ============================================================
   10. PIPELINE SUMMARY
============================================================ */
export const getPipelineSummary = async (req: Request, res: Response) => {
  try {
    const data = await opportunityService.getPipelineSummary();

    return res.json({
      message: "Pipeline Summary thành công",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ============================================================
   11. DELETE OPPORTUNITY
============================================================ */
export const deleteOpportunity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = Number(req.params.oppId);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const ok = await opportunityService.deleteOpportunity(oppId, user.id,user.role);

    return res.json({
      message: "Xóa Opportunity thành công",
      data: ok,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getClosingThisMonth = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const data = await opportunityService.getClosingOpportunitiesThisMonth(user.id);

    return res.json({
      message: "Danh sách Opportunity closing trong tháng này",
      data,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getUnclosedOpportunities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await opportunityService.getUnclosedOpportunities(user.id);

    return res.json({
      message: "Danh sách Opportunity chưa đóng",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
