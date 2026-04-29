import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { InvoiceDocument } from "../models/invoiceDocument.model";
import { ApInvoice } from "../../purchase/models/apInvoice.model";
import { ApInvoiceLine } from "../../purchase/models/apInvoiceLine.model";
import { VendorMatcherService } from "./vendorMatcher.service";
import { ProductMatcherService } from "./productMatcher.service";
import { DuplicateDetectorService } from "./duplicateDetector.service";
import { ThreeWayMatcherService } from "./threeWayMatcher.service";
import { OcrEngineFactory } from "./ocrEngine.factory";
import { InvoiceParser } from "./invoiceParser.service";
import {
  generateStoragePath,
  moveFileToFinalPath,
  sanitizeFilename,
} from "../utils/fileUtils";
import { logger } from "../../../config/logger";

export interface ConfirmPayload {
  // Fields from frontend (simplified)
  vendor_id?: number | null;
  po_id?: number | null;
  overrideDuplicate?: boolean;
  items?: Array<{
    product_id?: number | null;
    description?: string;
    quantity: number;
    unit_price: number;
    tax_rate_id?: number | null;
    line_total?: number;
    line_tax?: number;
    line_total_after_tax?: number;
    po_line_id?: number;
    grn_line_id?: number;
  }>;
  // Fields from legacy/direct usage
  supplier_id?: number;
  invoice_no?: string;
  invoice_date?: Date;
  due_date?: Date;
  invoice_series?: string;
  invoice_template?: string;
  tax_code?: string;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  lines?: Array<{
    product_id: number;
    description?: string;
    quantity: number;
    unit_price: number;
    tax_rate_id?: number;
    line_total: number;
    line_tax?: number;
    line_total_after_tax?: number;
    po_line_id?: number;
    grn_line_id?: number;
  }>;
}

export interface HistoryFilters {
  ocr_status?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface Pagination {
  page: number;
  limit: number;
}

export class DocumentService {
  async uploadDocument(
    file: Express.Multer.File,
    branchId: number,
    userId: number,
  ): Promise<{ documentId: number; status: string }> {
    const sanitized = sanitizeFilename(file.originalname);
    const { storagePath, ext } = generateStoragePath(branchId, sanitized);

    try {
      await moveFileToFinalPath(file.path, storagePath);
    } catch (ioErr: any) {
      logger.error(`uploadDocument: file I/O error — ${ioErr.message}`);
      const err: any = new Error(
        "Không thể lưu tệp tải lên. Vui lòng thử lại.",
      );
      err.status = 500;
      throw err;
    }

    const doc = await InvoiceDocument.create({
      branch_id: branchId,
      original_filename: sanitized,
      file_path: storagePath,
      file_type: ext as "pdf" | "jpg" | "png",
      ocr_status: "pending",
      ocr_engine: (process.env.OCR_ENGINE || "openai_vision") as
        | "openai_vision"
        | "google_doc_ai",
      created_by: userId,
    });

    // Trigger OCR asynchronously — do not await
    this.processOcr(doc.id).catch((err) => {
      logger.error(
        `Background OCR failed for document ${doc.id}: ${err.message}`,
      );
    });

    return { documentId: doc.id, status: "processing" };
  }

  async processOcr(documentId: number): Promise<void> {
    let doc: InvoiceDocument | null = null;
    try {
      doc = await InvoiceDocument.findByPk(documentId);
      if (!doc) {
        logger.error(`processOcr: document ${documentId} not found`);
        return;
      }

      await doc.update({ ocr_status: "processing" });

      const engine = OcrEngineFactory.create();
      const rawResult = await engine.extract(doc.file_path);

      const parsedResult = new InvoiceParser().parseOcrResult(rawResult);

      await doc.update({
        ocr_status: "done",
        ocr_result: parsedResult as unknown as Record<string, any>,
        ocr_confidence: parsedResult.overall_confidence,
        processing_time_ms: rawResult.processing_time_ms,
        ocr_engine: (process.env.OCR_ENGINE || "openai_vision") as
          | "openai_vision"
          | "google_doc_ai",
      });
    } catch (err: any) {
      logger.error(
        `processOcr error for document ${documentId}: ${err.message}`,
      );
      if (doc) {
        await doc
          .update({ ocr_status: "failed", ocr_raw_text: err.message })
          .catch((updateErr) => {
            logger.error(
              `Failed to update ocr_status to failed: ${updateErr.message}`,
            );
          });
      }
    }
  }

