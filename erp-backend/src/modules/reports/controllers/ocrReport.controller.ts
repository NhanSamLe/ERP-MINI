import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { InvoiceDocument } from "../../document-intelligence/models/invoiceDocument.model";
import { ApInvoice } from "../../purchase/models/apInvoice.model";
import { Partner } from "../../partner/models/partner.model";
import { ApInvoiceLine } from "../../purchase/models/apInvoiceLine.model";
import { Product } from "../../product/models/product.model";

function buildDateWhere(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: any = {};
  if (from) range[Op.gte] = new Date(from);
  if (to) range[Op.lte] = new Date(to);
  return range;
}

export const ocrReportController = {
  /**
   * GET /api/reports/ocr/processing
   * Báo cáo tổng hợp xử lý OCR: tổng tài liệu, tỷ lệ thành công,
   * confidence trung bình, tỷ lệ tạo tự động.
   *
   * Query params:
   *   - date_from, date_to (ISO string)
   *   - branch_id (optional, default: user.branch_id)
   *
   * Ví dụ thực tế: Trưởng phòng muốn xem trong tháng 5 có bao nhiêu
   * hóa đơn được OCR, bao nhiêu thành công, confidence trung bình là bao nhiêu.
   */
  async ocrProcessing(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date_from, date_to } = req.query;
      const branchId = user.branch_id;

      const dateWhere = buildDateWhere(date_from as string, date_to as string);

      const docWhere: any = { branch_id: branchId };
      if (dateWhere) docWhere.created_at = dateWhere;

      // Tổng tài liệu
      const totalDocuments = await InvoiceDocument.count({ where: docWhere });

      // Theo trạng thái OCR
      const byStatus = await InvoiceDocument.findAll({
        where: docWhere,
        attributes: ["ocr_status", [fn("COUNT", col("id")), "count"]],
        group: ["ocr_status"],
        raw: true,
      });

      const statusMap: Record<string, number> = {};
      for (const row of byStatus as any[]) {
        statusMap[row.ocr_status] = Number(row.count);
      }

      const successfulOCR = statusMap["done"] ?? 0;
      const failedOCR = statusMap["failed"] ?? 0;
      const pendingOCR =
        (statusMap["pending"] ?? 0) + (statusMap["processing"] ?? 0);

      // Confidence trung bình (chỉ tính các doc đã done)
      const confidenceResult = (await InvoiceDocument.findOne({
        where: {
          ...docWhere,
          ocr_status: "done",
          ocr_confidence: { [Op.ne]: null },
        },
        attributes: [[fn("AVG", col("ocr_confidence")), "avg_confidence"]],
        raw: true,
      })) as any;
      const averageConfidence = confidenceResult?.avg_confidence
        ? parseFloat(confidenceResult.avg_confidence)
        : 0;

      // Thời gian xử lý trung bình (ms)
      const processingTimeResult = (await InvoiceDocument.findOne({
        where: {
          ...docWhere,
          ocr_status: "done",
          processing_time_ms: { [Op.ne]: null },
        },
        attributes: [[fn("AVG", col("processing_time_ms")), "avg_time"]],
        raw: true,
      })) as any;
      const averageProcessingTimeMs = processingTimeResult?.avg_time
        ? parseFloat(processingTimeResult.avg_time)
        : 0;

      // Invoice từ OCR trong khoảng thời gian
      const invoiceWhere: any = { branch_id: branchId, source: "ai_ocr" };
      if (dateWhere) invoiceWhere.created_at = dateWhere;

      const totalOcrInvoices = await ApInvoice.count({ where: invoiceWhere });

      // Tỷ lệ tạo tự động (confidence >= 0.85)
      const autoCreatedInvoices = await ApInvoice.count({
        where: {
          ...invoiceWhere,
          ocr_confidence: { [Op.gte]: 0.85 },
        },
      });

      const manualReviewRequired = totalOcrInvoices - autoCreatedInvoices;
      const autoCreatePercentage =
        totalOcrInvoices > 0
          ? Math.round((autoCreatedInvoices / totalOcrInvoices) * 100)
          : 0;

      res.json({
        period: { date_from: date_from ?? null, date_to: date_to ?? null },
        documents: {
          total: totalDocuments,
          successful: successfulOCR,
          failed: failedOCR,
          pending: pendingOCR,
          success_rate:
            totalDocuments > 0
              ? Math.round((successfulOCR / totalDocuments) * 100)
              : 0,
        },
        quality: {
          average_confidence: Math.round(averageConfidence * 10000) / 10000,
          average_confidence_pct: Math.round(averageConfidence * 100),
          average_processing_time_ms: Math.round(averageProcessingTimeMs),
        },
        invoices: {
          total_ocr_invoices: totalOcrInvoices,
          auto_created: autoCreatedInvoices,
          manual_review_required: manualReviewRequired,
          auto_create_percentage: autoCreatePercentage,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /api/reports/ocr/three-way-matching
   * Báo cáo kết quả đối soát 3 chiều: tổng invoice, tỷ lệ matched,
   * top vendors/products có sai lệch cao nhất.
   *
   * Ví dụ thực tế: Trưởng phòng muốn biết nhà cung cấp nào hay có
   * sai lệch giá/số lượng để đàm phán lại hợp đồng.
   */
  async threeWayMatching(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date_from, date_to } = req.query;
      const branchId = user.branch_id;

      const dateWhere = buildDateWhere(date_from as string, date_to as string);
      const baseWhere: any = { branch_id: branchId };
      if (dateWhere) baseWhere.created_at = dateWhere;

      // Tổng invoice có PO (mới có 3-way matching)
      const totalInvoices = await ApInvoice.count({
        where: { ...baseWhere, po_id: { [Op.ne]: null } },
      });

      // Theo matching_status
      const byMatchingStatus = await ApInvoice.findAll({
        where: { ...baseWhere, po_id: { [Op.ne]: null } },
        attributes: ["matching_status", [fn("COUNT", col("id")), "count"]],
        group: ["matching_status"],
        raw: true,
      });

      const matchingMap: Record<string, number> = {};
      for (const row of byMatchingStatus as any[]) {
        matchingMap[row.matching_status] = Number(row.count);
      }

      const matchedInvoices = matchingMap["matched"] ?? 0;
      const mismatchInvoices = matchingMap["mismatch"] ?? 0;
      const pendingInvoices = matchingMap["pending"] ?? 0;

      // Đếm qty_mismatch và price_mismatch từ ap_invoice_lines
      const lineWhere: any = {};
      if (dateWhere) {
        // Join với ap_invoices để filter theo date
      }

      const qtyMismatchCount = await ApInvoiceLine.count({
        where: { matching_result: "qty_mismatch" },
        include: [
          {
            model: ApInvoice,
            as: "invoice",
            where: baseWhere,
            required: true,
          },
        ],
      });

      const priceMismatchCount = await ApInvoiceLine.count({
        where: { matching_result: "price_mismatch" },
        include: [
          {
            model: ApInvoice,
            as: "invoice",
            where: baseWhere,
            required: true,
          },
        ],
      });

      // Top 5 vendors có mismatch nhiều nhất
      const topVendorsMismatch = await ApInvoice.findAll({
        where: { ...baseWhere, matching_status: "mismatch" },
        attributes: [
          "supplier_id",
          [fn("COUNT", col("ApInvoice.id")), "mismatch_count"],
        ],
        include: [
          {
            model: Partner,
            as: "invoiceSupplier",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        group: ["supplier_id", "invoiceSupplier.id", "invoiceSupplier.name"],
        order: [[literal("mismatch_count"), "DESC"]],
        limit: 5,
        raw: false,
      });

      // Top 5 products có mismatch nhiều nhất
      const topProductsMismatch = await ApInvoiceLine.findAll({
        where: {
          matching_result: { [Op.in]: ["qty_mismatch", "price_mismatch"] },
        },
        attributes: [
          "product_id",
          [fn("COUNT", col("ApInvoiceLine.id")), "mismatch_count"],
        ],
        include: [
          {
            model: ApInvoice,
            as: "invoice",
            where: baseWhere,
            required: true,
            attributes: [],
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        group: ["product_id", "product.id", "product.name"],
        order: [[literal("mismatch_count"), "DESC"]],
        limit: 5,
        raw: false,
      });

      res.json({
        period: { date_from: date_from ?? null, date_to: date_to ?? null },
        summary: {
          total_invoices_with_po: totalInvoices,
          matched: matchedInvoices,
          mismatch: mismatchInvoices,
          pending: pendingInvoices,
          match_rate:
            totalInvoices > 0
              ? Math.round((matchedInvoices / totalInvoices) * 100)
              : 0,
        },
        mismatch_breakdown: {
          qty_mismatch_lines: qtyMismatchCount,
          price_mismatch_lines: priceMismatchCount,
          total_mismatch_lines: qtyMismatchCount + priceMismatchCount,
        },
        top_vendors_with_mismatches: topVendorsMismatch.map((inv: any) => ({
          supplier_id: inv.supplier_id,
          supplier_name: inv.invoiceSupplier?.name ?? "Unknown",
          mismatch_count: Number(inv.dataValues?.mismatch_count ?? 0),
        })),
        top_products_with_mismatches: topProductsMismatch.map((line: any) => ({
          product_id: line.product_id,
          product_name: line.product?.name ?? "Unknown",
          mismatch_count: Number(line.dataValues?.mismatch_count ?? 0),
        })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /api/reports/ocr/duplicate-detection
   * Báo cáo phát hiện hóa đơn trùng lặp: tổng trùng lặp,
   * top vendors hay bị trùng.
   *
   * Ví dụ thực tế: Compliance officer muốn biết nhà cung cấp nào
   * hay gửi hóa đơn trùng để kiểm tra gian lận.
   */
  async duplicateDetection(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date_from, date_to } = req.query;
      const branchId = user.branch_id;

      const dateWhere = buildDateWhere(date_from as string, date_to as string);
      const baseWhere: any = { branch_id: branchId };
      if (dateWhere) baseWhere.created_at = dateWhere;

      // Tìm các invoice_no bị trùng (cùng supplier, cùng branch, không cancelled)
      const duplicateGroups = await ApInvoice.findAll({
        where: {
          ...baseWhere,
          status: { [Op.ne]: "cancelled" },
        },
        attributes: [
          "invoice_no",
          "supplier_id",
          [fn("COUNT", col("id")), "count"],
          [fn("MIN", col("created_at")), "first_created"],
          [fn("MAX", col("created_at")), "last_created"],
        ],
        group: ["invoice_no", "supplier_id"],
        having: literal("COUNT(id) > 1"),
        raw: true,
      });

      const totalDuplicatesDetected = duplicateGroups.length;

      // Top vendors có nhiều trùng lặp nhất
      const vendorDupMap: Record<number, { count: number; name?: string }> = {};
      for (const group of duplicateGroups as any[]) {
        const sid = group.supplier_id;
        if (!vendorDupMap[sid]) vendorDupMap[sid] = { count: 0 };
        vendorDupMap[sid].count += 1;
      }

      // Lấy tên vendor
      const supplierIds = Object.keys(vendorDupMap).map(Number);
      if (supplierIds.length > 0) {
        const vendors = await Partner.findAll({
          where: { id: { [Op.in]: supplierIds } },
          attributes: ["id", "name"],
          raw: true,
        });
        for (const v of vendors as any[]) {
          if (vendorDupMap[v.id]) vendorDupMap[v.id].name = v.name;
        }
      }

      const topVendorsWithDuplicates = Object.entries(vendorDupMap)
        .map(([id, data]) => ({
          supplier_id: Number(id),
          supplier_name: data.name ?? "Unknown",
          duplicate_count: data.count,
        }))
        .sort((a, b) => b.duplicate_count - a.duplicate_count)
        .slice(0, 5);

      // Tổng invoice bị override duplicate (từ audit logs nếu có)
      // Đây là estimate dựa trên invoice có cùng invoice_no
      const totalOverridden = (duplicateGroups as any[]).reduce(
        (sum, g) => sum + (Number(g.count) - 1),
        0,
      );

      res.json({
        period: { date_from: date_from ?? null, date_to: date_to ?? null },
        summary: {
          total_duplicate_groups: totalDuplicatesDetected,
          total_overridden_invoices: totalOverridden,
        },
        top_vendors_with_duplicates: topVendorsWithDuplicates,
        duplicate_details: (duplicateGroups as any[]).slice(0, 20).map((g) => ({
          invoice_no: g.invoice_no,
          supplier_id: g.supplier_id,
          count: Number(g.count),
          first_created: g.first_created,
          last_created: g.last_created,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /api/reports/ocr/confidence-distribution
   * Phân phối độ tin cậy OCR: histogram theo bucket 0-10%, 10-20%...
   * Giúp đánh giá chất lượng OCR engine.
   *
   * Ví dụ thực tế: IT manager muốn biết phần lớn hóa đơn có confidence
   * ở mức nào để quyết định có cần nâng cấp OCR engine không.
   */
  async confidenceDistribution(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date_from, date_to } = req.query;
      const branchId = user.branch_id;

      const dateWhere = buildDateWhere(date_from as string, date_to as string);
      const docWhere: any = {
        branch_id: branchId,
        ocr_status: "done",
        ocr_confidence: { [Op.ne]: null },
      };
      if (dateWhere) docWhere.created_at = dateWhere;

      const docs = await InvoiceDocument.findAll({
        where: docWhere,
        attributes: ["ocr_confidence"],
        raw: true,
      });

      // Tạo histogram 10 buckets: 0-10%, 10-20%, ..., 90-100%
      const buckets: Record<string, number> = {
        "0-10": 0,
        "10-20": 0,
        "20-30": 0,
        "30-40": 0,
        "40-50": 0,
        "50-60": 0,
        "60-70": 0,
        "70-80": 0,
        "80-90": 0,
        "90-100": 0,
      };

      for (const doc of docs as any[]) {
        const conf = parseFloat(doc.ocr_confidence) * 100;
        const bucket = Math.min(Math.floor(conf / 10) * 10, 90);
        const key = `${bucket}-${bucket + 10}`;
        if (buckets[key] !== undefined) buckets[key]++;
      }

      const total = docs.length;

      // Phân phối vendor match confidence (từ ap_invoices)
      const invoiceWhere: any = {
        branch_id: branchId,
        source: "ai_ocr",
        ocr_confidence: { [Op.ne]: null },
      };
      if (dateWhere) invoiceWhere.created_at = dateWhere;

      const invoices = await ApInvoice.findAll({
        where: invoiceWhere,
        attributes: ["ocr_confidence"],
        raw: true,
      });

      const invoiceBuckets: Record<string, number> = {
        "0-10": 0,
        "10-20": 0,
        "20-30": 0,
        "30-40": 0,
        "40-50": 0,
        "50-60": 0,
        "60-70": 0,
        "70-80": 0,
        "80-90": 0,
        "90-100": 0,
      };

      for (const inv of invoices as any[]) {
        const conf = parseFloat(inv.ocr_confidence) * 100;
        const bucket = Math.min(Math.floor(conf / 10) * 10, 90);
        const key = `${bucket}-${bucket + 10}`;
        if (invoiceBuckets[key] !== undefined) invoiceBuckets[key]++;
      }

      // Thống kê nhanh
      const highConfidence = (buckets["80-90"] ?? 0) + (buckets["90-100"] ?? 0);
      const mediumConfidence =
        (buckets["60-70"] ?? 0) + (buckets["70-80"] ?? 0);
      const lowConfidence = total - highConfidence - mediumConfidence;

      res.json({
        period: { date_from: date_from ?? null, date_to: date_to ?? null },
        ocr_document_confidence: {
          total_documents: total,
          histogram: Object.entries(buckets).map(([range, count]) => ({
            range: `${range}%`,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          })),
          summary: {
            high_confidence_pct:
              total > 0 ? Math.round((highConfidence / total) * 100) : 0,
            medium_confidence_pct:
              total > 0 ? Math.round((mediumConfidence / total) * 100) : 0,
            low_confidence_pct:
              total > 0 ? Math.round((lowConfidence / total) * 100) : 0,
          },
        },
        invoice_confidence: {
          total_invoices: invoices.length,
          histogram: Object.entries(invoiceBuckets).map(([range, count]) => ({
            range: `${range}%`,
            count,
            percentage:
              invoices.length > 0
                ? Math.round((count / invoices.length) * 100)
                : 0,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
};
