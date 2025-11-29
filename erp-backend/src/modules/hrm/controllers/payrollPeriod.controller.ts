import { Request, Response } from "express";
import * as payrollPeriodService from "../services/payrollPeriod.service";

export const getPayrollPeriods = async (req: Request, res: Response) => {
  try {
    const { branch_id, status, search } = req.query;

    const data = await payrollPeriodService.getAllPayrollPeriods({
      branch_id: branch_id ? Number(branch_id) : undefined,
      status: status as any,
      search: search as string | undefined,
    });

    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getPayrollPeriodDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollPeriodService.getPayrollPeriodById(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
};

export const createPayrollPeriod = async (req: Request, res: Response) => {
  try {
    const row = await payrollPeriodService.createPayrollPeriod(req.body);
    return res.status(201).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updatePayrollPeriod = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollPeriodService.updatePayrollPeriod(id, req.body);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const closePayrollPeriod = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollPeriodService.closePayrollPeriod(id);
    return res.json({
      message: "Payroll period closed successfully",
      data: row,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const deletePayrollPeriod = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollPeriodService.deletePayrollPeriod(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};