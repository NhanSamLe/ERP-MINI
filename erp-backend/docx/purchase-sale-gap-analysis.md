# Purchase vs Sale — Gap Analysis & Improvement Plan
> Ngày phân tích: 2026-05-10
> Mục tiêu: Làm cho module Purchase đối xứng, nhất quán với module Sale về schema DB, luồng nghiệp vụ, và tính năng.

---

## Mục lục

1. [Tổng quan luồng hiện tại](#1-tổng-quan-luồng-hiện-tại)
2. [Gap 1 — Thiếu luồng RFQ (Request for Quotation)](#2-gap-1--thiếu-luồng-rfq)
3. [Gap 2 — Thiếu Purchase Return / Debit Note / Vendor Refund](#3-gap-2--thiếu-purchase-return--debit-note--vendor-refund)
4. [Gap 3 — ap_invoices thiếu fields so với ar_invoices](#4-gap-3--ap_invoices-thiếu-fields)
5. [Gap 4 — ap_payments thiếu fields so với ar_receipts](#5-gap-4--ap_payments-thiếu-fields)
6. [Gap 5 — purchase_orders thiếu fields so với sale_orders](#6-gap-5--purchase_orders-thiếu-fields)
7. [Gap 6 — purchase_order_lines thiếu fields so với sale_order_lines](#7-gap-6--purchase_order_lines-thiếu-fields)
8. [Gap 7 — ap_payment_allocations thiếu allocation_status](#8-gap-7--ap_payment_allocations-thiếu-allocation_status)
9. [Gap 8 — Thiếu Price List cho Purchase](#9-gap-8--thiếu-price-list-cho-purchase)
10. [Gap 9 — Audit log không đồng đều](#10-gap-9--audit-log-không-đồng-đều)
11. [Kế hoạch migration chi tiết](#11-kế-hoạch-migration-chi-tiết)
12. [Checklist tổng hợp](#12-checklist-tổng-hợp)

---

## 1. Tổng quan luồng hiện tại

### Sale (AR) — Luồng đầy đủ
`
CRM Lead → CRM Opportunity
  → Quotation (quotations + quotation_lines)
    → Sale Order (sale_orders + sale_order_lines)
      → AR Invoice (ar_invoices + ar_invoice_lines)
        → AR Receipt (ar_receipts + ar_receipt_allocations)

Khi có hàng trả lại:
  Sale Order → Sales Return Authorization (RMA)
    → Sales Return (sales_returns + sales_return_lines)
      → AR Credit Note (ar_credit_notes + ar_credit_note_lines)
        → AR Refund (ar_refunds)
`

### Purchase (AP) — Luồng hiện tại (thiếu nhiều)
`
Purchase Order (purchase_orders + purchase_order_lines)
  → AP Invoice (ap_invoices + ap_invoice_lines)  [có OCR từ invoice_documents]
    → AP Payment (ap_payments + ap_payment_allocations)

Khi có hàng trả lại: ❌ KHÔNG CÓ GÌ
`

### So sánh nhanh
| Bước | Sale | Purchase | Trạng thái |
|---|---|---|---|
| Pre-order document | Quotation | RFQ | ❌ Purchase thiếu |
| Order | Sale Order | Purchase Order | ✅ Có nhưng thiếu fields |
| Invoice | AR Invoice | AP Invoice | ⚠️ AP thiếu fields |
| Payment/Receipt | AR Receipt | AP Payment | ⚠️ AP thiếu fields |
| Return authorization | RMA | — | ❌ Purchase thiếu |
| Physical return | Sales Return | Purchase Return | ❌ Purchase thiếu |
| Credit/Debit note | AR Credit Note | AP Debit Note | ❌ Purchase thiếu |
| Cash back | AR Refund | Vendor Refund | ❌ Purchase thiếu |
| Price list | Price List (sales) | Price List (purchase) | ⚠️ Chung bảng nhưng chưa dùng |
| Audit log | ❌ Thiếu | ✅ Đầy đủ | Sale cần bổ sung |

---

## 2. Gap 1 — Thiếu luồng RFQ

### Vấn đề
Sale có quotations là bước pre-order: gửi báo giá cho khách, track version, có alid_until, sent_at, link với CRM opportunity.
Purchase **không có** bảng tương đương để ghi nhận báo giá từ nhà cung cấp (RFQ — Request for Quotation).

### Tác động nghiệp vụ
- Không track được lịch sử báo giá từ nhiều nhà cung cấp cho cùng 1 nhu cầu mua hàng
- Không so sánh được giá giữa các nhà cung cấp trước khi tạo PO
- Không có luồng: Yêu cầu mua hàng → Gửi RFQ → Nhận báo giá → Chọn NCC → Tạo PO

### Sale schema tham chiếu: quotations
`
quotations:
  id, branch_id, quotation_no (unique)
  customer_id → partners
  opportunity_id → crm_opportunities (nullable)
  currency_id, exchange_rate
  payment_term_id → payment_terms
  quotation_date, valid_until
  status: draft | sent | accepted | rejected | expired | cancelled
  approval_status: draft | waiting_approval | approved | rejected
  version (INT, default 1)
  parent_id (self-ref, để versioning)
  total_before_tax, total_tax, total_after_tax
  discount_percent, discount_amount
  customer_notes, internal_notes
  sales_person_id → users
  created_by, approved_by → users
  submitted_at, approved_at, reject_reason, sent_at
  created_at, updated_at

quotation_lines:
  id, quotation_id → quotations (CASCADE)
  product_id → products
  description (TEXT)
  quantity DECIMAL(18,3)
  unit_price DECIMAL(18,2)
  discount_percent, discount_amount
  tax_rate_id → tax_rates
  line_total, line_tax, line_total_after_tax
  created_at, updated_at
`

### Purchase cần tạo: purchase_rfqs + purchase_rfq_lines
`sql
-- Bảng mới: purchase_rfqs
CREATE TABLE purchase_rfqs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id       BIGINT NOT NULL,                    -- FK branches
  rfq_no          VARCHAR(50) NOT NULL UNIQUE,
  supplier_id     BIGINT,                             -- FK partners (NCC được hỏi giá)
  purchase_request_id BIGINT,                         -- FK purchase_requests (nếu có PR flow)
  currency_id     BIGINT,                             -- FK currencies
  exchange_rate   DECIMAL(18,6) DEFAULT 1.000000,
  payment_term_id BIGINT,                             -- FK payment_terms
  rfq_date        DATE NOT NULL,
  valid_until     DATE,                               -- Hạn hiệu lực báo giá
  status          ENUM('draft','sent','received','accepted','rejected','expired','cancelled') DEFAULT 'draft',
  approval_status ENUM('draft','waiting_approval','approved','rejected') DEFAULT 'draft',
  version         INT DEFAULT 1,
  parent_id       BIGINT,                             -- Self-ref để versioning
  total_before_tax DECIMAL(18,2) DEFAULT 0,
  total_tax        DECIMAL(18,2) DEFAULT 0,
  total_after_tax  DECIMAL(18,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount  DECIMAL(18,2) DEFAULT 0,
  supplier_notes   TEXT,
  internal_notes   TEXT,
  buyer_id         BIGINT,                            -- FK users (người phụ trách mua)
  created_by       BIGINT NOT NULL,
  approved_by      BIGINT,
  submitted_at     DATETIME,
  approved_at      DATETIME,
  reject_reason    TEXT,
  sent_at          DATETIME,                          -- Khi nào gửi RFQ cho NCC
  received_at      DATETIME,                          -- Khi nào nhận báo giá từ NCC
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng mới: purchase_rfq_lines
CREATE TABLE purchase_rfq_lines (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  rfq_id          BIGINT NOT NULL,                    -- FK purchase_rfqs (CASCADE)
  product_id      BIGINT NOT NULL,                    -- FK products
  description     TEXT,
  quantity        DECIMAL(18,3) NOT NULL,
  uom_id          BIGINT,                             -- FK uoms
  unit_price      DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount  DECIMAL(18,2) DEFAULT 0,
  tax_rate_id     BIGINT,                             -- FK tax_rates
  line_total      DECIMAL(18,2) DEFAULT 0,
  line_tax        DECIMAL(18,2) DEFAULT 0,
  line_total_after_tax DECIMAL(18,2) DEFAULT 0,
  lead_time_days  INT,                                -- NCC cam kết giao trong bao nhiêu ngày
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

### Liên kết với PO
Khi RFQ được chấp nhận → tạo PO từ RFQ:
- purchase_orders cần thêm cột fq_id BIGINT → FK purchase_rfqs

---

## 3. Gap 2 — Thiếu Purchase Return / Debit Note / Vendor Refund

### Vấn đề
Đây là gap lớn nhất. Sale có chuỗi return hoàn chỉnh 4 bước. Purchase không có bất kỳ bảng nào cho luồng trả hàng nhà cung cấp.

### Sale schema tham chiếu (4 bảng)
`
sales_return_authorizations (RMA)
  → sales_returns + sales_return_lines
    → ar_credit_notes + ar_credit_note_lines
      → ar_refunds
`

### Purchase cần tạo (4 bảng tương đương)

#### Bảng 1: purchase_return_authorizations (PRA — tương đương RMA)
`sql
CREATE TABLE purchase_return_authorizations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id       BIGINT NOT NULL,
  pra_no          VARCHAR(50) NOT NULL UNIQUE,
  purchase_order_id BIGINT NOT NULL,                  -- FK purchase_orders
  ap_invoice_id   BIGINT,                             -- FK ap_invoices (nullable)
  supplier_id     BIGINT NOT NULL,                    -- FK partners
  reason          TEXT NOT NULL,
  return_type     ENUM('refund','replacement','debit_note') DEFAULT 'debit_note',
  status          ENUM('draft','submitted','approved','rejected','processing','completed','cancelled') DEFAULT 'draft',
  approval_status ENUM('draft','waiting_approval','approved','rejected') DEFAULT 'draft',
  total_return_amount DECIMAL(18,2) DEFAULT 0,
  created_by      BIGINT,
  approved_by     BIGINT,
  submitted_at    DATETIME,
  approved_at     DATETIME,
  reject_reason   TEXT,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

#### Bảng 2: purchase_returns (tương đương sales_returns)
`sql
CREATE TABLE purchase_returns (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id       BIGINT NOT NULL,
  return_no       VARCHAR(50) NOT NULL UNIQUE,
  pra_id          BIGINT,                             -- FK purchase_return_authorizations
  purchase_order_id BIGINT,                           -- FK purchase_orders
  supplier_id     BIGINT NOT NULL,
  return_date     DATE NOT NULL,
  warehouse_id    BIGINT,                             -- FK warehouses (xuất kho trả NCC)
  status          ENUM('draft','shipped','confirmed','completed','cancelled') DEFAULT 'draft',
  approval_status ENUM('draft','waiting_approval','approved','rejected') DEFAULT 'draft',
  total_return_amount DECIMAL(18,2) DEFAULT 0,
  created_by      BIGINT,
  approved_by     BIGINT,
  submitted_at    DATETIME,
  approved_at     DATETIME,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

#### Bảng 3: purchase_return_lines (tương đương sales_return_lines)
`sql
CREATE TABLE purchase_return_lines (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  return_id           BIGINT NOT NULL,                -- FK purchase_returns (CASCADE)
  product_id          BIGINT NOT NULL,
  quantity_returned   DECIMAL(18,3) NOT NULL,
  quantity_confirmed  DECIMAL(18,3) DEFAULT 0,        -- NCC xác nhận nhận lại
  quantity_rejected   DECIMAL(18,3) DEFAULT 0,        -- NCC từ chối nhận
  unit_price          DECIMAL(18,2) NOT NULL,
  line_total          DECIMAL(18,2) DEFAULT 0,
  reason              TEXT,
  condition           ENUM('good','damaged','defective') DEFAULT 'good',
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

#### Bảng 4: p_debit_notes + p_debit_note_lines (tương đương ar_credit_notes)
`sql
-- Debit Note: chứng từ ghi giảm công nợ phải trả NCC
CREATE TABLE ap_debit_notes (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id       BIGINT NOT NULL,
  debit_note_no   VARCHAR(50) NOT NULL UNIQUE,
  purchase_return_id BIGINT,                          -- FK purchase_returns
  original_ap_invoice_id BIGINT,                      -- FK ap_invoices (hóa đơn gốc)
  supplier_id     BIGINT NOT NULL,
  debit_note_date DATE NOT NULL,
  status          ENUM('draft','posted','applied','cancelled') DEFAULT 'draft',
  approval_status ENUM('draft','waiting_approval','approved','rejected') DEFAULT 'draft',
  total_before_tax DECIMAL(18,2) DEFAULT 0,
  total_tax        DECIMAL(18,2) DEFAULT 0,
  total_after_tax  DECIMAL(18,2) DEFAULT 0,
  currency_id     BIGINT,
  exchange_rate   DECIMAL(18,6) DEFAULT 1.000000,
  created_by      BIGINT,
  approved_by     BIGINT,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ap_debit_note_lines (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  debit_note_id   BIGINT NOT NULL,                    -- FK ap_debit_notes (CASCADE)
  product_id      BIGINT,
  description     TEXT,
  quantity        DECIMAL(18,3) NOT NULL,
  unit_price      DECIMAL(18,2) NOT NULL,
  tax_rate_id     BIGINT,
  line_total      DECIMAL(18,2) DEFAULT 0,
  line_tax        DECIMAL(18,2) DEFAULT 0,
  line_total_after_tax DECIMAL(18,2) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

#### Bảng 5: endor_refunds (tương đương ar_refunds)
`sql
-- Vendor Refund: NCC hoàn tiền lại cho mình
CREATE TABLE vendor_refunds (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id       BIGINT NOT NULL,
  refund_no       VARCHAR(50) NOT NULL UNIQUE,
  debit_note_id   BIGINT,                             -- FK ap_debit_notes
  supplier_id     BIGINT NOT NULL,
  refund_date     DATE NOT NULL,
  amount          DECIMAL(18,2) NOT NULL,
  method          ENUM('cash','bank','transfer') DEFAULT 'bank',
  bank_account_id BIGINT,                             -- FK bank_accounts
  status          ENUM('draft','posted') DEFAULT 'draft',
  approval_status ENUM('draft','waiting_approval','approved','rejected') DEFAULT 'draft',
  gl_entry_id     BIGINT,                             -- FK gl_entries
  created_by      BIGINT,
  approved_by     BIGINT,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`

### Luồng hoàn chỉnh sau khi bổ sung
`
Purchase Order → AP Invoice → AP Payment

Khi trả hàng:
  Purchase Order → Purchase Return Authorization (PRA)
    → Purchase Return + Purchase Return Lines  [xuất kho trả NCC]
      → AP Debit Note + AP Debit Note Lines    [giảm công nợ phải trả]
        → Vendor Refund                        [NCC hoàn tiền]
`

---

## 4. Gap 3 — ap_invoices thiếu fields

### Schema hiện tại của p_invoices (sau tất cả migrations)
`
id, po_id, invoice_no, invoice_date, due_date
total_before_tax, total_tax, total_after_tax
status: draft | posted | partially_paid | paid | cancelled
approval_status: draft | waiting_approval | approved | rejected
created_by, approved_by, submitted_at, approved_at, reject_reason
branch_id, supplier_id
invoice_series, invoice_template, tax_code
source: manual | ai_ocr
invoice_document_id, ocr_confidence
matching_status: pending | matched | mismatch
matching_details (JSON)
created_at, updated_at
`

### Schema r_invoices để so sánh
`
id, order_id, invoice_no, invoice_date
total_before_tax, total_tax, total_after_tax
status: draft | posted | partially_paid | paid | cancelled
approval_status, created_by, approved_by, submitted_at, approved_at, reject_reason
branch_id, customer_id
payment_term_id → payment_terms          ← ap_invoices THIẾU
due_date (DATEONLY)                      ← ap_invoices có nhưng kiểu DATE, không DATEONLY
paid_amount DECIMAL(18,2) DEFAULT 0      ← ap_invoices THIẾU
currency_id → currencies                 ← ap_invoices THIẾU
exchange_rate DECIMAL(18,6)              ← ap_invoices THIẾU
last_payment_date DATEONLY               ← ap_invoices THIẾU
created_at, updated_at
`

### Fields cần thêm vào p_invoices

| Column | Type | Default | Ghi chú |
|---|---|---|---|
| payment_term_id | BIGINT | NULL | FK payment_terms — điều khoản thanh toán |
| paid_amount | DECIMAL(18,2) | 0 | Tổng đã thanh toán, cập nhật khi có AP Payment |
| currency_id | BIGINT | NULL | FK currencies — đa tiền tệ |
| exchange_rate | DECIMAL(18,6) | 1.000000 | Tỷ giá tại thời điểm hóa đơn |
| last_payment_date | DATEONLY | NULL | Ngày thanh toán gần nhất |

### Migration cần tạo
`javascript
// 20260801000001-enhance-ap-invoices.js
await queryInterface.addColumn('ap_invoices', 'payment_term_id', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'payment_terms', key: 'id' }
});
await queryInterface.addColumn('ap_invoices', 'paid_amount', {
  type: Sequelize.DECIMAL(18, 2), defaultValue: 0
});
await queryInterface.addColumn('ap_invoices', 'currency_id', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'currencies', key: 'id' }
});
await queryInterface.addColumn('ap_invoices', 'exchange_rate', {
  type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000
});
await queryInterface.addColumn('ap_invoices', 'last_payment_date', {
  type: Sequelize.DATEONLY, allowNull: true
});
`

### Logic cần cập nhật trong service
- Khi tạo AP Payment và allocation: cộng pplied_amount vào p_invoices.paid_amount
- Khi paid_amount >= total_after_tax: set status = 'paid', last_payment_date = today
- Khi   < paid_amount < total_after_tax: set status = 'partially_paid'

---

## 5. Gap 4 — ap_payments thiếu fields

### Schema hiện tại của p_payments (sau tất cả migrations)
`
id, payment_no (unique)
supplier_id → partners
payment_date, amount
method: cash | bank | transfer
status: draft | posted | completed | cancelled
approval_status: draft | waiting_approval | approved | rejected
created_by, approved_by, submitted_at, approved_at, reject_reason
branch_id
created_at, updated_at
`

### Schema r_receipts để so sánh
`
id, receipt_no (unique)
customer_id → partners
receipt_date, amount
method: cash | bank | transfer
status: draft | posted
approval_status, created_by, approved_by, submitted_at, approved_at, reject_reason
branch_id
allocation_status: unallocated | partially_allocated | fully_allocated  ← ap_payments THIẾU
currency_id → currencies                                                 ← ap_payments THIẾU
exchange_rate DECIMAL(18,6)                                              ← ap_payments THIẾU
bank_account_id → bank_accounts                                          ← ap_payments THIẾU
transaction_reference VARCHAR(100)                                       ← ap_payments THIẾU
created_at, updated_at
`

### Fields cần thêm vào p_payments

| Column | Type | Default | Ghi chú |
|---|---|---|---|
| llocation_status | ENUM | unallocated | unallocated / partially_allocated / fully_allocated |
| currency_id | BIGINT | NULL | FK currencies |
| exchange_rate | DECIMAL(18,6) | 1.000000 | Tỷ giá khi thanh toán |
| ank_account_id | BIGINT | NULL | FK bank_accounts — tài khoản ngân hàng dùng để trả |
| 	ransaction_reference | VARCHAR(100) | NULL | Số tham chiếu giao dịch ngân hàng |

### Lưu ý về status enum
p_payments hiện có: draft | posted | completed | cancelled
r_receipts chỉ có: draft | posted

Đề xuất thống nhất p_payments.status:
`
draft → posted → completed → cancelled
`
Giữ nguyên, nhưng cần document rõ: completed = đã phân bổ hết vào invoices.

### Migration cần tạo
`javascript
// 20260801000002-enhance-ap-payments.js
await queryInterface.addColumn('ap_payments', 'allocation_status', {
  type: Sequelize.ENUM('unallocated', 'partially_allocated', 'fully_allocated'),
  defaultValue: 'unallocated'
});
await queryInterface.addColumn('ap_payments', 'currency_id', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'currencies', key: 'id' }
});
await queryInterface.addColumn('ap_payments', 'exchange_rate', {
  type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000
});
await queryInterface.addColumn('ap_payments', 'bank_account_id', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'bank_accounts', key: 'id' }
});
await queryInterface.addColumn('ap_payments', 'transaction_reference', {
  type: Sequelize.STRING(100), allowNull: true
});
`

---

## 6. Gap 5 — purchase_orders thiếu fields

### Schema hiện tại của purchase_orders (sau tất cả migrations)
`
id, branch_id, po_no (unique)
supplier_id → partners
order_date
description (TEXT)
total_before_tax, total_tax, total_after_tax
status: draft | waiting_approval | confirmed | partially_received | completed | cancelled
created_by, approved_by, submitted_at, approved_at, reject_reason
created_at, updated_at
`

### Schema sale_orders để so sánh
`
id, branch_id, order_no (unique)
customer_id → partners
order_date
total_before_tax, total_tax, total_after_tax
status: draft | confirmed | shipped | completed | cancelled
approval_status, created_by, approved_by, submitted_at, approved_at, reject_reason
quotation_id → quotations                    ← purchase_orders cần rfq_id
currency_id → currencies                     ← purchase_orders THIẾU
exchange_rate DECIMAL(18,6)                  ← purchase_orders THIẾU
payment_term_id → payment_terms              ← purchase_orders THIẾU
discount_percent DECIMAL(5,2)                ← purchase_orders THIẾU (header-level)
discount_amount DECIMAL(18,2)                ← purchase_orders THIẾU (header-level)
delivery_status: pending | partial | delivered  ← purchase_orders THIẾU
invoice_status: not_invoiced | partial | invoiced  ← purchase_orders THIẾU
customer_po_number VARCHAR(100)              ← purchase_orders cần supplier_ref_no
delivery_address TEXT                        ← purchase_orders THIẾU
expected_delivery_date DATEONLY              ← purchase_orders THIẾU
sales_person_id → users                      ← purchase_orders cần buyer_id
internal_notes TEXT                          ← purchase_orders THIẾU
customer_notes TEXT                          ← purchase_orders cần supplier_notes
created_at, updated_at
`

### Fields cần thêm vào purchase_orders

| Column | Type | Default | Ghi chú |
|---|---|---|---|
| fq_id | BIGINT | NULL | FK purchase_rfqs — RFQ nguồn gốc |
| currency_id | BIGINT | NULL | FK currencies |
| exchange_rate | DECIMAL(18,6) | 1.000000 | Tỷ giá |
| payment_term_id | BIGINT | NULL | FK payment_terms |
| discount_percent | DECIMAL(5,2) | 0 | Chiết khấu header % |
| discount_amount | DECIMAL(18,2) | 0 | Chiết khấu header tuyệt đối |
| eceipt_status | ENUM | pending | pending / partial / fully_received — track nhận hàng |
| invoice_status | ENUM | 
ot_invoiced | 
ot_invoiced / partial / invoiced |
| supplier_ref_no | VARCHAR(100) | NULL | Số tham chiếu của NCC (tương đương customer_po_number) |
| delivery_address | TEXT | NULL | Địa chỉ giao hàng |
| expected_delivery_date | DATEONLY | NULL | Ngày giao hàng dự kiến |
| uyer_id | BIGINT | NULL | FK users — người phụ trách mua |
| internal_notes | TEXT | NULL | Ghi chú nội bộ |
| supplier_notes | TEXT | NULL | Ghi chú cho NCC |

### Lưu ý về status enum
purchase_orders hiện dùng status cho cả trạng thái duyệt lẫn trạng thái nhận hàng.
Sale tách riêng: status (order flow) + pproval_status + delivery_status + invoice_status.

**Đề xuất refactor:**
- Giữ status cho order flow: draft | waiting_approval | confirmed | completed | cancelled
- Thêm eceipt_status riêng: pending | partial | fully_received
- Thêm invoice_status riêng: 
ot_invoiced | partial | invoiced
- Bỏ partially_received khỏi status (chuyển sang eceipt_status)

### Migration cần tạo
`javascript
// 20260801000003-enhance-purchase-orders.js
const cols = {
  rfq_id: { type: Sequelize.BIGINT, allowNull: true },
  currency_id: { type: Sequelize.BIGINT, allowNull: true },
  exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
  payment_term_id: { type: Sequelize.BIGINT, allowNull: true },
  discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
  discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
  receipt_status: {
    type: Sequelize.ENUM('pending', 'partial', 'fully_received'),
    defaultValue: 'pending'
  },
  invoice_status: {
    type: Sequelize.ENUM('not_invoiced', 'partial', 'invoiced'),
    defaultValue: 'not_invoiced'
  },
  supplier_ref_no: { type: Sequelize.STRING(100), allowNull: true },
  delivery_address: { type: Sequelize.TEXT, allowNull: true },
  expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
  buyer_id: { type: Sequelize.BIGINT, allowNull: true },
  internal_notes: { type: Sequelize.TEXT, allowNull: true },
  supplier_notes: { type: Sequelize.TEXT, allowNull: true },
};
for (const [col, def] of Object.entries(cols)) {
  await queryInterface.addColumn('purchase_orders', col, def);
}
`

---

## 7. Gap 6 — purchase_order_lines thiếu fields

### Schema hiện tại của purchase_order_lines
`
id, po_id → purchase_orders (CASCADE)
product_id → products
quantity DECIMAL(18,3)
uom_id → uoms
qty_in_stock_uom DECIMAL(18,3)
unit_price DECIMAL(18,2)
discount DECIMAL(5,2)          ← chỉ có %, không có tuyệt đối
tax_rate_id → tax_rates
line_total DECIMAL(18,2)
line_tax DECIMAL(18,2)
line_total_after_tax DECIMAL(18,2)
created_at, updated_at
`

### Schema sale_order_lines để so sánh
`
id, order_id → sale_orders (CASCADE)
product_id → products
description VARCHAR(255)        ← purchase_order_lines THIẾU
quantity DECIMAL(18,3)
unit_price DECIMAL(18,2)
discount_percent DECIMAL(5,2)   ← purchase_order_lines có 'discount' nhưng tên khác
discount_amount DECIMAL(18,2)   ← purchase_order_lines THIẾU
tax_rate_id → tax_rates
line_total DECIMAL(18,2)
line_tax DECIMAL(18,2)
line_total_after_tax DECIMAL(18,2)
created_at, updated_at
`

### Fields cần thêm / đổi tên trong purchase_order_lines

| Vấn đề | Hiện tại | Cần làm |
|---|---|---|
| Tên cột discount | discount (%) | Đổi thành discount_percent cho nhất quán |
| Thiếu discount tuyệt đối | — | Thêm discount_amount DECIMAL(18,2) |
| Thiếu description | — | Thêm description TEXT |
| Thiếu qty_received | — | Thêm qty_received DECIMAL(18,3) để track nhận hàng từng dòng |
| Thiếu qty_invoiced | — | Thêm qty_invoiced DECIMAL(18,3) để track đã lập hóa đơn |

### Migration cần tạo
`javascript
// 20260801000004-enhance-purchase-order-lines.js

// Đổi tên cột discount → discount_percent
await queryInterface.renameColumn('purchase_order_lines', 'discount', 'discount_percent');

// Thêm các cột mới
await queryInterface.addColumn('purchase_order_lines', 'discount_amount', {
  type: Sequelize.DECIMAL(18, 2), defaultValue: 0
});
await queryInterface.addColumn('purchase_order_lines', 'description', {
  type: Sequelize.TEXT, allowNull: true
});
await queryInterface.addColumn('purchase_order_lines', 'qty_received', {
  type: Sequelize.DECIMAL(18, 3), defaultValue: 0,
  comment: 'Số lượng đã nhận từ GRN (stock moves)'
});
await queryInterface.addColumn('purchase_order_lines', 'qty_invoiced', {
  type: Sequelize.DECIMAL(18, 3), defaultValue: 0,
  comment: 'Số lượng đã lập AP Invoice'
});
`

### Lưu ý
- qty_received được cập nhật tự động khi có GRN (stock move type = receipt) liên kết với PO line
- qty_invoiced được cập nhật khi AP Invoice line liên kết với PO line qua po_line_id
- Khi qty_received >= quantity: PO line coi là fully received
- Khi tất cả lines fully received: purchase_orders.receipt_status = 'fully_received'

---

## 8. Gap 7 — ap_payment_allocations thiếu allocation_status

### Schema hiện tại của p_payment_allocations
`
id
payment_id → ap_payments (CASCADE)
ap_invoice_id → ap_invoices (CASCADE)
applied_amount DECIMAL(18,2)
created_at, updated_at
`

### Schema r_receipt_allocations để so sánh
`
id
receipt_id → ar_receipts (CASCADE)
invoice_id → ar_invoices (CASCADE)
applied_amount DECIMAL(18,2)
created_at, updated_at
`

Hai bảng này gần như giống nhau. Tuy nhiên cả hai đều thiếu một số fields hữu ích:

### Fields nên thêm vào cả hai bảng

| Column | Type | Ghi chú |
|---|---|---|
| llocation_date | DATEONLY | Ngày phân bổ (mặc định = ngày tạo) |
| 
otes | TEXT | Ghi chú phân bổ |
| created_by | BIGINT | FK users — ai tạo allocation |

### Migration cần tạo
`javascript
// 20260801000005-enhance-ap-payment-allocations.js
await queryInterface.addColumn('ap_payment_allocations', 'allocation_date', {
  type: Sequelize.DATEONLY, allowNull: true
});
await queryInterface.addColumn('ap_payment_allocations', 'notes', {
  type: Sequelize.TEXT, allowNull: true
});
await queryInterface.addColumn('ap_payment_allocations', 'created_by', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'users', key: 'id' }
});

// Tương tự cho ar_receipt_allocations
await queryInterface.addColumn('ar_receipt_allocations', 'allocation_date', {
  type: Sequelize.DATEONLY, allowNull: true
});
await queryInterface.addColumn('ar_receipt_allocations', 'notes', {
  type: Sequelize.TEXT, allowNull: true
});
await queryInterface.addColumn('ar_receipt_allocations', 'created_by', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'users', key: 'id' }
});
`

---

## 9. Gap 8 — Thiếu Price List cho Purchase

### Vấn đề
Bảng price_lists đã có 	ype: ENUM('sales', 'purchase') và price_list_items đã tồn tại.
Tuy nhiên chưa có cơ chế **áp dụng purchase price list vào PO lines** khi tạo PO.

### Sale đã làm gì
- sale_orders có thể link với price_lists (type=sales) để auto-fill giá
- quotation_lines dùng price_list_items để suggest giá

### Purchase cần làm
1. Thêm price_list_id vào purchase_orders:
`javascript
await queryInterface.addColumn('purchase_orders', 'price_list_id', {
  type: Sequelize.BIGINT, allowNull: true,
  references: { model: 'price_lists', key: 'id' }
});
`

2. Khi tạo PO line, service cần lookup price_list_items (type=purchase) để suggest unit_price
3. product_supplier_info đã có price per supplier — cần tích hợp với price list:
   - Ưu tiên: price_list_items > product_supplier_info.price > products.cost_price

---

## 10. Gap 9 — Audit log không đồng đều

### Hiện trạng
| Table | Audit log | Ghi chú |
|---|---|---|
| purchase_orders | ✅ po_audit_logs | Đầy đủ: action, old_values, new_values, changed_by |
| p_invoices | ✅ p_invoice_audit_logs | Đầy đủ + OCR fields |
| p_payments | ✅ p_payment_audit_logs | Có nhưng chỉ track status change |
| sale_orders | ❌ Không có | |
| r_invoices | ❌ Không có | |
| r_receipts | ❌ Không có | |
| quotations | ❌ Không có | |

### Purchase đang tốt hơn Sale về audit. Sale cần bổ sung:
`javascript
// 20260801000006-create-so-audit-logs.js
CREATE TABLE so_audit_logs (
  id, so_id → sale_orders (CASCADE),
  action VARCHAR(50),
  old_values JSON, new_values JSON,
  changed_by → users,
  changed_at DATETIME,
  branch_id → branches,
  created_at, updated_at
);

// 20260801000007-create-ar-invoice-audit-logs.js
CREATE TABLE ar_invoice_audit_logs (
  id, ar_invoice_id → ar_invoices (CASCADE),
  action VARCHAR(50),
  old_values JSON, new_values JSON,
  changed_by → users,
  changed_at DATETIME,
  created_at
);
`

### ap_payment_audit_logs cần nâng cấp
Hiện tại chỉ có: payment_id, action, old_status, new_status, details, created_by
Cần thêm: old_values JSON, new_values JSON để nhất quán với po_audit_logs.

---

## 11. Kế hoạch migration chi tiết

### Thứ tự thực hiện (phụ thuộc FK)

`
Phase 1 — Bổ sung fields vào bảng hiện có (không tạo bảng mới, ít rủi ro)
  20260801000001-enhance-ap-invoices.js
  20260801000002-enhance-ap-payments.js
  20260801000003-enhance-purchase-orders.js
  20260801000004-enhance-purchase-order-lines.js
  20260801000005-enhance-ap-payment-allocations.js

Phase 2 — Tạo bảng mới cho RFQ flow
  20260802000001-create-purchase-rfqs.js
  20260802000002-create-purchase-rfq-lines.js
  20260802000003-add-rfq-id-to-purchase-orders.js

Phase 3 — Tạo bảng mới cho Return flow
  20260803000001-create-purchase-return-authorizations.js
  20260803000002-create-purchase-returns.js
  20260803000003-create-purchase-return-lines.js
  20260803000004-create-ap-debit-notes.js
  20260803000005-create-ap-debit-note-lines.js
  20260803000006-create-vendor-refunds.js

Phase 4 — Price list integration
  20260804000001-add-price-list-to-purchase-orders.js

Phase 5 — Audit log cho Sale side
  20260805000001-create-so-audit-logs.js
  20260805000002-create-ar-invoice-audit-logs.js
  20260805000003-enhance-ap-payment-audit-logs.js
`

### Chi tiết từng migration file

#### Phase 1

**20260801000001-enhance-ap-invoices.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ap_invoices', 'payment_term_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'due_date',
      references: { model: 'payment_terms', key: 'id' }, onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('ap_invoices', 'paid_amount', {
      type: Sequelize.DECIMAL(18, 2), defaultValue: 0, after: 'total_after_tax'
    });
    await queryInterface.addColumn('ap_invoices', 'currency_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'paid_amount',
      references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('ap_invoices', 'exchange_rate', {
      type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000, after: 'currency_id'
    });
    await queryInterface.addColumn('ap_invoices', 'last_payment_date', {
      type: Sequelize.DATEONLY, allowNull: true, after: 'exchange_rate'
    });
  },
  async down(queryInterface) {
    for (const col of ['last_payment_date','exchange_rate','currency_id','paid_amount','payment_term_id']) {
      await queryInterface.removeColumn('ap_invoices', col);
    }
  }
};
`

**20260801000002-enhance-ap-payments.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ap_payments', 'allocation_status', {
      type: Sequelize.ENUM('unallocated','partially_allocated','fully_allocated'),
      defaultValue: 'unallocated', after: 'status'
    });
    await queryInterface.addColumn('ap_payments', 'currency_id', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('ap_payments', 'exchange_rate', {
      type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000
    });
    await queryInterface.addColumn('ap_payments', 'bank_account_id', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'bank_accounts', key: 'id' }, onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('ap_payments', 'transaction_reference', {
      type: Sequelize.STRING(100), allowNull: true
    });
  },
  async down(queryInterface) {
    for (const col of ['transaction_reference','bank_account_id','exchange_rate','currency_id','allocation_status']) {
      await queryInterface.removeColumn('ap_payments', col);
    }
    await queryInterface.sequelize.query(
      'ALTER TABLE ap_payments MODIFY allocation_status VARCHAR(50)'
    );
  }
};
`

**20260801000003-enhance-purchase-orders.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = {
      currency_id: { type: Sequelize.BIGINT, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      receipt_status: {
        type: Sequelize.ENUM('pending','partial','fully_received'),
        defaultValue: 'pending'
      },
      invoice_status: {
        type: Sequelize.ENUM('not_invoiced','partial','invoiced'),
        defaultValue: 'not_invoiced'
      },
      supplier_ref_no: { type: Sequelize.STRING(100), allowNull: true },
      delivery_address: { type: Sequelize.TEXT, allowNull: true },
      expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
      buyer_id: { type: Sequelize.BIGINT, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      supplier_notes: { type: Sequelize.TEXT, allowNull: true },
    };
    for (const [col, def] of Object.entries(cols)) {
      await queryInterface.addColumn('purchase_orders', col, def);
    }
  },
  async down(queryInterface) {
    const cols = ['supplier_notes','internal_notes','buyer_id','expected_delivery_date',
      'delivery_address','supplier_ref_no','invoice_status','receipt_status',
      'discount_amount','discount_percent','payment_term_id','exchange_rate','currency_id'];
    for (const col of cols) await queryInterface.removeColumn('purchase_orders', col);
    await queryInterface.sequelize.query(
      'ALTER TABLE purchase_orders MODIFY receipt_status VARCHAR(50), MODIFY invoice_status VARCHAR(50)'
    );
  }
};
`

