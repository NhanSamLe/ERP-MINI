import { Op } from "sequelize";
import { InvoiceDocument } from "../models/invoiceDocument.model";
import { TaxRate } from "../../../models";
import { VendorMatcherService } from "./vendorMatcher.service";
import { ProductMatcherService } from "./productMatcher.service";
import { DuplicateDetectorService } from "./duplicateDetector.service";
import { OcrEngineFactory } from "./ocrEngine.factory";
import { InvoiceParser } from "./invoiceParser.service";
import {
  generateStoragePath,
  moveFileToFinalPath,
  sanitizeFilename,
} from "../utils/fileUtils";
import { logger } from "../../../config/logger";
import {
  apInvoiceService,
  CreateAPInvoiceLineInput,
} from "../../purchase/services/apInvoice.service";
import { AnomalyDetectorService } from "./anomaly/anomalyDetector.service";
import { AnomalyRepository } from "./anomaly/anomaly.repository";
import { MathConsistencyChecker } from "./anomaly/mathConsistency.checker";
import { StatisticalAnalyzer } from "./anomaly/statistical.analyzer";
import { FraudPatternDetector } from "./anomaly/fraudPattern.detector";
import { BehavioralAnomalyDetector } from "./anomaly/behavioral.detector";
import { IsolationForestAnalyzer } from "./anomaly/isolationForest.analyzer";
import { RiskScoreCalculator } from "./anomaly/riskScore.calculator";
import { ThresholdConfigService } from "./anomaly/thresholdConfig.service";
import { OcrInvoiceData } from "../types/ocr.types";

