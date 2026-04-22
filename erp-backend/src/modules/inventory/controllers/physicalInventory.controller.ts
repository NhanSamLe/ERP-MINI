import { Request, Response } from "express";
import { physicalInventoryService } from "../services/physicalInventory.service";

export const physicalInventoryController = {
  /** GET /physical-inventories */
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await physicalInventoryService.getAll(user.branch_id);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /physical-inventories/:id */
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id ?? "");
      const data = await physicalInventoryService.getById(id);
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** POST /physical-inventories */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { warehouse_id, inv_date } = req.body;
      if (!warehouse_id || !inv_date) {
        return res
          .status(400)
          .json({ message: "warehouse_id and inv_date are required" });
      }
      const data = await physicalInventoryService.create(
        {
          warehouse_id: Number(warehouse_id),
          branch_id: user.branch_id,
          inv_date: String(inv_date),
        },
        user.id,
      );
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  /** POST /physical-inventories/:id/start */
  async start(req: Request, res: Response) {
    try {
      const id = Number(req.params.id ?? "");
      const data = await physicalInventoryService.startInventory(id);
      res.json(data);
    } catch (err: any) {
      const status = err.status ?? 500;
      res.status(status).json({ message: err.message });
    }
  },

  /** POST /physical-inventories/:id/lines */
  async addLine(req: Request, res: Response) {
    try {
      const id = Number(req.params.id ?? "");
      const { product_id, location_id, lot_id } = req.body;
      if (!product_id) {
        return res.status(400).json({ message: "product_id is required" });
      }
      const data = await physicalInventoryService.addLine(id, {
        product_id: Number(product_id),
        location_id: location_id ? Number(location_id) : null,
        lot_id: lot_id ? Number(lot_id) : null,
      });
      res.status(201).json(data);
    } catch (err: any) {
      const status = err.status ?? 500;
      res.status(status).json({ message: err.message });
    }
  },

  /** PATCH /physical-inventories/:id/lines/:lineId */
  async updateLine(req: Request, res: Response) {
    try {
      const lineId = Number(req.params.lineId ?? "");
      const { counted_qty } = req.body;
      if (counted_qty === undefined || counted_qty === null) {
        return res.status(400).json({ message: "counted_qty is required" });
      }
      const data = await physicalInventoryService.updateLine(lineId, {
        counted_qty: Number(counted_qty),
      });
      res.json(data);
    } catch (err: any) {
      const status = err.status ?? 500;
      res.status(status).json({ message: err.message });
    }
  },

  /** POST /physical-inventories/:id/validate */
  async validate(req: Request, res: Response) {
    try {
      const id = Number(req.params.id ?? "");
      const user = (req as any).user;
      const data = await physicalInventoryService.validate(id, user.id);
      res.json(data);
    } catch (err: any) {
      const status = err.status ?? 500;
      res.status(status).json({ message: err.message });
    }
  },

  /** POST /physical-inventories/:id/cancel */
  async cancel(req: Request, res: Response) {
    try {
      const id = Number(req.params.id ?? "");
      const data = await physicalInventoryService.cancel(id);
      res.json(data);
    } catch (err: any) {
      const status = err.status ?? 500;
      res.status(status).json({ message: err.message });
    }
  },
};