**20260801000004-enhance-purchase-order-lines.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Đổi tên discount → discount_percent
    await queryInterface.renameColumn('purchase_order_lines', 'discount', 'discount_percent');
    // Thêm fields mới
    await queryInterface.addColumn('purchase_order_lines', 'discount_amount', {
      type: Sequelize.DECIMAL(18, 2), defaultValue: 0
    });
    await queryInterface.addColumn('purchase_order_lines', 'description', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('purchase_order_lines', 'qty_received', {
      type: Sequelize.DECIMAL(18, 3), defaultValue: 0
    });
    await queryInterface.addColumn('purchase_order_lines', 'qty_invoiced', {
      type: Sequelize.DECIMAL(18, 3), defaultValue: 0
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_order_lines', 'qty_invoiced');
    await queryInterface.removeColumn('purchase_order_lines', 'qty_received');
    await queryInterface.removeColumn('purchase_order_lines', 'description');
    await queryInterface.removeColumn('purchase_order_lines', 'discount_amount');
    await queryInterface.renameColumn('purchase_order_lines', 'discount_percent', 'discount');
  }
};
`

---

#### Phase 2 — RFQ

**20260802000001-create-purchase-rfqs.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      rfq_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'partners', key: 'id' } },
      currency_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'currencies', key: 'id' } },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'payment_terms', key: 'id' } },
      rfq_date: { type: Sequelize.DATEONLY, allowNull: false },
      valid_until: { type: Sequelize.DATEONLY, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id: { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes: { type: Sequelize.TEXT, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      buyer_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' } },
      created_by: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' } },
      approved_by: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' } },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      received_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_rfqs', ['branch_id', 'status'], { name: 'idx_rfqs_branch_status' });
    await queryInterface.addIndex('purchase_rfqs', ['supplier_id'], { name: 'idx_rfqs_supplier' });
  },
  async down(qi) { await qi.dropTable('purchase_rfqs'); }
};
`

**20260802000002-create-purchase-rfq-lines.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id: { type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' } },
      description: { type: Sequelize.TEXT, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'uoms', key: 'id' } },
      unit_price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' } },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(qi) { await qi.dropTable('purchase_rfq_lines'); }
};
`

**20260802000003-add-rfq-id-to-purchase-orders.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'branch_id',
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
`

