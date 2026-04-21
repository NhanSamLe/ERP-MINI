import { Request, Response } from "express";
import { stockLocationService } from "../services/stockLocation.service";
import { StockLocationType } from "../models/stockLocation.model";

export const stockLocationController = {
  /** GET /locations?warehouseId=1 */
  async getAll(req: Request, res: Response) {
    try {
      const warehouseId = parseInt(req.query.warehouseId as string);
      if (!warehouseId)
        return res.status(400).json({ message: "warehouseId is required" });
      const data = await stockLocationService.getAll(warehouseId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /locations/tree?warehouseId=1 */
  async getTree(req: Request, res: Response) {
    try {
      const warehouseId = parseInt(req.query.warehouseId as string);
      if (!warehouseId)
        return res.status(400).json({ message: "warehouseId is required" });
      const data = await stockLocationService.getTree(warehouseId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /locations/:id */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id ?? "");
      const data = await stockLocationService.getById(id);
      if (!data) return res.status(404).json({ message: "Location not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /locations/by-type?warehouseId=1&type=internal */
  async getByType(req: Request, res: Response) {
    try {
      const warehouseId = parseInt(req.query.warehouseId as string);
      const type = req.query.type as StockLocationType;
      if (!warehouseId || !type)
        return res
          .status(400)
          .json({ message: "warehouseId and type are required" });
      const data = await stockLocationService.getByType(warehouseId, type);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** POST /locations */
  async create(req: Request, res: Response) {
    try {
      const { warehouse_id, parent_id, name, code, type, is_active } = req.body;
      if (!warehouse_id || !name || !code || !type) {
        return res
          .status(400)
          .json({ message: "warehouse_id, name, code, type are required" });
      }
      const data = await stockLocationService.create({
        warehouse_id: Number(warehouse_id),
        parent_id: parent_id ? Number(parent_id) : null,
        name,
        code,
        type,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      });
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  /** PUT /locations/:id */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id ?? "");
      const { parent_id, name, type, is_active } = req.body as {
        parent_id?: string | number | null;
        name?: string;
        type?: StockLocationType;
        is_active?: boolean;
      };
      const data = await stockLocationService.update(id, {
        ...(parent_id !== undefined && {
          parent_id: parent_id ? Number(parent_id) : null,
        }),
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      });
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  /** DELETE /locations/:id */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id ?? "");
      await stockLocationService.delete(id);
      res.json({ message: "Location deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
