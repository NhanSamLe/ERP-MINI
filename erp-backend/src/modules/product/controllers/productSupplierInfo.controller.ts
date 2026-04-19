import { Request, Response } from "express";
import { productSupplierInfoService } from "../services/productSupplierInfo.service";

export const productSupplierInfoController = {
  /**
   * GET /products/:productId/suppliers
   * Lấy danh sách nhà cung cấp của một product
   */
  async getByProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId || "0");
      if (isNaN(productId) || productId === 0) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const data = await productSupplierInfoService.getByProduct(productId);
      res.json(data);
    } catch (err: any) {
      console.error("Error getting supplier info:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * POST /products/:productId/suppliers
   * Thêm nhà cung cấp cho product
   */
  async create(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId || "0");
      if (isNaN(productId) || productId === 0) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const {
        supplier_id,
        supplier_product_code,
        supplier_product_name,
        min_order_qty,
        lead_time_days,
        price,
        currency_id,
        is_preferred,
      } = req.body;

      const data = {
        product_id: productId,
        supplier_id: Number(supplier_id),
        supplier_product_code: supplier_product_code || null,
        supplier_product_name: supplier_product_name || null,
        min_order_qty: min_order_qty != null ? Number(min_order_qty) : null,
        lead_time_days: lead_time_days != null ? Number(lead_time_days) : null,
        price: price != null ? Number(price) : null,
        currency_id: currency_id != null ? Number(currency_id) : null,
        is_preferred: Boolean(is_preferred),
      };

      const supplierInfo = await productSupplierInfoService.create(data);
      res.status(201).json(supplierInfo);
    } catch (err: any) {
      console.error("Error creating supplier info:", err);
      res.status(400).json({ message: err.message });
    }
  },

  /**
   * PUT /products/:productId/suppliers/:id
   * Cập nhật thông tin nhà cung cấp
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || "0");
      if (isNaN(id) || id === 0) {
        return res.status(400).json({ message: "Invalid supplier info ID" });
      }

      // Chỉ lấy các field được phép, tránh nested objects gây lỗi MySQL
      const {
        supplier_product_code,
        supplier_product_name,
        min_order_qty,
        lead_time_days,
        price,
        currency_id,
        is_preferred,
      } = req.body;

      const data: Partial<
        import("../services/productSupplierInfo.service").ProductSupplierInfoDTO
      > = {
        ...(supplier_product_code !== undefined && {
          supplier_product_code: supplier_product_code || null,
        }),
        ...(supplier_product_name !== undefined && {
          supplier_product_name: supplier_product_name || null,
        }),
        ...(min_order_qty !== undefined && {
          min_order_qty: min_order_qty != null ? Number(min_order_qty) : null,
        }),
        ...(lead_time_days !== undefined && {
          lead_time_days:
            lead_time_days != null ? Number(lead_time_days) : null,
        }),
        ...(price !== undefined && {
          price: price != null ? Number(price) : null,
        }),
        ...(currency_id !== undefined && {
          currency_id: currency_id != null ? Number(currency_id) : null,
        }),
        ...(is_preferred !== undefined && {
          is_preferred: Boolean(is_preferred),
        }),
      };

      const updated = await productSupplierInfoService.update(id, data);
      res.json(updated);
    } catch (err: any) {
      console.error("Error updating supplier info:", err);
      res.status(400).json({ message: err.message });
    }
  },

  /**
   * DELETE /products/:productId/suppliers/:id
   * Xóa nhà cung cấp
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || "0");
      if (isNaN(id) || id === 0) {
        return res.status(400).json({ message: "Invalid supplier info ID" });
      }

      const result = await productSupplierInfoService.delete(id);
      res.json(result);
    } catch (err: any) {
      console.error("Error deleting supplier info:", err);
      res.status(400).json({ message: err.message });
    }
  },

  /**
   * PATCH /products/:productId/suppliers/:id/set-preferred
   * Đặt nhà cung cấp làm ưu tiên
   */
  async setPreferred(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || "0");
      const productId = parseInt(req.params.productId || "0");

      if (isNaN(id) || isNaN(productId) || id === 0 || productId === 0) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const updated = await productSupplierInfoService.setPreferred(
        id,
        productId,
      );
      res.json(updated);
    } catch (err: any) {
      console.error("Error setting preferred supplier:", err);
      res.status(400).json({ message: err.message });
    }
  },
};