---

**20260801000005-enhance-ap-payment-allocations.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ap_payment_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
    // Tương tự cho ar_receipt_allocations
    await queryInterface.addColumn('ar_receipt_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    for (const tbl of ['ap_payment_allocations', 'ar_receipt_allocations']) {
      await queryInterface.removeColumn(tbl, 'created_by');
      await queryInterface.removeColumn(tbl, 'notes');
      await queryInterface.removeColumn(tbl, 'allocation_date');
    }
  }
};
\\\

#### Phase 2 — RFQ Flow

**20260802000001-create-purchase-rfqs.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      rfq_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: true },
      currency_id: { type: Sequelize.BIGINT, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true },
      rfq_date: { type: Sequelize.DATE, allowNull: false },
      valid_until: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id: { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes: { type: Sequelize.TEXT, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      buyer_id: { type: Sequelize.BIGINT, allowNull: true },
      created_by: { type: Sequelize.BIGINT, allowNull: false },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      received_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['branch_id'], type: 'foreign key', name: 'fk_rfqs_branch',
      references: { table: 'branches', field: 'id' }, onDelete: 'RESTRICT'
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['supplier_id'], type: 'foreign key', name: 'fk_rfqs_supplier',
      references: { table: 'partners', field: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfqs'); }
};
\\\

**20260802000002-create-purchase-rfq-lines.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id: { type: Sequelize.BIGINT, allowNull: true },
      unit_price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id: { type: Sequelize.BIGINT, allowNull: true },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfq_lines', {
      fields: ['rfq_id'], type: 'foreign key', name: 'fk_rfq_lines_rfq',
      references: { table: 'purchase_rfqs', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfq_lines'); }
};
\\\

**20260802000003-add-rfq-id-to-purchase-orders.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
\\\

---

**20260801000005-enhance-ap-payment-allocations.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ap_payment_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
    // Tương tự cho ar_receipt_allocations
    await queryInterface.addColumn('ar_receipt_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    for (const tbl of ['ap_payment_allocations', 'ar_receipt_allocations']) {
      await queryInterface.removeColumn(tbl, 'created_by');
      await queryInterface.removeColumn(tbl, 'notes');
      await queryInterface.removeColumn(tbl, 'allocation_date');
    }
  }
};
`

#### Phase 2 — RFQ Flow

**20260802000001-create-purchase-rfqs.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      rfq_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: true },
      currency_id: { type: Sequelize.BIGINT, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true },
      rfq_date: { type: Sequelize.DATE, allowNull: false },
      valid_until: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id: { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes: { type: Sequelize.TEXT, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      buyer_id: { type: Sequelize.BIGINT, allowNull: true },
      created_by: { type: Sequelize.BIGINT, allowNull: false },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      received_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['branch_id'], type: 'foreign key', name: 'fk_rfqs_branch',
      references: { table: 'branches', field: 'id' }, onDelete: 'RESTRICT'
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['supplier_id'], type: 'foreign key', name: 'fk_rfqs_supplier',
      references: { table: 'partners', field: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfqs'); }
};
`

