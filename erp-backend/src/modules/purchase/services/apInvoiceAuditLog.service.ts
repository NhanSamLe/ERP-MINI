import {
  ApInvoiceAuditLog,
  AuditAction,
} from "../models/apInvoiceAuditLog.model";
import { logger } from "../../../config/logger";

export interface LogCreationParams {
  ap_invoice_id: number;
  source: "manual" | "ai_ocr";
  created_by: number;
  ocr_confidence?: number | null;
  matching_status?: string | null;
  matching_details?: Record<string, any> | null;
  auto_created?: boolean;
}

export interface LogOverrideParams {
  ap_invoice_id: number;
  created_by: number;
  override_reason?: string;
  override_type: "duplicate" | "mismatch" | "manual";
  matching_details?: Record<string, any> | null;
}

export interface LogMismatchParams {
  ap_invoice_id: number;
  created_by: number;
  matching_status: string;
  matching_details: Record<string, any>;
  override_reason?: string;
}

export class ApInvoiceAuditLogService {
  /**
   * Ghi log khi AP Invoice được tạo (manual hoặc ai_ocr)
   *
   * Ví dụ: Kế toán viên xác nhận hóa đơn OCR từ Công ty ABC
   * → action = 'created', source = 'ai_ocr', ocr_confidence = 0.92
   */
  async logCreation(params: LogCreationParams): Promise<void> {
    try {
      const action: AuditAction = params.auto_created
        ? "auto_created"
        : "created";

      await ApInvoiceAuditLog.create({
        ap_invoice_id: params.ap_invoice_id,
        action,
        source: params.source,
        ocr_confidence: params.ocr_confidence ?? null,
        matching_status: params.matching_status ?? null,
        matching_details: params.matching_details ?? null,
        created_by: params.created_by,
      });
    } catch (err: any) {
      // Audit log không được làm fail business logic
      logger.error(
        `ApInvoiceAuditLogService.logCreation failed for invoice ${params.ap_invoice_id}: ${err.message}`,
      );
    }
  }

  /**
   * Ghi log khi kế toán viên ghi đè cảnh báo (trùng lặp, sai lệch, v.v.)
   *
   * Ví dụ: Hóa đơn số INV-2024-001 đã tồn tại nhưng kế toán viên
   * chọn "Ghi đè" với lý do "Hóa đơn điều chỉnh lần 2"
   * → action = 'override_duplicate', override_reason = 'Hóa đơn điều chỉnh lần 2'
   */
  async logOverride(params: LogOverrideParams): Promise<void> {
    try {
      const actionMap: Record<string, AuditAction> = {
        duplicate: "override_duplicate",
        mismatch: "mismatch_accepted",
        manual: "manual_override",
      };

      await ApInvoiceAuditLog.create({
        ap_invoice_id: params.ap_invoice_id,
        action: actionMap[params.override_type] ?? "manual_override",
        override_reason: params.override_reason ?? null,
        matching_details: params.matching_details ?? null,
        created_by: params.created_by,
      });
    } catch (err: any) {
      logger.error(
        `ApInvoiceAuditLogService.logOverride failed for invoice ${params.ap_invoice_id}: ${err.message}`,
      );
    }
  }

  /**
   * Ghi log khi 3-way matching phát hiện sai lệch nhưng vẫn cho phép tạo
   *
   * Ví dụ: Hóa đơn ghi 100 cái nhưng GRN chỉ nhận 80 cái
   * → action = 'mismatch_accepted', matching_details = { qty_mismatch: [...] }
   */
  async logMismatch(params: LogMismatchParams): Promise<void> {
    try {
      await ApInvoiceAuditLog.create({
        ap_invoice_id: params.ap_invoice_id,
        action: "mismatch_accepted",
        matching_status: params.matching_status,
        matching_details: params.matching_details,
        override_reason: params.override_reason ?? null,
        created_by: params.created_by,
      });
    } catch (err: any) {
      logger.error(
        `ApInvoiceAuditLogService.logMismatch failed for invoice ${params.ap_invoice_id}: ${err.message}`,
      );
    }
  }

  /**
   * Lấy toàn bộ audit trail của một AP Invoice (kèm actor info)
   */
  async getAuditTrail(ap_invoice_id: number): Promise<any[]> {
    const { User } = await import("../../auth/models/user.model");
    const logs = await ApInvoiceAuditLog.findAll({
      where: { ap_invoice_id },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "full_name", "email"],
          foreignKey: "created_by",
        },
      ],
      order: [["created_at", "ASC"]],
    });
    return logs;
  }
}

export const apInvoiceAuditLogService = new ApInvoiceAuditLogService();