export interface ConfirmPayload {
  // Fields from frontend (simplified)
  vendor_id?: number | null;
  po_id?: number | null;
  overrideDuplicate?: boolean;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
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
    uom_id?: number | null;
  }>;
  // Fields from legacy/direct usage
  supplier_id?: number;
  invoice_no?: string;
  invoice_date?: Date;
  due_date?: Date;
  discount_amount?: number;
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
    uom_id?: number | null;
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
  private readonly anomalyDetector: AnomalyDetectorService;
  private readonly anomalyRepository: AnomalyRepository;

  constructor(
    anomalyDetector?: AnomalyDetectorService,
    anomalyRepository?: AnomalyRepository,
  ) {
    // Default to fully-wired instances; allow injection for testing
    this.anomalyDetector =
      anomalyDetector ??
      new AnomalyDetectorService(
        new MathConsistencyChecker(),
        new StatisticalAnalyzer(),
        new FraudPatternDetector(),
        new BehavioralAnomalyDetector(),
        new IsolationForestAnalyzer(),
        new RiskScoreCalculator(),
        new ThresholdConfigService(),
      );
    this.anomalyRepository = anomalyRepository ?? new AnomalyRepository();
  }
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

      // ── Anomaly Detection (Requirement 8.1–8.5) ──────────────────────────
      // Run after OCR is done. Fail-safe: errors are logged but do not
      // interrupt the pipeline or change ocr_status.
      try {
        const anomalyResult = await this.anomalyDetector.analyze(
          parsedResult as unknown as OcrInvoiceData,
          doc.id,
          doc.branch_id,
          new Date(),
        );

        // Persist anomaly result to dedicated table (Req 9.1)
        await this.anomalyRepository.save(doc.id, anomalyResult);

        // Denormalize onto the document for fast retrieval (Req 8.2)
        const updatePayload: Record<string, any> = {
          anomaly_result: anomalyResult as unknown as Record<string, any>,
        };

        // Propagate high-risk warning into OCR result warnings (Req 8.5)
        if (anomalyResult.risk_level === "high_risk") {
          const warnings: string[] = Array.isArray(parsedResult.warnings)
            ? [...parsedResult.warnings]
            : [];
          if (!warnings.includes("high_risk_anomaly")) {
            warnings.push("high_risk_anomaly");
          }
          updatePayload.ocr_result = {
            ...(parsedResult as unknown as Record<string, any>),
            warnings,
          };
        }

        await doc.update(updatePayload);
      } catch (anomalyErr: any) {
        logger.error(
          `processOcr: anomaly detection failed for document ${documentId}: ${anomalyErr.message}`,
        );
        // Do NOT change ocr_status — pipeline continues normally
      }
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
      anomaly_result: doc.anomaly_result ?? null,
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

    // Resolve fields — frontend sends simplified payload, backend fills from ocr_result
    const ocr = doc.ocr_result as Record<string, any> | null;

    const supplierId = payload.supplier_id ?? payload.vendor_id ?? null;
    const invoiceNo =
      payload.invoice_no ??
      ocr?.invoice_no ??
      `OCR-${documentId}-${Date.now()}`;

    const parseInvoiceDate = (raw: string | undefined | null): Date => {
      if (!raw) return new Date();
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

    // due_date: let apInvoiceService calculate from payment_term_id if not provided
    const dueDate: Date | undefined = payload.due_date
      ? new Date(payload.due_date)
      : undefined;

    // Fetch tax rates to compute taxes accurately
    const taxRates = await TaxRate.findAll();

    const rawLines = payload.lines ?? payload.items ?? [];
    
    // Calculate line totals before general discount
    const linesWithPreTotal = rawLines.map((item: any) => {
      const qty = item.quantity ?? item.qty ?? 0;
      const price = item.unit_price ?? 0;
      let discountVal = 0;
      if (item.discount_amount) {
        discountVal = item.discount_amount;
      } else if (item.discount_percent) {
        discountVal = (qty * price * item.discount_percent) / 100;
      }
      const preTotal = qty * price - discountVal;
      return { item, qty, price, preTotal };
    });

    const sumPreTotal = linesWithPreTotal.reduce((sum: number, l: any) => sum + l.preTotal, 0);
    const generalDiscount = Number(payload.discount_amount) || 0;

    const resolvedLines: CreateAPInvoiceLineInput[] = linesWithPreTotal.map(({ item, qty, price, preTotal }: any, idx: number) => {
      let lineTotal = preTotal;
      if (generalDiscount > 0 && sumPreTotal > 0) {
        if (idx === linesWithPreTotal.length - 1) {
          const distributedSoFar = linesWithPreTotal
            .slice(0, idx)
            .reduce((sum: number, l: any, i: number) => {
              const share = (l.preTotal / sumPreTotal) * generalDiscount;
              return sum + Math.round(share * 100) / 100;
            }, 0);
          const remainingDiscount = generalDiscount - distributedSoFar;
          lineTotal = Math.round((preTotal - remainingDiscount) * 100) / 100;
        } else {
          const share = (preTotal / sumPreTotal) * generalDiscount;
          lineTotal = Math.round((preTotal - share) * 100) / 100;
        }
      }

      // Calculate tax
      let taxPercent = 0;
      if (item.tax_rate_id) {
        const tr = taxRates.find((t) => Number(t.id) === Number(item.tax_rate_id));
        if (tr) taxPercent = Number(tr.rate ?? 0);
      }
      
      const lineTax = Math.round(((lineTotal * taxPercent) / 100) * 100) / 100;
      const lineTotalAfterTax = Math.round((lineTotal + lineTax) * 100) / 100;

      return {
        product_id: item.product_id ?? null,
        description: item.description ?? item.name ?? "",
        quantity: qty,
        unit_price: price,
        tax_rate_id: item.tax_rate_id ?? null,
        line_total: lineTotal,
        line_tax: lineTax,
        line_total_after_tax: lineTotalAfterTax,
        po_line_id: item.po_line_id ?? null,
        grn_line_id: item.grn_line_id ?? null,
        uom_id: item.uom_id ?? null,
      };
    });

    // Gọi unified entry point — xử lý validation, duplicate, 3-way matching, audit
    let newInvoiceId!: number;
    try {
      const result = await apInvoiceService.createAPInvoice(
        {
          source: "ai_ocr",
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          due_date: dueDate,
          supplier_id: supplierId!,
          po_id: payload.po_id ?? null,
          branch_id: branchId,
          created_by: userId,
          invoice_document_id: documentId,
          ocr_confidence: doc.ocr_confidence ?? null,
          invoice_series: payload.invoice_series ?? ocr?.invoice_series ?? null,
          invoice_template:
            payload.invoice_template ?? ocr?.invoice_template ?? null,
          tax_code: payload.tax_code ?? ocr?.vendor_tax_code ?? null,
          total_before_tax: payload.total_before_tax ?? ocr?.subtotal ?? 0,
          total_tax: payload.total_tax ?? ocr?.tax_amount ?? 0,
          total_after_tax: payload.total_after_tax ?? ocr?.total ?? 0,
          lines: resolvedLines,
          overrideDuplicate: payload.overrideDuplicate ?? false,
          payment_term_id: payload.payment_term_id ?? null,
          currency_id: payload.currency_id ?? null,
          exchange_rate: payload.exchange_rate ?? 1.0,
          ...(payload.overrideDuplicate && {
            override_reason: "Người dùng xác nhận ghi đè từ OCR review",
          }),
        },
        { id: userId, branch_id: branchId, role: "ACCOUNT" },
      );

      newInvoiceId = result.invoice.id;
    } catch (txErr: any) {
      if (txErr.status) throw txErr;
      logger.error(
        `confirmDocument: createAPInvoice failed — ${txErr.message}`,
      );
      const err: any = new Error(
        "Lỗi cơ sở dữ liệu khi xác nhận tài liệu. Vui lòng thử lại.",
      );
      err.status = 500;
      throw err;
    }

    // Cập nhật InvoiceDocument để liên kết với AP Invoice vừa tạo
    await doc.update({ purchase_invoice_id: newInvoiceId });

    // ── Anomaly Override Recording (Requirement 9.5) ──────────────────────
    // If the document had anomaly warnings and the user confirmed anyway,
    // record the override for audit purposes.
    try {
      const anomalyData = doc.anomaly_result as Record<string, any> | null;
      if (anomalyData && anomalyData.risk_level !== "low_risk") {
        await this.anomalyRepository.recordOverride(documentId, userId);
      }
    } catch (overrideErr: any) {
      // Non-critical — log and continue
      logger.error(
        `confirmDocument: failed to record anomaly override for document ${documentId}: ${overrideErr.message}`,
      );
    }

    return { purchase_invoice_id: newInvoiceId };
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
        "ocr_result",
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
