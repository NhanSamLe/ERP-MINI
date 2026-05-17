import { Request, Response } from "express";
import { purchasePriceListService } from "../services/purchasePriceList.service";

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ success: false, message });
}

export const purchasePriceListController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.getAll(
        req.query,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.getById(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.create(
        req.body,
        (req as any).user,
      );
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.update(
        Number(req.params.id),
        req.body,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await purchasePriceListService.delete(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Purchase Price List deleted" });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  // ─── Items ─────────────────────────────────────────────────────────────────

  async addItems(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.addItems(
        Number(req.params.id),
        req.body.items ?? [],
        (req as any).user,
      );
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async updateItem(req: Request, res: Response) {
    try {
      const data = await purchasePriceListService.updateItem(
        Number(req.params.itemId),
        req.body,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async removeItem(req: Request, res: Response) {
    try {
      await purchasePriceListService.removeItem(
        Number(req.params.itemId),
        (req as any).user,
      );
      res.json({ success: true, message: "Item removed" });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  // ─── Price lookup ──────────────────────────────────────────────────────────

  /**
   * GET /api/purchase/price-lists/evaluate-price
   * ?product_id=1&supplier_id=5&quantity=100&price_list_id=2&date=2026-05-10
   *
   * Trả về giá mua tốt nhất cho sản phẩm từ NCC với số lượng cụ thể.
   * Dùng khi nhân viên thêm dòng vào PO hoặc RFQ để auto-fill đơn giá.
   */
  async evaluatePrice(req: Request, res: Response) {
    try {
      const productId = Number(req.query.product_id);
      const supplierId = req.query.supplier_id
        ? Number(req.query.supplier_id)
        : null;
      const quantity = parseFloat(String(req.query.quantity ?? "1"));
      const priceListId = req.query.price_list_id
        ? Number(req.query.price_list_id)
        : undefined;
      const date = req.query.date as string | undefined;

      if (!productId) {
        return res
          .status(400)
          .json({ success: false, message: "product_id is required" });
      }

      const data = await purchasePriceListService.getProductPrice(
        productId,
        supplierId,
        quantity,
        priceListId,
        date,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};
