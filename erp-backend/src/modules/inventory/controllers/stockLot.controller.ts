import { Request, Response } from "express";
import { stockLotService } from "../services/stockLot.service";

export const stockLotController = {
  /** GET /lots?productId=&supplierId= */
  async getAll(req: Request, res: Response) {
    try {
      const filters: { productId?: number; supplierId?: number } = {};
      if (req.query.productId) filters.productId = Number(req.query.productId);
      if (req.query.supplierId)
        filters.supplierId = Number(req.query.supplierId);
      const data = await stockLotService.getAll(filters);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /lots/expiring?days=30 */
  async getExpiring(req: Request, res: Response) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const data = await stockLotService.getExpiringLots(days);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /lots/:id */
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await stockLotService.getById(id);
      if (!data) return res.status(404).json({ message: "Lot not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** GET /products/:productId/lots */
  async getByProduct(req: Request, res: Response) {
    try {
      const productId = Number(req.params.productId);
      const data = await stockLotService.getByProduct(productId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /** POST /lots */
  async create(req: Request, res: Response) {
    try {
      const {
        product_id,
        lot_no,
        serial_no,
        manufacture_date,
        expiry_date,
        supplier_id,
        notes,
      } = req.body;
      if (!product_id || !lot_no) {
        return res
          .status(400)
          .json({ message: "product_id and lot_no are required" });
      }
      const data = await stockLotService.create({
        product_id: Number(product_id),
        lot_no: String(lot_no).trim(),
        serial_no: serial_no || null,
        manufacture_date: manufacture_date || null,
        expiry_date: expiry_date || null,
        supplier_id: supplier_id ? Number(supplier_id) : null,
        notes: notes || null,
      });
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  /** PUT /lots/:id */
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { serial_no, manufacture_date, expiry_date, supplier_id, notes } =
        req.body;

      const updateData: Record<string, any> = {};
      if (serial_no !== undefined) updateData.serial_no = serial_no || null;
      if (manufacture_date !== undefined)
        updateData.manufacture_date = manufacture_date || null;
      if (expiry_date !== undefined)
        updateData.expiry_date = expiry_date || null;
      if (supplier_id !== undefined)
        updateData.supplier_id = supplier_id ? Number(supplier_id) : null;
      if (notes !== undefined) updateData.notes = notes || null;

      const data = await stockLotService.update(id, updateData);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  /** DELETE /lots/:id */
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await stockLotService.delete(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
