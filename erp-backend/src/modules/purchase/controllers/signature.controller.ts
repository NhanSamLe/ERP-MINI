import { Request, Response } from "express";
import { signatureService } from "../services/signature.service";

export const signatureController = {
  /**
   * Ký duyệt Đơn mua hàng (PO)
   * POST /api/purchase-order/:id/sign
   */
  async signPurchaseOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const { pin, signature_image } = req.body;

      if (!pin || !signature_image) {
        return res.status(400).json({ message: "Mã PIN và hình ảnh chữ ký là bắt buộc." });
      }

      // Lấy IP của Client gửi yêu cầu
      const ipAddress = req.ip || req.headers["x-forwarded-for"] as string || "";

      const result = await signatureService.signDocument(
        user.id,
        "purchase_order",
        id,
        pin,
        signature_image,
        ipAddress
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Ký duyệt đơn hàng thất bại." });
    }
  },

  /**
   * Ký duyệt Hóa đơn mua hàng (AP Invoice)
   * POST /api/ap/invoices/:id/sign
   */
  async signApInvoice(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const { pin, signature_image } = req.body;

      if (!pin || !signature_image) {
        return res.status(400).json({ message: "Mã PIN và hình ảnh chữ ký là bắt buộc." });
      }

      const ipAddress = req.ip || req.headers["x-forwarded-for"] as string || "";

      const result = await signatureService.signDocument(
        user.id,
        "ap_invoice",
        id,
        pin,
        signature_image,
        ipAddress
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Ký duyệt hóa đơn thất bại." });
    }
  },

  /**
   * API Công khai - Tra cứu/Xác thực chữ ký từ mã băm
   * GET /api/public/verify-signature/:hash
   */
  async verifyPublicSignature(req: Request, res: Response) {
    try {
      const { hash } = req.params;
      const result = await signatureService.verifySignature(hash as string);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Mã xác thực không tồn tại hoặc tài liệu đã bị thay đổi.",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Lỗi hệ thống khi xác thực." });
    }
  },

  async confirmPurchaseOrderPublicly(req: Request, res: Response) {
    try {
      const { hash } = req.params;
      const result = await signatureService.confirmPOPublic(hash as string, req.app);
      res.status(200).json({
        success: true,
        message: "Xác nhận đơn hàng thành công.",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Lỗi khi xác nhận đơn hàng." });
    }
  },
};
