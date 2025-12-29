import { Request, Response } from "express";
import * as payrollRunService from "../services/payrollRun.service";
import * as model from "../../../models/index";
import { calculatePayrollRun } from "../services/payrollRun.service";

export const getPayrollRuns = async (req: Request, res: Response) => {
  try {
    const { period_id, status } = req.query;

    const filter: payrollRunService.PayrollRunFilter = {};

    if (typeof period_id === "string") {
      filter.period_id = Number(period_id);
    }
    if (typeof status === "string") {
      filter.status = status as any;
    }

    const data = await payrollRunService.getAllPayrollRuns(filter);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getPayrollRunDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollRunService.getPayrollRunById(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
};

export const createPayrollRun = async (req: Request, res: Response) => {
  try {
    const row = await payrollRunService.createPayrollRun(req.body);
    return res.status(201).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const cancelPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollRunService.cancelPayrollRun(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const postPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollRunService.postPayrollRun(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ====== LINES ======

export const createPayrollRunLine = async (req: Request, res: Response) => {
  try {
    const run_id = Number(req.params.id);
    const payload = { ...req.body, run_id };
    const line = await payrollRunService.createPayrollRunLine(payload);
    return res.status(201).json(line);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updatePayrollRunLine = async (req: Request, res: Response) => {
  try {
    const lineId = Number(req.params.lineId);
    const line = await payrollRunService.updatePayrollRunLine(
      lineId,
      req.body
    );
    return res.json(line);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const deletePayrollRunLine = async (req: Request, res: Response) => {
  try {
    const lineId = Number(req.params.lineId);
    await payrollRunService.deletePayrollRunLine(lineId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ====== PAYSLIP EMPLOYEE ======

export const getMyPayslips = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await model.User.findByPk(userJwt.id);
    if (!user || !(user as any).employee_id) {
      return res
        .status(400)
        .json({ message: "User chưa được liên kết với Employee" });
    }

    const data = await payrollRunService.getPayslipsForEmployee(
      (user as any).employee_id
    );
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getMyPayslipInRun = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await model.User.findByPk(userJwt.id);
    if (!user || !(user as any).employee_id) {
      return res
        .status(400)
        .json({ message: "User chưa được liên kết với Employee" });
    }

    const runId = Number(req.params.id);

    const row = await payrollRunService.getPayslipForEmployeeInRun(
      runId,
      (user as any).employee_id
    );
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const calculateRun = async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const user = (req as any).user;

    const data = await calculatePayrollRun(runId, user);
    return res.json({ message: "Calculated successfully", data });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};