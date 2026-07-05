import crypto from "crypto";
import { comparePassword } from "../../../core/utils/security";
import * as model from "../../../models/index";
import { DocumentSignature } from "../models/documentSignature.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { ApInvoice } from "../models/apInvoice.model";

export const signatureService = {
  /**
   * Ký duyệt tài liệu (PO hoặc AP Invoice)
   */
  async signDocument(
    userId: number,
    documentType: "purchase_order" | "ap_invoice" | "ap_payment",
    documentId: number,
    pin: string,
    signatureImage: string, // Base64 nét vẽ chữ ký tay
    ipAddress?: string
  ) {
    // 1. Kiểm tra User & PIN
    const user = await model.User.findByPk(userId);
    if (!user) {
      throw new Error("Không tìm thấy thông tin người dùng.");
    }
    if (!user.signature_pin) {
      throw new Error("Tài khoản chưa được thiết lập mã PIN ký duyệt. Vui lòng cài đặt trước.");
    }

    const isPinValid = await comparePassword(pin, user.signature_pin);
    if (!isPinValid) {
      throw new Error("Mã PIN ký duyệt không chính xác.");
    }

    // 2. Tìm tài liệu và trích xuất thông tin
    let documentNo = "";
    let totalAmount = 0;
    let targetDoc: PurchaseOrder | ApInvoice | null = null;

    if (documentType === "purchase_order") {
      targetDoc = await PurchaseOrder.findByPk(documentId);
      if (!targetDoc) throw new Error("Không tìm thấy đơn mua hàng (PO).");
      if (targetDoc.status !== "waiting_approval") {
        throw new Error("Đơn mua hàng phải ở trạng thái Chờ duyệt mới được phép ký.");
      }
      documentNo = targetDoc.po_no;
      totalAmount = Number(targetDoc.total_after_tax || 0);
    } else if (documentType === "ap_invoice") {
      targetDoc = await ApInvoice.findByPk(documentId);
      if (!targetDoc) throw new Error("Không tìm thấy hóa đơn mua hàng (AP Invoice).");
      if (targetDoc.approval_status !== "waiting_approval") {
        throw new Error("Hóa đơn mua hàng phải ở trạng thái Chờ duyệt mới được phép ký.");
      }
      documentNo = targetDoc.invoice_no;
      totalAmount = Number(targetDoc.total_after_tax || 0);
    } else {
      throw new Error("Loại tài liệu ký duyệt không hợp lệ.");
    }

    // 3. Tính toán mã băm SHA-256 bảo mật
    const signedAt = new Date();
    const systemSalt = process.env.SYSTEM_SALT || "erp_mini_default_salt_2026";
    const dataToHash = `${documentNo}${totalAmount.toFixed(2)}${userId}${signedAt.toISOString()}${systemSalt}`;
    const hashValue = crypto.createHash("sha256").update(dataToHash).digest("hex");

    // 4. Lưu chữ ký vào bảng `document_signatures`
    const sigData: any = {
      document_type: documentType,
      document_id: documentId,
      signer_id: userId,
      signature_image: signatureImage,
      hash_value: hashValue,
      signed_at: signedAt,
    };
    if (ipAddress) {
      sigData.signer_ip = ipAddress;
    }
    const signature = await DocumentSignature.create(sigData);

    // 5. Cập nhật trạng thái tài liệu gốc
    if (documentType === "purchase_order") {
      const po = targetDoc as PurchaseOrder;
      po.status = "confirmed";
      po.approved_by = userId;
      po.approved_at = signedAt;
      await po.save();
    } else if (documentType === "ap_invoice") {
      const invoice = targetDoc as ApInvoice;
      invoice.approval_status = "approved";
      invoice.status = "posted"; // Post vào sổ nhật ký kế toán sau khi duyệt
      invoice.approved_by = userId;
      invoice.approved_at = signedAt;
      await invoice.save();
    }

    return {
      message: "Ký duyệt tài liệu thành công.",
      hash_value: hashValue,
      signed_at: signedAt,
    };
  },

  /**
   * Tra cứu thông tin xác thực từ mã băm công cộng
   */
  async verifySignature(hashValue: string) {
    const signature = await DocumentSignature.findOne({
      where: { hash_value: hashValue },
      include: [
        {
          model: model.User,
          as: "signer",
          attributes: ["full_name", "email"],
        },
      ],
    });

    if (!signature) {
      return null;
    }

    let docDetails: any = null;
    if (signature.document_type === "purchase_order") {
      const po = await PurchaseOrder.findByPk(signature.document_id, {
        include: [
          {
            model: model.Partner,
            as: "supplier",
            attributes: ["name"],
          },
        ],
      });
      if (po) {
        docDetails = {
          document_id: po.id,
          document_no: po.po_no,
          document_type: "Đơn mua hàng (PO)",
          total_amount: po.total_after_tax,
          supplier_name: (po as any).supplier?.name || "N/A",
          order_date: po.order_date,
          status: po.status,
        };
      }
    } else if (signature.document_type === "ap_invoice") {
      const invoice = await ApInvoice.findByPk(signature.document_id, {
        include: [
          {
            model: model.Partner,
            as: "supplier",
            attributes: ["name"],
          },
        ],
      });
      if (invoice) {
        docDetails = {
          document_id: invoice.id,
          document_no: invoice.invoice_no,
          document_type: "Hóa đơn mua hàng (AP Invoice)",
          total_amount: invoice.total_after_tax,
          supplier_name: (invoice as any).supplier?.name || "N/A",
          order_date: invoice.invoice_date,
          status: invoice.status,
        };
      }
    }

    return {
      hash_value: signature.hash_value,
      document_type: signature.document_type,
      signer_name: (signature as any).signer?.full_name || "N/A",
      signer_email: (signature as any).signer?.email || "N/A",
      signer_ip: signature.signer_ip,
      signed_at: signature.signed_at,
      signature_image: signature.signature_image,
      document: docDetails,
    };
  },

  async confirmPOPublic(hashValue: string, app?: any) {
    const signature = await DocumentSignature.findOne({
      where: { hash_value: hashValue, document_type: "purchase_order" },
    });

    if (!signature) {
      throw new Error("Không tìm thấy chữ ký số hợp lệ cho đơn hàng này.");
    }

    const po = await PurchaseOrder.findByPk(signature.document_id);
    if (!po) {
      throw new Error("Không tìm thấy đơn hàng tương ứng.");
    }

    if (po.status !== "sent") {
      throw new Error("Đơn hàng phải ở trạng thái đã gửi cho nhà cung cấp mới được phép xác nhận.");
    }

    const oldStatus = po.status;
    po.status = "supplier_accepted";
    await po.save();

    // Ghi nhận log lịch sử
    const systemUser = { id: po.created_by, branch_id: po.branch_id };
    const { auditService } = require("./auditService");
    await auditService.logUpdate(
      po,
      { status: oldStatus },
      { status: "supplier_accepted" },
      systemUser
    );

    // Gửi thông báo real-time
    if (app && po.created_by) {
      const io = app.get("io");
      const { notificationService } = require("../../../core/services/notification.service");
      await notificationService.createNotification({
        type: "INFO",
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id!,
        referenceNo: po.po_no!,
        branchId: po.branch_id!,
        submitterId: po.created_by,
        approverName: "Nhà cung cấp (Supplier)",
        message: `Nhà cung cấp đã xác nhận đơn hàng số ${po.po_no}`,
        io,
      });
    }

    return po;
  },
};