  async getDocumentStatus(
    documentId: number,
    branchId: number,
  ): Promise<Record<string, any>> {
    const doc = await InvoiceDocument.findByPk(documentId);

    if (!doc) {
      const err: any = new Error("Không tìm thấy tài liệu");
      err.status = 404;
      throw err;
    }

    if (doc.branch_id !== branchId) {
      const err: any = new Error("Không có quyền truy cập tài liệu này");
      err.status = 403;
      throw err;
    }

    switch (doc.ocr_status) {
      case "pending":
        return { status: "pending", progress: 0 };

      case "processing":
        return { status: "processing", progress: 50 };

      case "done": {
        const ocrResult = doc.ocr_result as Record<string, any> | null;
        const fieldsExtracted = ocrResult
          ? Object.values(ocrResult).filter(
              (v) => v !== null && v !== undefined && v !== "",
            ).length
          : 0;
        return {
          status: "done",
          confidence: doc.ocr_confidence,
          fieldsExtracted,
          fieldsTotal: 10,
          warnings: ocrResult?.warnings ?? [],
        };
      }

      case "failed":
        return {
          status: "failed",
          message: "Không thể xử lý OCR. Vui lòng nhập liệu thủ công.",
        };

      default:
        return { status: doc.ocr_status };
    }
  }

  async getEnrichedResult(
    documentId: number,
    branchId: number,
  ): Promise<Record<string, any>> {
    const doc = await InvoiceDocument.findByPk(documentId);

    if (!doc) {
      const err: any = new Error("Không tìm thấy tài liệu");
      err.status = 404;
      throw err;
    }

    if (doc.branch_id !== branchId) {
      const err: any = new Error("Không có quyền truy cập tài liệu này");
      err.status = 403;
      throw err;
    }

    if (doc.ocr_status !== "done") {
      const err: any = new Error("OCR chưa hoàn thành");
      err.status = 400;
      throw err;
    }

    const ocrResult = doc.ocr_result as Record<string, any>;

    const vendorMatcher = new VendorMatcherService();
    const vendorMatch = await vendorMatcher.match(
      ocrResult.vendor_name ?? "",
      ocrResult.vendor_tax_code ?? "",
      branchId,
    );

    const productMatcher = new ProductMatcherService();
    const productMatches = await productMatcher.matchItems(
      ocrResult.items ?? [],
      branchId,
    );

    let duplicateWarning = null;
    if (vendorMatch.matchedPartnerId) {
      const duplicateDetector = new DuplicateDetectorService();
      const dupResult = await duplicateDetector.check(
        ocrResult.invoice_no ?? "",
        vendorMatch.matchedPartnerId,
        branchId,
      );
      if (dupResult.isDuplicate) {
        duplicateWarning = {
          isDuplicate: dupResult.isDuplicate,
          existingInvoiceId: dupResult.existingInvoiceId,
          existingInvoiceDate: dupResult.existingInvoiceDate,
          vendorName: dupResult.vendorName,
          message: dupResult.message,
        };
      }
    }

    const vendorSuggestion =
      vendorMatch.matchedPartnerId === null
        ? vendorMatch.suggestion
        : undefined;

    return {
      document: {
        id: doc.id,
        original_filename: doc.original_filename,
        ocr_status: doc.ocr_status,
        ocr_confidence: doc.ocr_confidence,
        ocr_result: ocrResult,
        created_at: doc.created_at,
      },
      vendor_match: {
        matchedPartnerId: vendorMatch.matchedPartnerId,
        matchConfidence: vendorMatch.matchConfidence,
        matchMethod: vendorMatch.matchMethod,
        suggestion: vendorMatch.suggestion,
        vendorSuggestion,
        createVendorUrl: "/api/partners/create",
      },
      product_matches: productMatches,
      duplicateWarning,
      warnings: ocrResult.warnings ?? [],
    };
  }

