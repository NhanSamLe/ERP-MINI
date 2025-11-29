import { Request, Response } from "express";
import * as payrollItemService from "../services/payrollItem.service";
import { PayrollItemFilter } from "../services/payrollItem.service";


export const getPayrollItems = async (req: Request, res: Response) => {
  try {
    const { branch_id, type, search } = req.query;

    const filter: PayrollItemFilter = {};

    if (branch_id !== undefined) {
      filter.branch_id = Number(branch_id);
    }
    if (type !== undefined) {
      filter.type = type as any;
    }
    if (search !== undefined) {
      filter.search = search as string;
    }

    const data = await payrollItemService.getAllPayrollItems(filter);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getPayrollItemDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollItemService.getPayrollItemById(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
};

export const createPayrollItem = async (req: Request, res: Response) => {
  try {
    const row = await payrollItemService.createPayrollItem(req.body);
    return res.status(201).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updatePayrollItem = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollItemService.updatePayrollItem(id, req.body);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const deletePayrollItem = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollItemService.deletePayrollItem(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
