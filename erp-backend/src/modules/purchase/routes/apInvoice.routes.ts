import { Router } from "express";
import { apInvoiceController } from "../controllers/apInvoice.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const accountRoles = authMiddleware([Role.ACCOUNT, Role.CHACC]);
const readRoles = authMiddleware([Role.ACCOUNT, Role.CHACC, Role.PURCHASE, Role.PURCHASEMANAGER]);
const accountOnly = authMiddleware([Role.ACCOUNT]);
const chaccOnly = authMiddleware([Role.CHACC]);

// ─── READ ──────────────────────────────────────────────────────────────────
// GET /api/ap/invoices?status=draft&source=ai_ocr
router.get("/", readRoles, apInvoiceController.getAll);

// GET /api/ap/invoices/posted-summary?supplier_id=5
router.get(
  "/posted-summary",
  accountRoles,
  apInvoiceController.getPostedSummaryBySupplier,
);

// GET /api/ap/invoices/posted-suppliers
router.get(
  "/posted-suppliers",
  accountRoles,
  apInvoiceController.getPostedSuppliers,
);

// GET /api/ap/invoices/:id  — kèm matching_details + audit_trail
router.get("/:id", readRoles, apInvoiceController.getById);

// GET /api/ap/invoices/:id/audit-logs
router.get("/:id/audit-logs", accountRoles, apInvoiceController.getAuditLogs);

// GET /api/ap/invoices/:id/payments — lịch sử thanh toán
router.get(
  "/:id/payments",
  accountRoles,
  apInvoiceController.getPaymentHistory,
);

// ─── CREATE ────────────────────────────────────────────────────────────────
// POST /api/ap/invoices  — tạo thủ công (manual), không cần PO
router.post("/", accountOnly, apInvoiceController.createManual);

// POST /api/ap/invoices/from-po/:poId  — tạo từ PO (backward compatible, full remaining)
router.post("/from-po/:poId", accountOnly, apInvoiceController.createFromPO);

// POST /api/ap/invoices/from-po/:poId/partial  — tạo partial invoice với lines tùy chọn
router.post(
  "/from-po/:poId/partial",
  accountOnly,
  apInvoiceController.createPartialFromPO,
);

// ─── APPROVAL WORKFLOW ─────────────────────────────────────────────────────
// POST /api/ap/invoices/:id/submit
router.post("/:id/submit", accountOnly, apInvoiceController.submitForApproval);

// PUT /api/ap/invoices/:id/approve
router.put("/:id/approve", chaccOnly, apInvoiceController.approve);

// PUT /api/ap/invoices/:id/reject
router.put("/:id/reject", chaccOnly, apInvoiceController.reject);

// POST /api/ap/invoices/:id/override-mismatch
router.post("/:id/override-mismatch", chaccOnly, apInvoiceController.overrideMismatch);

// DELETE /api/ap/invoices/:id  — chỉ draft chưa submit
router.delete("/:id", accountOnly, apInvoiceController.deleteInvoice);

export default router;
