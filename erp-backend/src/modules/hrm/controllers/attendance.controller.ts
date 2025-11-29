import { Request, Response } from "express";
import * as service from "../services/attendance.service";

export async function getAll(req: Request, res: Response) {
  try {
    const data = await service.getAll(req.query);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function getByEmployee(req: Request, res: Response) {
  try {
    const data = await service.getByEmployee(Number(req.params.employeeId));
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = await service.create(req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await service.remove(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}
