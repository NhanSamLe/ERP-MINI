import { Request, Response } from "express";
import { stockMoveLineService } from "../services/stockMoveLine.service";

export const StockMoveLineController = {
  async getAll(req: Request, res: Response) {
    const data = await stockMoveLineService.getAll();
    return res.json(data);
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await stockMoveLineService.getById(id);

    if (!data) return res.status(404).json({ message: "Not found" });

    return res.json(data);
  },

  async getByMoveId(req: Request, res: Response) {
    const moveId = Number(req.params.moveId);
    const data = await stockMoveLineService.getByMoveId(moveId);
    return res.json(data);
  },

  async create(req: Request, res: Response) {
    const data = await stockMoveLineService.create(req.body);
    return res.status(201).json(data);
  },

  async bulkCreate(req: Request, res: Response) {
    const data = await stockMoveLineService.bulkCreate(req.body.lines ?? []);
    return res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const record = await stockMoveLineService.update(id, req.body);

    if (!record) return res.status(404).json({ message: "Not found" });

    return res.json(record);
  },

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const ok = await stockMoveLineService.delete(id);

    if (!ok) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Deleted successfully" });
  },

  async deleteByMoveId(req: Request, res: Response) {
    const moveId = Number(req.params.moveId);
    const count = await stockMoveLineService.deleteByMoveId(moveId);

    return res.json({ deleted: count });
  },
};
