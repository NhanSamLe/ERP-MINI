import { Request, Response } from "express";
import * as employeeService from "../services/employee.service";
import { EmployeeFilter } from "../services/employee.service";

export async function listEmployees(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;

    const filter: EmployeeFilter = {};

    if (req.query.search) {
      filter.search = String(req.query.search);
    }
    if (req.query.branch_id) {
      filter.branch_id = Number(req.query.branch_id);
    }
    if (req.query.department_id) {
      filter.department_id = Number(req.query.department_id);
    }
    if (req.query.position_id) {
      filter.position_id = Number(req.query.position_id);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }

    const rows = await employeeService.listEmployees(filter, userJwt);
    return res.json(rows);
  } catch (err: any) {
    console.error("listEmployees error:", err);
    return res.status(400).json({ message: err.message });
  }
}

export async function getEmployee(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const emp = await employeeService.getEmployeeById(id, userJwt);
    return res.json(emp);
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : 400;
    return res.status(status).json({ message: err.message });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;
    const emp = await employeeService.createEmployee(req.body, userJwt);
    return res.status(201).json(emp);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const emp = await employeeService.updateEmployee(id, req.body, userJwt);
    return res.json(emp);
  } catch (err: any) {
    const status = err.message === "Forbidden" ? 403 : 400;
    return res.status(status).json({ message: err.message });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    await employeeService.deleteEmployee(id, userJwt);
    return res.status(204).send();
  } catch (err: any) {
    const status = err.message.includes("Không thể xóa")
      ? 409
      : err.message === "Forbidden"
      ? 403
      : 400;
    return res.status(status).json({ message: err.message });
  }
}

export async function getOwnProfile(req: Request, res: Response) {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) return res.status(401).json({ message: "Unauthorized" });

    const emp = await employeeService.getOwnProfile(userJwt);
    return res.json(emp);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
