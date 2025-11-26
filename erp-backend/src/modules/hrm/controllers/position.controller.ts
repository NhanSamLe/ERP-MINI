import { Request, Response } from "express";
import {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  PositionFilter,
} from "../services/position.service";

export async function listPositions(req: Request, res: Response) {
  try {
    const { search, branch_id } = req.query;

    const filter: PositionFilter = {};

    if (typeof search === "string" && search.trim()) {
      filter.search = search;
    }

    if (typeof branch_id === "string" && branch_id) {
      filter.branch_id = Number(branch_id);
    }

    const data = await getAllPositions(filter);

    res.json(data);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Error fetching positions",
    });
  }
}

export async function getPosition(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await getPositionById(id);
    res.json(row);
  } catch (err: any) {
    res.status(404).json({
      message: err.message || "Position not found",
    });
  }
}

export async function createPositionHandler(req: Request, res: Response) {
  try {
    const row = await createPosition(req.body);
    res.status(201).json(row);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Error creating position",
    });
  }
}

export async function updatePositionHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await updatePosition(id, req.body);
    res.json(row);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Error updating position",
    });
  }
}

export async function deletePositionHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deletePosition(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Error deleting position",
    });
  }
}