  async confirmDocument(
    documentId: number,
    branchId: number,
    userId: number,
    payload: ConfirmPayload,
  ): Promise<{ purchase_invoice_id: number }> {
    const doc = await InvoiceDocument.findByPk(documentId);

    if (!doc) {
      const err: any = new Error("Không tìm thấy tài liệu");
      err.status = 404;
      throw err;
    }

    if (doc.branch_id !== branchId) {
      const err: any = new Error("Không có quyền truy cập tài liệu này");
      err.status = 403;
      throw err;
    }

    if (doc.purchase_invoice_id) {
      const err: any = new Error("Tài liệu này đã được xác nhận");
      err.status = 409;
      throw err;
    }

    if (payload.overrideDuplicate) {
      logger.warn(
        `Override duplicate: userId=${userId}, documentId=${documentId}, timestamp=${new Date().toISOString()}`,
      );
    }

    // Resolve fields — frontend sends simplified payload, backend fills from ocr_result
    const ocr = doc.ocr_result as Record<string, any> | null;

    const supplierId = payload.supplier_id ?? payload.vendor_id ?? null;
    const invoiceNo =
      payload.invoice_no ??
      ocr?.invoice_no ??
      `OCR-${documentId}-${Date.now()}`;
    const invoiceSeries = payload.invoice_series ?? ocr?.invoice_series ?? null;
    const invoiceTemplate =
      payload.invoice_template ?? ocr?.invoice_template ?? null;
    const taxCode = payload.tax_code ?? ocr?.vendor_tax_code ?? null;
    const parseInvoiceDate = (raw: string | undefined | null): Date => {
      if (!raw) return new Date();
      // Handle DD/MM/YYYY format
      const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const m = String(raw).trim().match(ddmmyyyy);
      if (m)
        return new Date(
          `${m[3]!}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`,
        );
      const d = new Date(raw);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const invoiceDate = payload.invoice_date
      ? parseInvoiceDate(String(payload.invoice_date))
      : parseInvoiceDate(ocr?.invoice_date);
    const totalBeforeTax = payload.total_before_tax ?? ocr?.subtotal ?? 0;
    const totalTax = payload.total_tax ?? ocr?.tax_amount ?? 0;
    const totalAfterTax = payload.total_after_tax ?? ocr?.total ?? 0;

    // Resolve lines — frontend sends items[], backend expects lines[]
    const resolvedLines = (payload.lines ?? payload.items ?? []).map(
      (item: any) => {
        const qty = item.quantity ?? item.qty ?? 0;
        const price = item.unit_price ?? 0;
        const lineTotal = item.line_total ?? qty * price;
        return {
          product_id: item.product_id ?? null,
          description: item.description ?? item.name ?? "",
          quantity: qty,
          unit_price: price,
          tax_rate_id: item.tax_rate_id ?? null,
          line_total: lineTotal,
          line_tax: item.line_tax ?? 0,
          line_total_after_tax: item.line_total_after_tax ?? lineTotal,
          po_line_id: item.po_line_id ?? null,
          grn_line_id: item.grn_line_id ?? null,
        };
      },
    );

    let newInvoiceId!: number;

    try {
      await sequelize.transaction(async (t) => {
        const newInvoice = await ApInvoice.create(
          {
            source: "ai_ocr",
            invoice_document_id: documentId,
            ...(doc.ocr_confidence != null && {
              ocr_confidence: doc.ocr_confidence,
            }),
            branch_id: branchId,
            created_by: userId,
            approval_status: "draft",
            supplier_id: supplierId,
            invoice_no: invoiceNo,
            invoice_date: invoiceDate,
            ...(payload.due_date !== undefined && {
              due_date: payload.due_date,
            }),
            ...(payload.po_id != null && { po_id: payload.po_id }),
            ...(invoiceSeries != null && { invoice_series: invoiceSeries }),
            ...(invoiceTemplate != null && {
              invoice_template: invoiceTemplate,
            }),
            ...(taxCode != null && { tax_code: taxCode }),
            total_before_tax: totalBeforeTax,
            total_tax: totalTax,
            total_after_tax: totalAfterTax,
          },
          { transaction: t },
        );

        newInvoiceId = newInvoice.id;

        for (const line of resolvedLines) {
          await ApInvoiceLine.create(
            {
              ap_invoice_id: newInvoice.id,
              product_id: line.product_id,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              ...(line.tax_rate_id != null && {
                tax_rate_id: line.tax_rate_id,
              }),
              line_total: line.line_total,
              line_tax: line.line_tax,
              line_total_after_tax: line.line_total_after_tax,
              po_line_id: line.po_line_id ?? null,
              grn_line_id: line.grn_line_id ?? null,
            },
            { transaction: t },
          );
        }

        await doc.update(
          { purchase_invoice_id: newInvoice.id },
          { transaction: t },
        );
      });
    } catch (txErr: any) {
      if (txErr.status) throw txErr; // already a known error, re-throw as-is
      logger.error(`confirmDocument: transaction failed — ${txErr.message}`);
      const err: any = new Error(
        "Lỗi cơ sở dữ liệu khi xác nhận tài liệu. Vui lòng thử lại.",
      );
      err.status = 500;
      throw err;
    }

    // Run three-way matching asynchronously if PO exists
    if (payload.po_id) {
      const matcher = new ThreeWayMatcherService();
      matcher.match(newInvoiceId!).catch((err) => {
        logger.error(
          `Three-way matching failed for invoice ${newInvoiceId!}: ${err.message}`,
        );
      });
    }

    return { purchase_invoice_id: newInvoiceId! };
  }

  async getDocumentHistory(
    branchId: number,
    filters: HistoryFilters,
    pagination: Pagination,
  ): Promise<Record<string, any>> {
    const limit = Math.min(pagination.limit, 100);
    const page = Math.max(pagination.page, 1);
    const offset = (page - 1) * limit;

    const where: Record<string, any> = { branch_id: branchId };

    if (filters.ocr_status) {
      where.ocr_status = filters.ocr_status;
    }

    if (filters.date_from || filters.date_to) {
      where.created_at = {};
      if (filters.date_from) {
        where.created_at[Op.gte] = filters.date_from;
      }
      if (filters.date_to) {
        where.created_at[Op.lte] = filters.date_to;
      }
    }

    const { count, rows } = await InvoiceDocument.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        "original_filename",
        "ocr_status",
        "ocr_confidence",
        "purchase_invoice_id",
        "created_at",
        "processing_time_ms",
      ],
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}
