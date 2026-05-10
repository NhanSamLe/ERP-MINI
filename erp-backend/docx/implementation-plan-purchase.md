# Implementation Plan — Purchase Module Enhancement
> Dựa trên: purchase-workflow-analysis.md + purchase-sale-gap-analysis.md
> Migrations đã tạo: 20260801 → 20260805 (18 files)
> Ngày: 2026-05-10

---

## Mục lục
1. [Tổng quan Sprint](#1-tổng-quan-sprint)
2. [Sprint 1 — Enhance hiện có (Phase 1 migrations)](#2-sprint-1)
3. [Sprint 2 — RFQ Flow (Phase 2 migrations)](#3-sprint-2)
4. [Sprint 3 — Return Flow (Phase 3 migrations)](#4-sprint-3)
5. [Sprint 4 — Price List + Audit Log (Phase 4-5)](#5-sprint-4)
6. [Checklist Backend](#6-checklist-backend)
7. [Checklist Frontend](#7-checklist-frontend)

---

## 1. Tổng quan Sprint

| Sprint | Migrations | Backend | Frontend | Ưu tiên |
|---|---|---|---|---|
| Sprint 1 | 20260801000001~5 | Enhance service hiện có | Enhance UI hiện có | 🔴 Cao nhất |
| Sprint 2 | 20260802000001~3 | RFQ service + API mới | Trang RFQ mới | 🟠 Cao |
| Sprint 3 | 20260803000001~6 | Return service + API mới | Trang Return mới | 🟠 Cao |
| Sprint 4 | 20260804~5 | Price list + Audit log | Dashboard widgets | 🟡 Trung bình |

---

## 2. Sprint 1 — Enhance hiện có

### Migrations đã tạo
- `20260801000001-enhance-ap-invoices.js`
- `20260801000002-enhance-ap-payments.js`
- `20260801000003-enhance-purchase-orders.js`
- `20260801000004-enhance-purchase-order-lines.js`
- `20260801000005-enhance-allocations.js`

### Backend cần làm

#### 2.1 Model updates

**`ApInvoice` model** — thêm fields mới:
```typescript
// src/modules/purchase/models/apInvoice.model.ts
payment_term_id: number | null
paid_amount: number          // default 0
currency_id: number | null
exchange_rate: number        // default 1.0
last_payment_date: string | null

// Associations
belongsTo(PaymentTerm, { foreignKey: 'payment_term_id', as: 'paymentTerm' })
belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' })
```

**`ApPayment` model** — thêm fields mới:
```typescript
allocation_status: 'unallocated' | 'partially_allocated' | 'fully_allocated'
currency_id: number | null
exchange_rate: number
bank_account_id: number | null
transaction_reference: string | null

// Associations
belongsTo(BankAccount, { foreignKey: 'bank_account_id', as: 'bankAccount' })
belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' })
```

**`PurchaseOrder` model** — thêm fields mới:
```typescript
currency_id, exchange_rate, payment_term_id
discount_percent, discount_amount
receipt_status: 'pending' | 'partial' | 'fully_received'
invoice_status: 'not_invoiced' | 'partial' | 'invoiced'
supplier_ref_no, delivery_address, expected_delivery_date
buyer_id, internal_notes, supplier_notes

// Associations
belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' })
belongsTo(PaymentTerm, { foreignKey: 'payment_term_id', as: 'paymentTerm' })
belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' })
```

**`PurchaseOrderLine` model** — rename + thêm:
```typescript
// Rename: discount → discount_percent (update model field name)
discount_percent: number
discount_amount: number
description: string | null
qty_received: number    // default 0
qty_invoiced: number    // default 0
```

#### 2.2 Service updates

**`ApPaymentService`** — thêm logic allocation:
```
File: src/modules/purchase/services/apPayment.service.ts

Hàm createAllocation(paymentId, invoiceId, appliedAmount, userId):
  1. Tạo ap_payment_allocations record
  2. Cập nhật ap_invoices.paid_amount += appliedAmount
  3. Tính lại ap_invoices.status:
     - paid_amount >= total_after_tax → 'paid', last_payment_date = today
     - 0 < paid_amount < total_after_tax → 'partially_paid'
  4. Tính lại ap_payments.allocation_status:
     - Tổng applied_amount của payment này
     - >= payment.amount → 'fully_allocated', status = 'completed'
     - < payment.amount → 'partially_allocated'
  5. Ghi ap_payment_audit_logs

Hàm deleteAllocation(allocationId, userId):
  1. Lấy allocation record
  2. ap_invoices.paid_amount -= applied_amount
  3. Recalculate ap_invoices.status
  4. Recalculate ap_payments.allocation_status
  5. Ghi audit log
```

**`PurchaseOrderService`** — thêm logic tracking:
```
File: src/modules/purchase/services/purchaseOrder.service.ts

Hàm updateReceiptStatus(poId):
  1. Lấy tất cả purchase_order_lines của PO
  2. Tính: allReceived = tất cả lines qty_received >= quantity
           anyReceived = có ít nhất 1 line qty_received > 0
  3. Set receipt_status:
     - allReceived → 'fully_received'
     - anyReceived → 'partial'
     - else → 'pending'

Hàm updateInvoiceStatus(poId):
  1. Tương tự, dùng qty_invoiced
  2. Set invoice_status: 'invoiced' / 'partial' / 'not_invoiced'

Hàm onGrnConfirmed(stockMoveId):
  → Gọi khi stock move (GRN) được confirm
  → Cập nhật qty_received trên các PO lines liên quan
  → Gọi updateReceiptStatus(poId)

Hàm onApInvoiceLineLinked(poLineId, qty):
  → Gọi khi AP Invoice line được link với PO line
  → Cập nhật qty_invoiced trên PO line
  → Gọi updateInvoiceStatus(poId)
```

**`ApInvoiceService`** — thêm logic due_date:
```
Khi tạo AP Invoice với payment_term_id:
  due_date = invoice_date + payment_term.days
  (nếu user không nhập tay)
```

#### 2.3 API updates

**`GET /api/purchase/orders`** — thêm filter params:
```
?receipt_status=pending|partial|fully_received
?invoice_status=not_invoiced|partial|invoiced
?buyer_id=123
?overdue_delivery=true  (expected_delivery_date < today)
```

**`GET /api/purchase/ap-invoices`** — thêm filter params:
```
?due_soon=7          (due_date trong 7 ngày tới)
?overdue=true        (due_date < today AND status != paid)
?paid_status=partially_paid|paid|posted
```

**`GET /api/purchase/ap-payments`** — thêm filter params:
```
?allocation_status=unallocated|partially_allocated|fully_allocated
```

**`POST /api/purchase/ap-payments/:id/allocate`** — API mới:
```typescript
Body: { invoiceId: number, appliedAmount: number }
Response: { payment, invoice, allocation }
```

**`DELETE /api/purchase/ap-payments/allocations/:id`** — API mới

### Frontend cần làm

#### Purchase Order Detail page
- [ ] Thêm section **"Thông tin mua hàng"**: Buyer, Expected Delivery, Payment Term, Currency, Exchange Rate, Supplier Ref No
- [ ] Thêm section **"Tracking"**: 2 progress bars (receipt_status, invoice_status)
- [ ] Thêm cột vào bảng lines: `Đã nhận`, `Còn thiếu`, `Đã lập HĐ`
- [ ] Thêm tab **"Ghi chú"**: internal_notes + supplier_notes
- [ ] Thêm button **"Tạo Return"** (hiện khi receipt_status != pending)

#### Purchase Order List page
- [ ] Thêm filter: Receipt Status, Invoice Status, Buyer, Overdue Delivery
- [ ] Thêm cột: `Nhận hàng`, `Hóa đơn`, `Giao dự kiến`
- [ ] Badge màu cho receipt_status và invoice_status

#### AP Invoice Detail page
- [ ] Thêm **Payment Tracking panel**: Tổng / Đã trả / Còn nợ + progress bar
- [ ] Thêm **Lịch sử thanh toán**: danh sách allocations
- [ ] Thêm fields: Payment Term, Currency, Exchange Rate
- [ ] Badge cảnh báo đến hạn (đỏ nếu due_date < today+7)
- [ ] Button **"Tạo thanh toán"** → mở modal tạo AP Payment

#### AP Invoice List page
- [ ] Thêm cột: `Đến hạn`, `Đã trả`, `Còn nợ`
- [ ] Filter: `due_soon`, `overdue`, `paid_status`
- [ ] Row highlight màu đỏ nếu overdue

#### AP Payment Detail page
- [ ] Thêm fields: Bank Account, Transaction Reference, Currency, Exchange Rate
- [ ] Thêm **Allocation panel**: danh sách invoices đã phân bổ
- [ ] Badge `allocation_status`
- [ ] Button **"Phân bổ"** → mở modal chọn invoices

#### AP Payment List page
- [ ] Thêm cột: `Tài khoản NH`, `Allocation Status`
- [ ] Filter: `allocation_status`
- [ ] Badge màu: unallocated=đỏ, partially=vàng, fully=xanh

---

### 3.3 Trang mới — RFQ

#### RFQ List page (`/purchase/rfqs`)
**Components cần tạo:**
- [ ] `RfqListPage` — table với columns: RFQ No, NCC, Ngày, Hết hạn, Tổng, Status
- [ ] Filter bar: status, supplier_id, date range, buyer_id
- [ ] Button **"+ Tạo RFQ"**
- [ ] Button **"So sánh báo giá"** (active khi chọn ≥2 rows có cùng products)
- [ ] Badge hết hạn: highlight đỏ nếu `valid_until < today`

#### RFQ Detail page (`/purchase/rfqs/:id`)
**Components cần tạo:**
- [ ] `RfqDetailPage` — header info + line items table
- [ ] Header fields: RFQ No, NCC, Ngày, Hết hạn, Version, Buyer, Tiền tệ, Điều khoản TT
- [ ] Line table: Sản phẩm, Mô tả, SL, ĐVT, Đơn giá, CK%, CK tiền, Thuế, Thành tiền, Lead time
- [ ] Footer: Tổng trước thuế, Thuế, Tổng sau thuế
- [ ] Notes tabs: Ghi chú nội bộ / Ghi chú cho NCC
- [ ] Action buttons theo status:
  - `draft` → **[Gửi RFQ]** **[Xóa]**
  - `sent` → **[Cập nhật giá NCC]** **[Đánh dấu Received]**
  - `received` → **[Tạo PO từ RFQ]** **[Từ chối]** **[Tạo version mới]**
  - `accepted` → readonly, link đến PO
- [ ] Version history panel (nếu có parent_id)
- [ ] Approval workflow panel (nếu cần duyệt)

#### RFQ Compare page (`/purchase/rfqs/compare?ids=1,2,3`)
**Components cần tạo:**
- [ ] `RfqComparePage` — bảng so sánh ngang
- [ ] Mỗi cột = 1 NCC/RFQ
- [ ] Mỗi hàng = 1 sản phẩm
- [ ] Highlight ô giá thấp nhất (🏆 màu xanh)
- [ ] Hàng tổng hợp: Lead time, Tổng tiền, Điều khoản TT
- [ ] Button **"Chọn NCC X → Tạo PO"** ở cuối mỗi cột

---

### 3.4 Trang mới — Purchase Return flow

#### PRA List page (`/purchase/return-authorizations`)
- [ ] `PraListPage` — table: PRA No, NCC, PO gốc, Giá trị, Hình thức, Status
- [ ] Filter: status, supplier_id, return_type, date range
- [ ] Button **"+ Tạo PRA"**

#### PRA Detail page (`/purchase/return-authorizations/:id`)
- [ ] `PraDetailPage` — header + lines + timeline
- [ ] Header: PRA No, NCC, PO gốc, AP Invoice gốc, Lý do, Hình thức xử lý
- [ ] Timeline component: PRA → Return → Debit Note → Vendor Refund (với trạng thái từng bước)
- [ ] Line table: Sản phẩm, SL trả, Tình trạng, Đơn giá, Thành tiền
- [ ] Action buttons:
  - `draft` → **[Submit]** **[Xóa]**
  - `submitted` → **[Duyệt]** **[Từ chối]** (role: manager)
  - `approved` → **[Tạo Purchase Return]**
  - `completed` → readonly

#### Purchase Return List page (`/purchase/returns`)
- [ ] Table: Return No, NCC, PRA, Ngày trả, Kho, Tổng, Status
- [ ] Filter: status, supplier_id, date range

#### Purchase Return Detail page (`/purchase/returns/:id`)
- [ ] Header: Return No, NCC, PRA gốc, Ngày trả, Kho
- [ ] Line table: Sản phẩm, SL trả, SL NCC xác nhận, SL NCC từ chối, Tình trạng, Đơn giá
- [ ] Link đến Stock Move (xuất kho)
- [ ] Action buttons:
  - `draft` → **[Submit]** **[Xóa]**
  - `approved` → **[Đánh dấu Shipped]**
  - `shipped` → **[NCC xác nhận nhận]** (nhập qty_confirmed từng line)
  - `confirmed` → **[Tạo Debit Note]** **[Complete]**

#### AP Debit Note List page (`/purchase/debit-notes`)
- [ ] Table: DN No, NCC, HĐ gốc, Tổng, Ngày, Status
- [ ] Filter: status, supplier_id, date range

#### AP Debit Note Detail page (`/purchase/debit-notes/:id`)
- [ ] Header: DN No, NCC, Purchase Return gốc, AP Invoice gốc, Ngày, Tiền tệ
- [ ] Line table: Sản phẩm, Mô tả, SL, Đơn giá, Thuế, Thành tiền
- [ ] Footer: Tổng trước thuế, Thuế, Tổng sau thuế
- [ ] GL Entry panel (sau khi posted)
- [ ] Action buttons:
  - `draft` → **[Submit]** **[Post]**
  - `posted` → **[Tạo Vendor Refund]** (nếu return_type=refund)

#### Vendor Refund List page (`/purchase/vendor-refunds`)
- [ ] Table: Refund No, NCC, Debit Note, Số tiền, Ngày, Tài khoản NH, Status

#### Vendor Refund Detail page (`/purchase/vendor-refunds/:id`)
- [ ] Header: Refund No, NCC, Debit Note gốc, Ngày, Số tiền, Phương thức, Tài khoản NH, Số GD
- [ ] GL Entry panel
- [ ] Action buttons: **[Post]** → tạo GL Entry

---

### 3.5 Dashboard Purchase — widgets mới
- [ ] Widget: **RFQ chờ xử lý** (status=sent/received, valid_until > today)
- [ ] Widget: **PO chờ nhận hàng** (receipt_status=pending/partial, status=confirmed)
- [ ] Widget: **PO quá hạn giao hàng** (expected_delivery_date < today, receipt_status != fully_received)
- [ ] Widget: **AP Invoice sắp đến hạn** (due_date trong 7 ngày, status != paid)
- [ ] Widget: **AP Payment chưa phân bổ** (allocation_status=unallocated)
- [ ] Widget: **Return đang xử lý** (PRA/Return status != completed/cancelled)
- [ ] Chart: Chi phí mua hàng theo tháng (bar)
- [ ] Chart: Top 5 NCC theo giá trị (pie/donut)
- [ ] Table: PO quá hạn giao hàng (cần follow up)
- [ ] Table: AP Invoice đến hạn trong 7 ngày

---

## 4. Shared Components cần tạo/cập nhật

| Component | Dùng ở đâu | Mô tả |
|---|---|---|
| `ApprovalWorkflowPanel` | PRA, RFQ, Return, Debit Note | Hiển thị approval status + actions |
| `TimelineTracker` | PRA Detail | Hiển thị tiến trình 4 bước |
| `PaymentProgressBar` | AP Invoice Detail | Progress bar paid_amount / total |
| `AllocationStatusBadge` | AP Payment List/Detail | Badge màu theo allocation_status |
| `DueDateBadge` | AP Invoice List/Detail | Badge cảnh báo đến hạn |
| `ReceiptStatusBadge` | PO List/Detail | Badge receipt_status |
| `InvoiceStatusBadge` | PO List/Detail | Badge invoice_status |
| `CurrencyExchangeInput` | PO, RFQ, AP Invoice, AP Payment | Input tiền tệ + tỷ giá |
| `SupplierSelect` | PO, RFQ, PRA, AP Payment | Dropdown chọn NCC (type=supplier) |
| `BankAccountSelect` | AP Payment, Vendor Refund | Dropdown chọn tài khoản ngân hàng |
| `RfqCompareTable` | RFQ Compare page | Bảng so sánh nhiều NCC |
| `LineItemsTable` | RFQ, PO, Debit Note | Table dòng hàng có edit inline |

---

## 5. API Endpoints cần tạo

### RFQ
```
GET    /api/purchase/rfqs                    — list (filter: status, supplier, date, buyer)
POST   /api/purchase/rfqs                    — create
GET    /api/purchase/rfqs/:id                — detail
PUT    /api/purchase/rfqs/:id                — update (chỉ khi draft/received)
DELETE /api/purchase/rfqs/:id                — delete (chỉ khi draft)
POST   /api/purchase/rfqs/:id/send           — gửi RFQ cho NCC (draft → sent)
POST   /api/purchase/rfqs/:id/mark-received  — đánh dấu nhận báo giá (sent → received)
POST   /api/purchase/rfqs/:id/accept         — chấp nhận (received → accepted)
POST   /api/purchase/rfqs/:id/reject         — từ chối (→ rejected)
POST   /api/purchase/rfqs/:id/convert-to-po  — tạo PO từ RFQ
POST   /api/purchase/rfqs/:id/new-version    — tạo version mới
GET    /api/purchase/rfqs/compare            — so sánh nhiều RFQ (?ids=1,2,3)
```

### Purchase Return Authorization (PRA)
```
GET    /api/purchase/return-authorizations
POST   /api/purchase/return-authorizations
GET    /api/purchase/return-authorizations/:id
PUT    /api/purchase/return-authorizations/:id
POST   /api/purchase/return-authorizations/:id/submit
POST   /api/purchase/return-authorizations/:id/approve
POST   /api/purchase/return-authorizations/:id/reject
```

### Purchase Return
```
GET    /api/purchase/returns
POST   /api/purchase/returns
GET    /api/purchase/returns/:id
PUT    /api/purchase/returns/:id
POST   /api/purchase/returns/:id/submit
POST   /api/purchase/returns/:id/approve
POST   /api/purchase/returns/:id/ship          — đánh dấu đã gửi hàng
POST   /api/purchase/returns/:id/confirm       — NCC xác nhận nhận hàng (kèm qty_confirmed)
POST   /api/purchase/returns/:id/complete
```

### AP Debit Note
```
GET    /api/purchase/debit-notes
POST   /api/purchase/debit-notes
GET    /api/purchase/debit-notes/:id
PUT    /api/purchase/debit-notes/:id
POST   /api/purchase/debit-notes/:id/submit
POST   /api/purchase/debit-notes/:id/approve
POST   /api/purchase/debit-notes/:id/post      — post → tạo GL Entry
POST   /api/purchase/debit-notes/:id/cancel
```

### Vendor Refund
```
GET    /api/purchase/vendor-refunds
POST   /api/purchase/vendor-refunds
GET    /api/purchase/vendor-refunds/:id
POST   /api/purchase/vendor-refunds/:id/submit
POST   /api/purchase/vendor-refunds/:id/approve
POST   /api/purchase/vendor-refunds/:id/post   — post → tạo GL Entry
```

### Bổ sung vào endpoints hiện có
```
PUT  /api/purchase/orders/:id          — thêm fields mới (buyer_id, currency_id, ...)
GET  /api/purchase/orders/:id/timeline — lịch sử thay đổi từ po_audit_logs
POST /api/purchase/orders/:id/rfq      — tạo RFQ từ PO (reverse flow)

PUT  /api/ap/invoices/:id              — thêm fields mới (payment_term_id, currency_id, ...)
GET  /api/ap/invoices/:id/payments     — danh sách payments đã phân bổ vào invoice này

PUT  /api/ap/payments/:id              — thêm fields mới (bank_account_id, ...)
POST /api/ap/payments/:id/allocate     — phân bổ payment vào invoices (batch)
```

---

## 6. Service Logic cần implement

### ApInvoiceService — cập nhật
```typescript
// Sau khi tạo/xóa AP Payment Allocation:
async recalculatePaidAmount(apInvoiceId: number): Promise<void>
  // 1. SUM(applied_amount) từ ap_payment_allocations WHERE ap_invoice_id = X
  // 2. Cập nhật ap_invoices.paid_amount
  // 3. Cập nhật status: partially_paid / paid
  // 4. Cập nhật last_payment_date nếu paid

// Tự tính due_date từ payment_term:
async calculateDueDate(invoiceDate: Date, paymentTermId: number): Promise<Date>
```

### ApPaymentService — cập nhật
```typescript
// Sau khi tạo/xóa Allocation:
async recalculateAllocationStatus(paymentId: number): Promise<void>
  // 1. SUM(applied_amount) từ ap_payment_allocations WHERE payment_id = X
  // 2. So sánh với ap_payments.amount
  // 3. Cập nhật allocation_status: unallocated / partially_allocated / fully_allocated
  // 4. Nếu fully_allocated: status = 'completed'
```

### PurchaseOrderService — cập nhật
```typescript
// Gọi sau khi GRN confirm:
async updateReceiptStatus(poId: number): Promise<void>
  // 1. Lấy tất cả PO lines
  // 2. Tính tổng qty_received vs quantity
  // 3. Cập nhật receipt_status: pending / partial / fully_received

// Gọi sau khi AP Invoice line liên kết với PO line:
async updateInvoiceStatus(poId: number): Promise<void>
  // 1. Lấy tất cả PO lines
  // 2. Tính tổng qty_invoiced vs quantity
  // 3. Cập nhật invoice_status: not_invoiced / partial / invoiced
```

### RfqService — tạo mới
```typescript
async createFromScratch(dto): Promise<PurchaseRfq>
async convertToPo(rfqId: number, userId: number): Promise<PurchaseOrder>
  // Copy: supplier_id, currency_id, payment_term_id, lines (product, qty, price, discount, tax)
  // Set: rfq_id = rfqId, status = 'draft'
async createNewVersion(rfqId: number): Promise<PurchaseRfq>
  // Copy toàn bộ RFQ, version+1, parent_id = rfqId
async compareRfqs(rfqIds: number[]): Promise<RfqCompareResult>
  // Group lines theo product_id, so sánh giá giữa các RFQ
```

### PurchaseReturnService — tạo mới
```typescript
async createFromPra(praId: number, dto): Promise<PurchaseReturn>
async confirmReturn(returnId: number, lines: ConfirmLineDto[]): Promise<void>
  // 1. Cập nhật qty_confirmed, qty_rejected từng line
  // 2. Tạo stock move (type=return_to_supplier)
  // 3. Cập nhật status = 'confirmed'
```

### ApDebitNoteService — tạo mới
```typescript
async createFromReturn(returnId: number, userId: number): Promise<ApDebitNote>
  // Copy lines từ purchase_return_lines (qty_confirmed, unit_price)
  // Link original_ap_invoice_id từ PRA
async postDebitNote(debitNoteId: number): Promise<void>
  // 1. Tạo GL Entry: Nợ AP / Có Hàng trả NCC
  // 2. Cập nhật ap_invoices.paid_amount += debit_note.total_after_tax
  // 3. Recalculate ap_invoice status
  // 4. status = 'posted'
```

### VendorRefundService — tạo mới
```typescript
async postRefund(refundId: number): Promise<void>
  // 1. Tạo GL Entry: Nợ NH/Tiền mặt / Có AP
  // 2. Tăng số dư bank_account
  // 3. status = 'posted'
```

---

## 7. Notification triggers cần thêm

| Event | Message | Recipient |
|---|---|---|
| RFQ `valid_until` còn 3 ngày | "RFQ {rfq_no} sắp hết hạn vào {date}" | buyer_id |
| PO `expected_delivery_date` quá hạn | "PO {po_no} quá hạn giao hàng {N} ngày" | buyer_id + manager |
| AP Invoice `due_date` còn 7 ngày | "Hóa đơn {invoice_no} đến hạn TT {date}" | kế toán (branch) |
| AP Payment `unallocated` sau 24h | "Payment {payment_no} chưa được phân bổ" | kế toán (branch) |
| PRA `approved` | "PRA {pra_no} đã duyệt, tạo Purchase Return" | created_by |
| Purchase Return `confirmed` | "Return {return_no} NCC xác nhận, tạo Debit Note" | kế toán (branch) |
| AP Debit Note `posted` | "Debit Note {dn_no} đã post, công nợ đã giảm" | kế toán + buyer |

Implement trong `NotificationService.sendPurchaseAlert()` — gọi từ các service tương ứng.

---

## 8. Thứ tự thực hiện (Sprint plan)

### Sprint 1 — DB + Core logic (1-2 tuần)
```
✅ Chạy migrations Phase 1 (20260801xxxxxx)
□ Cập nhật Sequelize models: ApInvoice, ApPayment, PurchaseOrder, PurchaseOrderLine
□ ApInvoiceService.recalculatePaidAmount()
□ ApPaymentService.recalculateAllocationStatus()
□ PurchaseOrderService.updateReceiptStatus() + updateInvoiceStatus()
□ Unit tests cho 3 service trên
```

### Sprint 2 — RFQ (1 tuần)
```
✅ Chạy migrations Phase 2 (20260802xxxxxx)
□ Tạo Sequelize models: PurchaseRfq, PurchaseRfqLine
□ RfqService (CRUD + convert + compare + versioning)
□ API routes: /api/purchase/rfqs/*
□ Frontend: RFQ List, RFQ Detail, RFQ Compare pages
□ Cập nhật PO Detail: thêm "Tạo từ RFQ" button + rfq_id display
```

### Sprint 3 — Purchase Return flow (1.5 tuần)
```
✅ Chạy migrations Phase 3 (20260803xxxxxx)
□ Tạo models: PurchaseReturnAuthorization, PurchaseReturn, PurchaseReturnLine
□              ApDebitNote, ApDebitNoteLine, VendorRefund
□ Services: PurchaseReturnService, ApDebitNoteService, VendorRefundService
□ API routes: /api/purchase/return-authorizations/*, /api/purchase/returns/*
□             /api/purchase/debit-notes/*, /api/purchase/vendor-refunds/*
□ Frontend: PRA, Return, Debit Note, Vendor Refund pages
□ Cập nhật PO Detail: thêm "Tạo Return" button
□ Cập nhật AP Invoice Detail: thêm "Tạo Debit Note" button
```

### Sprint 4 — UI polish + Dashboard (0.5 tuần)
```
✅ Chạy migrations Phase 4+5 (20260804, 20260805)
□ Dashboard Purchase: 6 widgets + 2 charts + 2 tables
□ Notifications cho tất cả triggers
□ Shared components: TimelineTracker, RfqCompareTable, PaymentProgressBar
□ Cập nhật AP Invoice/Payment List: thêm cột mới
□ Cập nhật PO Detail: tracking panel (receipt/invoice status progress bar)
```

---

## 9. Files cần tạo/sửa — tổng hợp

### Backend — Models mới
```
src/modules/purchase/models/purchaseRfq.model.ts
src/modules/purchase/models/purchaseRfqLine.model.ts
src/modules/purchase/models/purchaseReturnAuthorization.model.ts
src/modules/purchase/models/purchaseReturn.model.ts
src/modules/purchase/models/purchaseReturnLine.model.ts
src/modules/purchase/models/apDebitNote.model.ts
src/modules/purchase/models/apDebitNoteLine.model.ts
src/modules/purchase/models/vendorRefund.model.ts
```

### Backend — Services mới
```
src/modules/purchase/services/rfq.service.ts
src/modules/purchase/services/purchaseReturn.service.ts
src/modules/purchase/services/apDebitNote.service.ts
src/modules/purchase/services/vendorRefund.service.ts
```

### Backend — Services cập nhật
```
src/modules/purchase/services/apInvoice.service.ts    — thêm recalculatePaidAmount
src/modules/purchase/services/apPayment.service.ts    — thêm recalculateAllocationStatus
src/modules/purchase/services/purchaseOrder.service.ts — thêm updateReceiptStatus, updateInvoiceStatus
```

### Backend — Controllers + Routes mới
```
src/modules/purchase/controllers/rfq.controller.ts
src/modules/purchase/controllers/purchaseReturn.controller.ts
src/modules/purchase/controllers/apDebitNote.controller.ts
src/modules/purchase/controllers/vendorRefund.controller.ts
src/modules/purchase/routes/rfq.routes.ts
src/modules/purchase/routes/purchaseReturn.routes.ts
src/modules/purchase/routes/apDebitNote.routes.ts
src/modules/purchase/routes/vendorRefund.routes.ts
```

### Frontend — Pages mới
```
pages/purchase/rfqs/index.tsx          — RFQ List
pages/purchase/rfqs/[id].tsx           — RFQ Detail
pages/purchase/rfqs/compare.tsx        — RFQ Compare
pages/purchase/returns/pra/index.tsx   — PRA List
pages/purchase/returns/pra/[id].tsx    — PRA Detail
pages/purchase/returns/index.tsx       — Return List
pages/purchase/returns/[id].tsx        — Return Detail
pages/purchase/debit-notes/index.tsx   — Debit Note List
pages/purchase/debit-notes/[id].tsx    — Debit Note Detail
pages/purchase/vendor-refunds/index.tsx
pages/purchase/vendor-refunds/[id].tsx
```

### Frontend — Components mới
```
components/purchase/RfqCompareTable.tsx
components/purchase/TimelineTracker.tsx
components/purchase/PaymentProgressBar.tsx
components/purchase/AllocationStatusBadge.tsx
components/purchase/DueDateBadge.tsx
components/purchase/ReceiptStatusBadge.tsx
components/purchase/InvoiceStatusBadge.tsx
components/purchase/CurrencyExchangeInput.tsx
components/purchase/BankAccountSelect.tsx
```

### Frontend — Pages cập nhật
```
pages/purchase/orders/[id].tsx         — thêm tracking panel, new fields, buttons
pages/purchase/ap-invoices/index.tsx   — thêm cột Đến hạn, Đã trả, Còn nợ
pages/purchase/ap-invoices/[id].tsx    — thêm payment panel, due date badge
pages/purchase/ap-payments/index.tsx   — thêm cột Tài khoản NH, Allocation Status
pages/purchase/ap-payments/[id].tsx    — thêm allocation panel, new fields
pages/purchase/ap-payments/create.tsx  — thêm bank account, transaction ref, allocation section
pages/purchase/dashboard.tsx           — thêm 6 widgets + 2 charts
```

---
*Xem thêm: purchase-sale-gap-analysis.md (schema chi tiết), purchase-workflow-analysis.md (workflow)*
