import { Request, Response } from "express";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/department.service";

export async function getDepartmentsHandler(req: Request, res: Response) {
  try {
    const { search, branch_id } = req.query;
    const rows = await getAllDepartments({
      search: search as string | undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
    });
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function getDepartmentByIdHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await getDepartmentById(id);
    res.json(row);
  } catch (e: any) {
    res.status(404).json({ message: e.message });
  }
}

export async function createDepartmentHandler(req: Request, res: Response) {
  try {
    const dep = await createDepartment(req.body);
    res.status(201).json(dep);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function updateDepartmentHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const dep = await updateDepartment(id, req.body);
    res.json(dep);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function deleteDepartmentHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const result = await deleteDepartment(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Error deleting department",
    });
  }
}
