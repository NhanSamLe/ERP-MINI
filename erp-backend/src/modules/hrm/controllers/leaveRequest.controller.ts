import { Response } from "express";
import { AuthRequest } from "../../../core/middleware/auth";
import * as service from "../services/leaveRequest.service";

export async function getAll(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    const filter: any = {
      branch_id: req.query.branch_id ? Number(req.query.branch_id) : undefined,
      status: req.query.status as string,
    };

    // Nếu không phải ADMIN/CEO và thuộc 1 chi nhánh, giới hạn chi nhánh đó
    if (user && user.role !== "ADMIN" && user.role !== "CEO" && user.branch_id) {
      filter.branch_id = user.branch_id;
    }

    const rows = await service.getAll(filter);
    return res.status(200).json(rows);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getByEmployee(req: AuthRequest, res: Response) {
  try {
    const employeeId = Number(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const rows = await service.getByEmployee(employeeId);
    return res.status(200).json(rows);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const payload = req.body;
    if (!payload.employee_id || !payload.branch_id || !payload.start_date || !payload.end_date) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const row = await service.create(payload, req.user, req.app);
    return res.status(201).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function approve(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const approvedBy = req.user?.id;

    if (!approvedBy) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const row = await service.updateStatus(id, "approved", approvedBy, req.app, req.user);
    return res.status(200).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function reject(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const approvedBy = req.user?.id;

    if (!approvedBy) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const row = await service.updateStatus(id, "rejected", approvedBy, req.app, req.user);
    return res.status(200).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