**20260802000002-create-purchase-rfq-lines.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id: { type: Sequelize.BIGINT, allowNull: true },
      unit_price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id: { type: Sequelize.BIGINT, allowNull: true },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfq_lines', {
      fields: ['rfq_id'], type: 'foreign key', name: 'fk_rfq_lines_rfq',
      references: { table: 'purchase_rfqs', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfq_lines'); }
};
`

**20260802000003-add-rfq-id-to-purchase-orders.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'po_no',
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
`

#### Phase 3 — Return Flow (4 bảng mới)

**20260803000001-create-purchase-return-authorizations.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      pra_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id: { type: Sequelize.BIGINT, allowNull: false },
      ap_invoice_id: { type: Sequelize.BIGINT, allowNull: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      return_type: {
        type: Sequelize.ENUM('refund','replacement','debit_note'),
        defaultValue: 'debit_note'
      },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by: { type: Sequelize.BIGINT, allowNull: true },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
`

**20260803000002-create-purchase-returns.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      return_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id: { type: Sequelize.BIGINT, allowNull: true },
      purchase_order_id: { type: Sequelize.BIGINT, allowNull: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: false },
      return_date: { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id: { type: Sequelize.BIGINT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by: { type: Sequelize.BIGINT, allowNull: true },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
`

**20260803000003-create-purchase-return-lines.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      quantity_returned: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      quantity_rejected: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason: { type: Sequelize.TEXT, allowNull: true },
      condition: {
        type: Sequelize.ENUM('good','damaged','defective'),
        defaultValue: 'good'
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_return_lines', {
      fields: ['return_id'], type: 'foreign key', name: 'fk_prl_return',
      references: { table: 'purchase_returns', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
`

**20260803000004-create-ap-debit-notes.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_notes', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      debit_note_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_return_id: { type: Sequelize.BIGINT, allowNull: true },
      original_ap_invoice_id: { type: Sequelize.BIGINT, allowNull: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: false },
      debit_note_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM('draft','posted','applied','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id: { type: Sequelize.BIGINT, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      created_by: { type: Sequelize.BIGINT, allowNull: true },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_notes'); }
};
`

**20260803000005-create-ap-debit-note-lines.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_note_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      debit_note_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id: { type: Sequelize.BIGINT, allowNull: true },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('ap_debit_note_lines', {
      fields: ['debit_note_id'], type: 'foreign key', name: 'fk_adnl_debit_note',
      references: { table: 'ap_debit_notes', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_note_lines'); }
};
`

**20260803000006-create-vendor-refunds.js**
`javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_refunds', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      refund_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      debit_note_id: { type: Sequelize.BIGINT, allowNull: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: false },
      refund_date: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method: {
        type: Sequelize.ENUM('cash','bank','transfer'),
        defaultValue: 'bank'
      },
      bank_account_id: { type: Sequelize.BIGINT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','posted'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      gl_entry_id: { type: Sequelize.BIGINT, allowNull: true },
      created_by: { type: Sequelize.BIGINT, allowNull: true },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('vendor_refunds'); }
};
`

---

**20260801000005-enhance-ap-payment-allocations.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ap_payment_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ap_payment_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
    // Tương tự cho ar_receipt_allocations
    await queryInterface.addColumn('ar_receipt_allocations', 'allocation_date', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'notes', {
      type: Sequelize.TEXT, allowNull: true
    });
    await queryInterface.addColumn('ar_receipt_allocations', 'created_by', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    for (const tbl of ['ap_payment_allocations', 'ar_receipt_allocations']) {
      await queryInterface.removeColumn(tbl, 'created_by');
      await queryInterface.removeColumn(tbl, 'notes');
      await queryInterface.removeColumn(tbl, 'allocation_date');
    }
  }
};
\\\

#### Phase 2 — RFQ Flow

**20260802000001-create-purchase-rfqs.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id: { type: Sequelize.BIGINT, allowNull: false },
      rfq_no: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: Sequelize.BIGINT, allowNull: true },
      currency_id: { type: Sequelize.BIGINT, allowNull: true },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true },
      rfq_date: { type: Sequelize.DATE, allowNull: false },
      valid_until: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id: { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes: { type: Sequelize.TEXT, allowNull: true },
      internal_notes: { type: Sequelize.TEXT, allowNull: true },
      buyer_id: { type: Sequelize.BIGINT, allowNull: true },
      created_by: { type: Sequelize.BIGINT, allowNull: false },
      approved_by: { type: Sequelize.BIGINT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      received_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['branch_id'], type: 'foreign key', name: 'fk_rfqs_branch',
      references: { table: 'branches', field: 'id' }, onDelete: 'RESTRICT'
    });
    await queryInterface.addConstraint('purchase_rfqs', {
      fields: ['supplier_id'], type: 'foreign key', name: 'fk_rfqs_supplier',
      references: { table: 'partners', field: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfqs'); }
};
\\\

**20260802000002-create-purchase-rfq-lines.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id: { type: Sequelize.BIGINT, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id: { type: Sequelize.BIGINT, allowNull: true },
      unit_price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id: { type: Sequelize.BIGINT, allowNull: true },
      line_total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('purchase_rfq_lines', {
      fields: ['rfq_id'], type: 'foreign key', name: 'fk_rfq_lines_rfq',
      references: { table: 'purchase_rfqs', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfq_lines'); }
};
\\\

**20260802000003-add-rfq-id-to-purchase-orders.js**
\\\javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true,
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
\\\

---

#### Phase 2 — RFQ flow migrations

**20260802000001-create-purchase-rfqs.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      rfq_no:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'partners', key: 'id' }, onDelete: 'SET NULL' },
      currency_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL' },
      exchange_rate:   { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'payment_terms', key: 'id' }, onDelete: 'SET NULL' },
      rfq_date:        { type: Sequelize.DATEONLY, allowNull: false },
      valid_until:     { type: Sequelize.DATEONLY, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version:          { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id:        { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax:        { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax:  { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2),  defaultValue: 0 },
      discount_amount:  { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes:   { type: Sequelize.TEXT, allowNull: true },
      internal_notes:   { type: Sequelize.TEXT, allowNull: true },
      buyer_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_by:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      approved_by:      { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:     { type: Sequelize.DATE, allowNull: true },
      approved_at:      { type: Sequelize.DATE, allowNull: true },
      reject_reason:    { type: Sequelize.TEXT, allowNull: true },
      sent_at:          { type: Sequelize.DATE, allowNull: true },
      received_at:      { type: Sequelize.DATE, allowNull: true },
      created_at:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_rfqs', ['branch_id', 'status'], { name: 'idx_rfqs_branch_status' });
    await queryInterface.addIndex('purchase_rfqs', ['supplier_id'],          { name: 'idx_rfqs_supplier' });
    await queryInterface.addIndex('purchase_rfqs', ['rfq_date'],             { name: 'idx_rfqs_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfqs'); }
};
```

**20260802000002-create-purchase-rfq-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id:                   { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id:               { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'CASCADE' },
      product_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      description:          { type: Sequelize.TEXT, allowNull: true },
      quantity:             { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id:               { type: Sequelize.BIGINT, allowNull: true, references: { model: 'uoms', key: 'id' }, onDelete: 'SET NULL' },
      unit_price:           { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent:     { type: Sequelize.DECIMAL(5, 2),  defaultValue: 0 },
      discount_amount:      { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' }, onDelete: 'SET NULL' },
      line_total:           { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax:             { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days:       { type: Sequelize.INTEGER, allowNull: true },
      created_at:           { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:           { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfq_lines'); }
};
```

**20260802000003-add-rfq-id-to-purchase-orders.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'branch_id',
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
```

---

#### Phase 2 — RFQ flow

**20260802000001-create-purchase-rfqs.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfqs', {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      rfq_no:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'partners', key: 'id' }, onDelete: 'SET NULL' },
      currency_id:     { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL' },
      exchange_rate:   { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      payment_term_id: { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'payment_terms', key: 'id' }, onDelete: 'SET NULL' },
      rfq_date:        { type: Sequelize.DATEONLY, allowNull: false },
      valid_until:     { type: Sequelize.DATEONLY, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft','sent','received','accepted','rejected','expired','cancelled'),
        defaultValue: 'draft'
      },
      approval_status: {
        type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'),
        defaultValue: 'draft'
      },
      version:          { type: Sequelize.INTEGER, defaultValue: 1 },
      parent_id:        { type: Sequelize.BIGINT, allowNull: true },
      total_before_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax:        { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax:  { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount:  { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      supplier_notes:   { type: Sequelize.TEXT, allowNull: true },
      internal_notes:   { type: Sequelize.TEXT, allowNull: true },
      buyer_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_by:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      approved_by:      { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:     { type: Sequelize.DATE, allowNull: true },
      approved_at:      { type: Sequelize.DATE, allowNull: true },
      reject_reason:    { type: Sequelize.TEXT, allowNull: true },
      sent_at:          { type: Sequelize.DATE, allowNull: true },
      received_at:      { type: Sequelize.DATE, allowNull: true },
      created_at:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_rfqs', ['branch_id', 'status'], { name: 'idx_rfqs_branch_status' });
    await queryInterface.addIndex('purchase_rfqs', ['supplier_id'],          { name: 'idx_rfqs_supplier' });
    await queryInterface.addIndex('purchase_rfqs', ['rfq_date'],             { name: 'idx_rfqs_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfqs'); }
};
```

**20260802000002-create-purchase-rfq-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_rfq_lines', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      rfq_id:              { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'CASCADE' },
      product_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      description:         { type: Sequelize.TEXT, allowNull: true },
      quantity:            { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      uom_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'uoms', key: 'id' }, onDelete: 'SET NULL' },
      unit_price:          { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      discount_percent:    { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      discount_amount:     { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      tax_rate_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' }, onDelete: 'SET NULL' },
      line_total:          { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax:            { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax:{ type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      lead_time_days:      { type: Sequelize.INTEGER, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_rfq_lines'); }
};
```

**20260802000003-add-rfq-id-to-purchase-orders.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'rfq_id', {
      type: Sequelize.BIGINT, allowNull: true, after: 'branch_id',
      references: { model: 'purchase_rfqs', key: 'id' }, onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('purchase_orders', 'rfq_id');
  }
};
```


#### Phase 3 — Purchase Return flow

**20260803000001-create-purchase-return-authorizations.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      pra_no:              { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_orders', key: 'id' } },
      ap_invoice_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      reason:              { type: Sequelize.TEXT, allowNull: false },
      return_type:         { type: Sequelize.ENUM('refund','replacement','debit_note'), defaultValue: 'debit_note' },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      reject_reason:       { type: Sequelize.TEXT, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_return_authorizations', ['branch_id', 'status'], { name: 'idx_pra_branch_status' });
    await queryInterface.addIndex('purchase_return_authorizations', ['supplier_id'],          { name: 'idx_pra_supplier' });
    await queryInterface.addIndex('purchase_return_authorizations', ['purchase_order_id'],    { name: 'idx_pra_po' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
```

**20260803000002-create-purchase-returns.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_return_authorizations', key: 'id' }, onDelete: 'SET NULL' },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true, references: { model: 'warehouses', key: 'id' }, onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_returns', ['branch_id', 'status'], { name: 'idx_pr_branch_status' });
    await queryInterface.addIndex('purchase_returns', ['supplier_id'],          { name: 'idx_pr_supplier' });
    await queryInterface.addIndex('purchase_returns', ['return_date'],          { name: 'idx_pr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
```

**20260803000003-create-purchase-return-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id:                 { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'CASCADE' },
      product_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' } },
      po_line_id:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'purchase_order_lines', key: 'id' }, onDelete: 'SET NULL' },
      quantity_returned:  { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0, comment: 'NCC xac nhan nhan lai' },
      quantity_rejected:  { type: Sequelize.DECIMAL(18, 3), defaultValue: 0, comment: 'NCC tu choi nhan' },
      unit_price:         { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason:             { type: Sequelize.TEXT, allowNull: true },
      condition:          { type: Sequelize.ENUM('good','damaged','defective'), defaultValue: 'good' },
      created_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
```

**20260803000004-create-ap-debit-notes.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_notes', {
      id:                      { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:               { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      debit_note_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_return_id:      { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'SET NULL' },
      original_ap_invoice_id:  { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:             { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      debit_note_date:         { type: Sequelize.DATEONLY, allowNull: false },
      status:                  { type: Sequelize.ENUM('draft','posted','applied','cancelled'), defaultValue: 'draft' },
      approval_status:         { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_before_tax:        { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax:               { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id:             { type: Sequelize.BIGINT, allowNull: true, references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL' },
      exchange_rate:           { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      created_by:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:             { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:            { type: Sequelize.DATE, allowNull: true },
      approved_at:             { type: Sequelize.DATE, allowNull: true },
      reject_reason:           { type: Sequelize.TEXT, allowNull: true },
      notes:                   { type: Sequelize.TEXT, allowNull: true },
      created_at:              { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:              { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('ap_debit_notes', ['branch_id', 'status'],   { name: 'idx_ap_dn_branch_status' });
    await queryInterface.addIndex('ap_debit_notes', ['supplier_id'],            { name: 'idx_ap_dn_supplier' });
    await queryInterface.addIndex('ap_debit_notes', ['debit_note_date'],        { name: 'idx_ap_dn_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_notes'); }
};
```

**20260803000005-create-ap-debit-note-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_note_lines', {
      id:                   { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      debit_note_id:        { type: Sequelize.BIGINT, allowNull: false, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'CASCADE' },
      product_id:           { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'products', key: 'id' }, onDelete: 'SET NULL' },
      description:          { type: Sequelize.TEXT, allowNull: true },
      quantity:             { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price:           { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' }, onDelete: 'SET NULL' },
      line_total:           { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax:             { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at:           { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:           { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_note_lines'); }
};
```

**20260803000006-create-vendor-refunds.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_refunds', {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      refund_no:       { type: Sequelize.STRING(50), allowNull: false, unique: true },
      debit_note_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      refund_date:     { type: Sequelize.DATEONLY, allowNull: false },
      amount:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method:          { type: Sequelize.ENUM('cash','bank','transfer'), defaultValue: 'bank' },
      bank_account_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'bank_accounts', key: 'id' }, onDelete: 'SET NULL' },
      status:          { type: Sequelize.ENUM('draft','posted'), defaultValue: 'draft' },
      approval_status: { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      gl_entry_id:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'gl_entries', key: 'id' }, onDelete: 'SET NULL' },
      created_by:      { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:    { type: Sequelize.DATE, allowNull: true },
      approved_at:     { type: Sequelize.DATE, allowNull: true },
      reject_reason:   { type: Sequelize.TEXT, allowNull: true },
      notes:           { type: Sequelize.TEXT, allowNull: true },
      created_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('vendor_refunds', ['branch_id', 'status'], { name: 'idx_vr_branch_status' });
    await queryInterface.addIndex('vendor_refunds', ['supplier_id'],          { name: 'idx_vr_supplier' });
    await queryInterface.addIndex('vendor_refunds', ['refund_date'],          { name: 'idx_vr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('vendor_refunds'); }
};
```


#### Phase 3 — Purchase Return flow

**20260803000001-create-purchase-return-authorizations.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      pra_no:              { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_orders', key: 'id' } },
      ap_invoice_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      reason:              { type: Sequelize.TEXT, allowNull: false },
      return_type:         { type: Sequelize.ENUM('refund','replacement','debit_note'), defaultValue: 'debit_note' },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      reject_reason:       { type: Sequelize.TEXT, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_return_authorizations', ['branch_id', 'status'], { name: 'idx_pra_branch_status' });
    await queryInterface.addIndex('purchase_return_authorizations', ['supplier_id'],          { name: 'idx_pra_supplier' });
    await queryInterface.addIndex('purchase_return_authorizations', ['purchase_order_id'],    { name: 'idx_pra_po' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
```

**20260803000002-create-purchase-returns.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_return_authorizations', key: 'id' }, onDelete: 'SET NULL' },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true, references: { model: 'warehouses', key: 'id' }, onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_returns', ['branch_id', 'status'], { name: 'idx_pr_branch_status' });
    await queryInterface.addIndex('purchase_returns', ['supplier_id'],          { name: 'idx_pr_supplier' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
```

**20260803000003-create-purchase-return-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id:                 { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'CASCADE' },
      product_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' } },
      po_line_id:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'purchase_order_lines', key: 'id' }, onDelete: 'SET NULL' },
      quantity_returned:  { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0, comment: 'NCC xac nhan nhan lai' },
      quantity_rejected:  { type: Sequelize.DECIMAL(18, 3), defaultValue: 0, comment: 'NCC tu choi nhan' },
      unit_price:         { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason:             { type: Sequelize.TEXT, allowNull: true },
      condition:          { type: Sequelize.ENUM('good','damaged','defective'), defaultValue: 'good' },
      created_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
```

**20260803000004-create-ap-debit-notes.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_notes', {
      id:                     { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:              { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      debit_note_no:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_return_id:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'SET NULL' },
      original_ap_invoice_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:            { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      debit_note_date:        { type: Sequelize.DATEONLY, allowNull: false },
      status:                 { type: Sequelize.ENUM('draft','posted','applied','cancelled'), defaultValue: 'draft' },
      approval_status:        { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_before_tax:       { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax:              { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax:        { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id:            { type: Sequelize.BIGINT, allowNull: true, references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL' },
      exchange_rate:          { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      created_by:             { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:            { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:           { type: Sequelize.DATE, allowNull: true },
      approved_at:            { type: Sequelize.DATE, allowNull: true },
      reject_reason:          { type: Sequelize.TEXT, allowNull: true },
      notes:                  { type: Sequelize.TEXT, allowNull: true },
      created_at:             { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:             { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('ap_debit_notes', ['branch_id', 'status'],   { name: 'idx_ap_dn_branch_status' });
    await queryInterface.addIndex('ap_debit_notes', ['supplier_id'],            { name: 'idx_ap_dn_supplier' });
    await queryInterface.addIndex('ap_debit_notes', ['debit_note_date'],        { name: 'idx_ap_dn_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_notes'); }
};
```

**20260803000005-create-ap-debit-note-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_note_lines', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      debit_note_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'CASCADE' },
      product_id:          { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'products', key: 'id' }, onDelete: 'SET NULL' },
      description:         { type: Sequelize.TEXT, allowNull: true },
      quantity:            { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' }, onDelete: 'SET NULL' },
      line_total:          { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax:            { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax:{ type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_note_lines'); }
};
```

**20260803000006-create-vendor-refunds.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_refunds', {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      refund_no:       { type: Sequelize.STRING(50), allowNull: false, unique: true },
      debit_note_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      refund_date:     { type: Sequelize.DATEONLY, allowNull: false },
      amount:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method:          { type: Sequelize.ENUM('cash','bank','transfer'), defaultValue: 'bank' },
      bank_account_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'bank_accounts', key: 'id' }, onDelete: 'SET NULL' },
      transaction_reference: { type: Sequelize.STRING(100), allowNull: true },
      status:          { type: Sequelize.ENUM('draft','posted'), defaultValue: 'draft' },
      approval_status: { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      gl_entry_id:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'gl_entries', key: 'id' }, onDelete: 'SET NULL' },
      created_by:      { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:    { type: Sequelize.DATE, allowNull: true },
      approved_at:     { type: Sequelize.DATE, allowNull: true },
      reject_reason:   { type: Sequelize.TEXT, allowNull: true },
      notes:           { type: Sequelize.TEXT, allowNull: true },
      created_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('vendor_refunds', ['branch_id', 'status'], { name: 'idx_vr_branch_status' });
    await queryInterface.addIndex('vendor_refunds', ['supplier_id'],          { name: 'idx_vr_supplier' });
    await queryInterface.addIndex('vendor_refunds', ['refund_date'],          { name: 'idx_vr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('vendor_refunds'); }
};
```


#### Phase 3 — Purchase Return flow

**20260803000001-create-purchase-return-authorizations.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      pra_no:              { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_orders', key: 'id' } },
      ap_invoice_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      reason:              { type: Sequelize.TEXT, allowNull: false },
      return_type:         { type: Sequelize.ENUM('refund','replacement','debit_note'), defaultValue: 'debit_note' },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      reject_reason:       { type: Sequelize.TEXT, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_return_authorizations', ['branch_id', 'status'], { name: 'idx_pra_branch_status' });
    await queryInterface.addIndex('purchase_return_authorizations', ['supplier_id'],          { name: 'idx_pra_supplier' });
    await queryInterface.addIndex('purchase_return_authorizations', ['purchase_order_id'],    { name: 'idx_pra_po' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
```

**20260803000002-create-purchase-returns.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_return_authorizations', key: 'id' }, onDelete: 'SET NULL' },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true, references: { model: 'warehouses', key: 'id' }, onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_returns', ['branch_id', 'status'], { name: 'idx_pr_branch_status' });
    await queryInterface.addIndex('purchase_returns', ['supplier_id'],          { name: 'idx_pr_supplier' });
    await queryInterface.addIndex('purchase_returns', ['return_date'],          { name: 'idx_pr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
```

**20260803000003-create-purchase-return-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id:                 { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'CASCADE' },
      product_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      po_line_id:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'purchase_order_lines', key: 'id' }, onDelete: 'SET NULL' },
      quantity_returned:  { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      quantity_rejected:  { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      unit_price:         { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason:             { type: Sequelize.TEXT, allowNull: true },
      condition:          { type: Sequelize.ENUM('good','damaged','defective'), defaultValue: 'good' },
      created_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
```


#### Phase 3 — Purchase Return flow

**20260803000001-create-purchase-return-authorizations.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      pra_no:              { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_orders', key: 'id' } },
      ap_invoice_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      reason:              { type: Sequelize.TEXT, allowNull: false },
      return_type:         { type: Sequelize.ENUM('refund','replacement','debit_note'), defaultValue: 'debit_note' },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      reject_reason:       { type: Sequelize.TEXT, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_return_authorizations', ['branch_id','status'], { name: 'idx_pra_branch_status' });
    await queryInterface.addIndex('purchase_return_authorizations', ['supplier_id'],         { name: 'idx_pra_supplier' });
    await queryInterface.addIndex('purchase_return_authorizations', ['purchase_order_id'],   { name: 'idx_pra_po' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
```

**20260803000002-create-purchase-returns.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_return_authorizations', key: 'id' }, onDelete: 'SET NULL' },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true, references: { model: 'warehouses', key: 'id' }, onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_returns', ['branch_id','status'], { name: 'idx_pr_branch_status' });
    await queryInterface.addIndex('purchase_returns', ['supplier_id'],         { name: 'idx_pr_supplier' });
    await queryInterface.addIndex('purchase_returns', ['return_date'],         { name: 'idx_pr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
```

**20260803000003-create-purchase-return-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id:                 { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'CASCADE' },
      product_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      po_line_id:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'purchase_order_lines', key: 'id' }, onDelete: 'SET NULL' },
      quantity_returned:  { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      quantity_rejected:  { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      unit_price:         { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason:             { type: Sequelize.TEXT, allowNull: true },
      condition:          { type: Sequelize.ENUM('good','damaged','defective'), defaultValue: 'good' },
      created_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
```

**20260803000004-create-ap-debit-notes.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_notes', {
      id:                     { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:              { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      debit_note_no:          { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_return_id:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'SET NULL' },
      original_ap_invoice_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:            { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      debit_note_date:        { type: Sequelize.DATEONLY, allowNull: false },
      status:                 { type: Sequelize.ENUM('draft','posted','applied','cancelled'), defaultValue: 'draft' },
      approval_status:        { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_before_tax:       { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_tax:              { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      total_after_tax:        { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      currency_id:            { type: Sequelize.BIGINT, allowNull: true, references: { model: 'currencies', key: 'id' }, onDelete: 'SET NULL' },
      exchange_rate:          { type: Sequelize.DECIMAL(18, 6), defaultValue: 1.000000 },
      created_by:             { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:            { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:           { type: Sequelize.DATE, allowNull: true },
      approved_at:            { type: Sequelize.DATE, allowNull: true },
      reject_reason:          { type: Sequelize.TEXT, allowNull: true },
      notes:                  { type: Sequelize.TEXT, allowNull: true },
      created_at:             { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:             { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('ap_debit_notes', ['branch_id','status'],  { name: 'idx_apdn_branch_status' });
    await queryInterface.addIndex('ap_debit_notes', ['supplier_id'],          { name: 'idx_apdn_supplier' });
    await queryInterface.addIndex('ap_debit_notes', ['debit_note_date'],      { name: 'idx_apdn_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_notes'); }
};
```

**20260803000005-create-ap-debit-note-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ap_debit_note_lines', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      debit_note_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'CASCADE' },
      product_id:          { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'products', key: 'id' }, onDelete: 'SET NULL' },
      description:         { type: Sequelize.TEXT, allowNull: true },
      quantity:            { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      unit_price:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      tax_rate_id:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'tax_rates', key: 'id' }, onDelete: 'SET NULL' },
      line_total:          { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_tax:            { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      line_total_after_tax:{ type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ap_debit_note_lines'); }
};
```

**20260803000006-create-vendor-refunds.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_refunds', {
      id:              { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:       { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      refund_no:       { type: Sequelize.STRING(50), allowNull: false, unique: true },
      debit_note_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'ap_debit_notes', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:     { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      refund_date:     { type: Sequelize.DATEONLY, allowNull: false },
      amount:          { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      method:          { type: Sequelize.ENUM('cash','bank','transfer'), defaultValue: 'bank' },
      bank_account_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'bank_accounts', key: 'id' }, onDelete: 'SET NULL' },
      transaction_reference: { type: Sequelize.STRING(100), allowNull: true },
      status:          { type: Sequelize.ENUM('draft','posted'), defaultValue: 'draft' },
      approval_status: { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      gl_entry_id:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'gl_entries', key: 'id' }, onDelete: 'SET NULL' },
      created_by:      { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:     { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:    { type: Sequelize.DATE, allowNull: true },
      approved_at:     { type: Sequelize.DATE, allowNull: true },
      reject_reason:   { type: Sequelize.TEXT, allowNull: true },
      notes:           { type: Sequelize.TEXT, allowNull: true },
      created_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:      { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('vendor_refunds', ['branch_id','status'], { name: 'idx_vr_branch_status' });
    await queryInterface.addIndex('vendor_refunds', ['supplier_id'],         { name: 'idx_vr_supplier' });
    await queryInterface.addIndex('vendor_refunds', ['refund_date'],         { name: 'idx_vr_date' });
  },
  async down(queryInterface) { await queryInterface.dropTable('vendor_refunds'); }
};
```


#### Phase 3 — Return flow

**20260803000001-create-purchase-return-authorizations.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_authorizations', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      pra_no:              { type: Sequelize.STRING(50), allowNull: false, unique: true },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_orders', key: 'id' } },
      ap_invoice_id:       { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'ap_invoices', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      reason:              { type: Sequelize.TEXT, allowNull: false },
      return_type:         { type: Sequelize.ENUM('refund','replacement','debit_note'), defaultValue: 'debit_note' },
      status: {
        type: Sequelize.ENUM('draft','submitted','approved','rejected','processing','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      reject_reason:       { type: Sequelize.TEXT, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_return_authorizations', ['branch_id', 'status'], { name: 'idx_pra_branch_status' });
    await queryInterface.addIndex('purchase_return_authorizations', ['supplier_id'],          { name: 'idx_pra_supplier' });
    await queryInterface.addIndex('purchase_return_authorizations', ['purchase_order_id'],    { name: 'idx_pra_po' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_authorizations'); }
};
```

**20260803000002-create-purchase-returns.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_returns', {
      id:                  { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      branch_id:           { type: Sequelize.BIGINT, allowNull: false, references: { model: 'branches', key: 'id' } },
      return_no:           { type: Sequelize.STRING(50), allowNull: false, unique: true },
      pra_id:              { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_return_authorizations', key: 'id' }, onDelete: 'SET NULL' },
      purchase_order_id:   { type: Sequelize.BIGINT, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'SET NULL' },
      supplier_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'partners', key: 'id' } },
      return_date:         { type: Sequelize.DATEONLY, allowNull: false },
      warehouse_id:        { type: Sequelize.BIGINT, allowNull: true, references: { model: 'warehouses', key: 'id' }, onDelete: 'SET NULL' },
      status: {
        type: Sequelize.ENUM('draft','shipped','confirmed','completed','cancelled'),
        defaultValue: 'draft'
      },
      approval_status:     { type: Sequelize.ENUM('draft','waiting_approval','approved','rejected'), defaultValue: 'draft' },
      total_return_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      created_by:          { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by:         { type: Sequelize.BIGINT, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      submitted_at:        { type: Sequelize.DATE, allowNull: true },
      approved_at:         { type: Sequelize.DATE, allowNull: true },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:          { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('purchase_returns', ['branch_id', 'status'], { name: 'idx_pr_branch_status' });
    await queryInterface.addIndex('purchase_returns', ['supplier_id'],          { name: 'idx_pr_supplier' });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_returns'); }
};
```

**20260803000003-create-purchase-return-lines.js**
```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_return_lines', {
      id:                 { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      return_id:          { type: Sequelize.BIGINT, allowNull: false, references: { model: 'purchase_returns', key: 'id' }, onDelete: 'CASCADE' },
      product_id:         { type: Sequelize.BIGINT, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      po_line_id:         { type: Sequelize.BIGINT, allowNull: true,  references: { model: 'purchase_order_lines', key: 'id' }, onDelete: 'SET NULL' },
      quantity_returned:  { type: Sequelize.DECIMAL(18, 3), allowNull: false },
      quantity_confirmed: { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      quantity_rejected:  { type: Sequelize.DECIMAL(18, 3), defaultValue: 0 },
      unit_price:         { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      line_total:         { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      reason:             { type: Sequelize.TEXT, allowNull: true },
      condition:          { type: Sequelize.ENUM('good','damaged','defective'), defaultValue: 'good' },
      created_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('purchase_return_lines'); }
};
```


#### Phase 3 — Return flow (tên bảng + columns chính)

| File migration | Bảng tạo | Columns quan trọng |
|---|---|---|
| 20260803000001 | `purchase_return_authorizations` | pra_no, purchase_order_id, ap_invoice_id, supplier_id, reason, return_type(refund/replacement/debit_note), status, approval_status, total_return_amount, created_by, approved_by |
| 20260803000002 | `purchase_returns` | return_no, pra_id, purchase_order_id, supplier_id, return_date, warehouse_id, status(draft/shipped/confirmed/completed/cancelled), approval_status, total_return_amount |
| 20260803000003 | `purchase_return_lines` | return_id(CASCADE), product_id, quantity_returned, quantity_confirmed, quantity_rejected, unit_price, line_total, reason, condition(good/damaged/defective) |
| 20260803000004 | `ap_debit_notes` | debit_note_no, purchase_return_id, original_ap_invoice_id, supplier_id, debit_note_date, status(draft/posted/applied/cancelled), approval_status, total_before_tax, total_tax, total_after_tax, currency_id, exchange_rate |
| 20260803000005 | `ap_debit_note_lines` | debit_note_id(CASCADE), product_id, description, quantity, unit_price, tax_rate_id, line_total, line_tax, line_total_after_tax |
| 20260803000006 | `vendor_refunds` | refund_no, debit_note_id, supplier_id, refund_date, amount, method(cash/bank/transfer), bank_account_id, status(draft/posted), approval_status, gl_entry_id |

#### Phase 4 — Price list integration

```
20260804000001-add-price-list-to-purchase-orders.js
  → addColumn('purchase_orders', 'price_list_id')  FK → price_lists (type=purchase)
```

#### Phase 5 — Audit log cho Sale side

| File migration | Bảng tạo | Columns |
|---|---|---|
| 20260805000001 | `so_audit_logs` | so_id(CASCADE), action, old_values(JSON), new_values(JSON), changed_by, changed_at, branch_id |
| 20260805000002 | `ar_invoice_audit_logs` | ar_invoice_id(CASCADE), action, old_values(JSON), new_values(JSON), changed_by, changed_at |
| 20260805000003 | alter `ap_payment_audit_logs` | addColumn old_values(JSON), new_values(JSON) — nhất quán với po_audit_logs |

---

## 12. Checklist tổng hợp

### Schema DB — Purchase cần làm

#### Alter bảng hiện có
- [ ] `ap_invoices` — thêm: `payment_term_id`, `paid_amount`, `currency_id`, `exchange_rate`, `last_payment_date`
- [ ] `ap_payments` — thêm: `allocation_status`, `currency_id`, `exchange_rate`, `bank_account_id`, `transaction_reference`
- [ ] `purchase_orders` — thêm: `rfq_id`, `currency_id`, `exchange_rate`, `payment_term_id`, `discount_percent`, `discount_amount`, `receipt_status`, `invoice_status`, `supplier_ref_no`, `delivery_address`, `expected_delivery_date`, `buyer_id`, `internal_notes`, `supplier_notes`, `price_list_id`
- [ ] `purchase_order_lines` — rename `discount` → `discount_percent`, thêm: `discount_amount`, `description`, `qty_received`, `qty_invoiced`
- [ ] `ap_payment_allocations` — thêm: `allocation_date`, `notes`, `created_by`
- [ ] `ap_payment_audit_logs` — thêm: `old_values`, `new_values`

#### Tạo bảng mới — RFQ
- [ ] `purchase_rfqs`
- [ ] `purchase_rfq_lines`

#### Tạo bảng mới — Return flow
- [ ] `purchase_return_authorizations`
- [ ] `purchase_returns`
- [ ] `purchase_return_lines`
- [ ] `ap_debit_notes`
- [ ] `ap_debit_note_lines`
- [ ] `vendor_refunds`

### Schema DB — Sale cần làm (để đồng đều)
- [ ] `ar_receipt_allocations` — thêm: `allocation_date`, `notes`, `created_by`
- [ ] `sale_order_lines` — thêm: `uom_id` (purchase_order_lines đã có, sale chưa có)
- [ ] `quotation_lines` — thêm: `uom_id`
- [ ] Tạo `so_audit_logs`
- [ ] Tạo `ar_invoice_audit_logs`

### Model / Service — Purchase cần làm

#### ap_invoices service
- [ ] Khi tạo/update AP Payment allocation: tự động cập nhật `ap_invoices.paid_amount`
- [ ] Tự động chuyển `status`: `partially_paid` khi `0 < paid_amount < total_after_tax`, `paid` khi `paid_amount >= total_after_tax`
- [ ] Cập nhật `last_payment_date` khi có payment mới
- [ ] Tính `due_date` tự động từ `payment_term_id` nếu không nhập tay

#### ap_payments service
- [ ] Khi tạo allocation: cập nhật `allocation_status` trên `ap_payments` (unallocated → partially_allocated → fully_allocated)
- [ ] Khi `fully_allocated`: set `ap_payments.status = 'completed'`

#### purchase_orders service
- [ ] Khi GRN (stock move) liên kết với PO line: cập nhật `purchase_order_lines.qty_received`
- [ ] Tự động cập nhật `purchase_orders.receipt_status` dựa trên tổng `qty_received` vs `quantity` của tất cả lines
- [ ] Khi AP Invoice line liên kết với PO line: cập nhật `purchase_order_lines.qty_invoiced`
- [ ] Tự động cập nhật `purchase_orders.invoice_status`
- [ ] Khi tạo PO từ RFQ: copy lines từ `purchase_rfq_lines`, set `rfq_id`
- [ ] Lookup `price_list_items` (type=purchase) khi thêm PO line để suggest `unit_price`

#### Return flow service (mới hoàn toàn)
- [ ] `PurchaseReturnAuthorizationService` — CRUD + approval workflow
- [ ] `PurchaseReturnService` — tạo return, liên kết với PRA, tạo stock move (xuất kho trả NCC)
- [ ] `ApDebitNoteService` — tạo debit note từ return, liên kết với AP Invoice gốc
- [ ] `VendorRefundService` — tạo refund, liên kết với debit note, tạo GL entry

### API Routes — Purchase cần thêm

| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/purchase/rfqs` | Danh sách / tạo RFQ |
| GET/PUT/DELETE | `/purchase/rfqs/:id` | Chi tiết / cập nhật / xóa RFQ |
| POST | `/purchase/rfqs/:id/send` | Gửi RFQ cho NCC |
| POST | `/purchase/rfqs/:id/convert-to-po` | Chuyển RFQ thành PO |
| GET/POST | `/purchase/return-authorizations` | PRA list / tạo |
| POST | `/purchase/return-authorizations/:id/approve` | Duyệt PRA |
| GET/POST | `/purchase/returns` | Return list / tạo |
| GET/POST | `/purchase/debit-notes` | Debit note list / tạo |
| POST | `/purchase/debit-notes/:id/post` | Post debit note |
| GET/POST | `/purchase/vendor-refunds` | Vendor refund list / tạo |

### Đối xứng API Sale ↔ Purchase

| Sale | Purchase | Trạng thái |
|---|---|---|
| `GET /sale/quotations` | `GET /purchase/rfqs` | ❌ Chưa có |
| `POST /sale/quotations/:id/convert-to-order` | `POST /purchase/rfqs/:id/convert-to-po` | ❌ Chưa có |
| `GET /sale/return-authorizations` | `GET /purchase/return-authorizations` | ❌ Chưa có |
| `GET /sale/returns` | `GET /purchase/returns` | ❌ Chưa có |
| `GET /ar/credit-notes` | `GET /ap/debit-notes` | ❌ Chưa có |
| `GET /ar/refunds` | `GET /ap/vendor-refunds` | ❌ Chưa có |
| `GET /ar/invoices` | `GET /ap/invoices` | ✅ Có |
| `GET /ar/receipts` | `GET /ap/payments` | ✅ Có |

---

## 13. Ghi chú quan trọng khi implement

### Naming convention — giữ nhất quán
| Khái niệm | Sale | Purchase |
|---|---|---|
| Người liên quan | `customer_id` | `supplier_id` |
| Người phụ trách | `sales_person_id` | `buyer_id` |
| Ghi chú cho đối tác | `customer_notes` | `supplier_notes` |
| Số tham chiếu đối tác | `customer_po_number` | `supplier_ref_no` |
| Chứng từ điều chỉnh | `ar_credit_notes` | `ap_debit_notes` |
| Hoàn tiền | `ar_refunds` | `vendor_refunds` |
| Pre-order doc | `quotations` | `purchase_rfqs` |

### Điểm khác biệt nghiệp vụ Sale vs Purchase (không cần đồng nhất)
1. **OCR / AI matching** — chỉ có ở Purchase (ap_invoices), Sale không cần
2. **3-way matching** — chỉ có ở Purchase: PO ↔ GRN ↔ AP Invoice
3. **RFQ có thể gửi cho nhiều NCC** — Sale quotation chỉ gửi cho 1 khách. Nếu cần multi-supplier RFQ, cần thêm bảng `purchase_rfq_suppliers` (1 RFQ → nhiều NCC)
4. **Return condition** — Purchase return cần track `condition` (good/damaged/defective) vì ảnh hưởng đến việc NCC có chấp nhận trả hàng không
5. **Debit note vs Credit note** — Debit note (Purchase) giảm AP, Credit note (Sale) giảm AR — logic kế toán ngược nhau

### Thứ tự ưu tiên đề xuất
```
Sprint 1 (cao nhất — blocking):
  Phase 1 migrations (alter bảng hiện có)
  + Update ap_invoices/ap_payments service logic (paid_amount, allocation_status)

Sprint 2 (trung bình — hoàn thiện PO flow):
  Phase 2 migrations (RFQ)
  + RFQ service + API routes
  + purchase_orders.receipt_status / invoice_status auto-update

Sprint 3 (trung bình — return flow):
  Phase 3 migrations (Return)
  + Return service + API routes

Sprint 4 (thấp — nice-to-have):
  Phase 4 (price list)
  Phase 5 (sale audit logs)
  sale_order_lines / quotation_lines thêm uom_id
```

---
*File này được tạo tự động từ phân tích migrations. Cập nhật lần cuối: 2026-05-10*
