import { Request, Response } from "express";
import * as scoringRuleService from "../services/scoringRule.service";

export const getAll = async (req: Request, res: Response) => {
  try {
    const rules = await scoringRuleService.getAllRules();
    res.json({ message: "Lấy cấu hình chấm điểm thành công", data: rules });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const rule = await scoringRuleService.createRule(req.body);
    await scoringRuleService.recalculateLeadsForRule();
    res.status(201).json({ message: "Tạo cấu hình chấm điểm thành công", data: rule });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rule = await scoringRuleService.updateRule(id, req.body);
    await scoringRuleService.recalculateLeadsForRule();
    res.json({ message: "Cập nhật cấu hình chấm điểm thành công", data: rule });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await scoringRuleService.deleteRule(id);
    await scoringRuleService.recalculateLeadsForRule();
    res.json({ message: "Xóa cấu hình chấm điểm thành công", data: null });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const recalculateLead = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);
    const result = await scoringRuleService.calculateLeadScore(leadId);
    res.json({ message: "Đã tính lại điểm cho Lead", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
