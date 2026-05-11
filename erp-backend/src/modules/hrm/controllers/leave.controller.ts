import { Request, Response } from "express";
import * as leaveService from "../services/leave.service";
import * as allocationService from "../services/leaveAllocation.service";

export async function createLeave(req: Request, res: Response) {
  try {
    const leave = await leaveService.createLeaveRequest(
      req.body,
      (req as any).user
    );
    res.status(201).json(leave);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function submitLeave(req: Request, res: Response) {
  try {
    const leave = await leaveService.submitLeaveRequest(
      Number(req.params.id),
      (req as any).user
    );
    res.json(leave);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function cancelLeave(req: Request, res: Response) {
  try {
    const leave = await leaveService.cancelLeaveRequest(Number(req.params.id));
    res.json(leave);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function pendingLeaves(req: Request, res: Response) {
  res.json(await leaveService.listPendingLeaves());
}

export async function approveLeave(req: Request, res: Response) {
  res.json(
    await leaveService.approveLeave(Number(req.params.id), (req as any).user)
  );
}

export async function rejectLeave(req: Request, res: Response) {
  res.json(
    await leaveService.rejectLeave(Number(req.params.id), (req as any).user)
  );
}

export async function allocateLeave(req: Request, res: Response) {
  res.status(201).json(await allocationService.allocateLeave(req.body));
}

export async function listAllocations(req: Request, res: Response) {
  res.json(await allocationService.listAllocations());
}