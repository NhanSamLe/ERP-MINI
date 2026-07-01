# Implementation Plan: Purchase P2P & Inventory Gap Fixes

## Tổng quan

Bổ sung 7 tính năng còn thiếu hoặc không hoàn chỉnh trong module **Purchase/P2P** và **Inventory**, dựa trên kết quả Gap Analysis. GL Entry bị loại trừ theo yêu cầu của bạn — chỉ cập nhật logic nghiệp vụ và dữ liệu.

---

## Danh sách vấn đề cần giải quyết

| # | ID | Module | Mức độ | Scope thay đổi |
|---|-----|--------|--------|----------------|
| 1 | P4 | Purchase | 🟢 Dễ | Service only — 2 dòng |
| 2 | P2 | Purchase | 🟡 Trung bình | Service + API endpoint + Migration |
| 3 | P1 | Purchase | 🟡 Trung bình | Migration + Model + Service |
| 4 | I1 | Inventory | 🔴 Phức tạp | Migration + Model + Service mới + Tích hợp SO |
| 5 | I2 | Inventory | 🟡 Trung bình | Migration + Model + Enforcement |
| 6 | I5 | Inventory | 🟡 Trung bình | Migration + Model + Service |
| 7 | I4 | Inventory | 🔴 Phức tạp | Migration + Model + Service + 2-phase flow |

---

## Vấn đề 1 — P4: Payment Term nhất quán cho Partial Invoice

### Hiện trạng
Trong [`apInvoice.service.ts`](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/purchase/services/apInvoice.service.ts), cả 2 hàm `createFromPO()` (dòng 476) và `createPartialFromPO()` (dòng 636-642) đang **hard-code due_date = +30 ngày** thay vì đọc `payment_term_id` từ PO.

### Hướng giải quyết
Không cần migration, chỉ sửa service:

```typescript
// createFromPO() — dòng ~475-494
// TRƯỚC:
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 30);

const result = await this.createAPInvoice({
  source: "manual",
  ...
  due_date: dueDate,        // ← hard-code +30
  lines,
}, user);

// SAU:
const result = await this.createAPInvoice({
  source: "manual",
  ...
  // Không truyền due_date → để createAPInvoice() tự tính từ payment_term_id
  payment_term_id: po.payment_term_id ?? undefined,  // ← thêm dòng này
  lines,
} as any, user);
```

```typescript
// createPartialFromPO() — dòng ~636-642  
// TRƯỚC:
const dueDate = metadata?.due_date
  ? parseDate(metadata.due_date)
  : (() => { const d = new Date(invoiceDate); d.setDate(d.getDate() + 30); return d; })();

const result = await this.createAPInvoice({
  ...
  due_date: dueDate,        // ← hard-code +30

// SAU:
const dueDate = metadata?.due_date ? parseDate(metadata.due_date) : undefined;
// Không set due_date nếu metadata không cung cấp → để tính từ payment_term_id

const result = await this.createAPInvoice({
  ...
  ...(dueDate && { due_date: dueDate }),
  payment_term_id: po.payment_term_id ?? undefined,  // ← thêm
  ...
} as any, user);
```

### Files cần sửa

#### [MODIFY] [apInvoice.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/purchase/services/apInvoice.service.ts)
- `createFromPO()`: bỏ hard-code `dueDate`, thêm `payment_term_id: po.payment_term_id`
- `createPartialFromPO()`: tương tự

---

## Vấn đề 2 — P2: Workflow Override khi 3-Way Mismatch

### Hiện trạng
- `ApInvoiceAuditLog` đã có `override_reason` và `logOverride()` nhưng chỉ dùng cho duplicate
- `approve()` trong service không có logic xử lý mismatch override
- Không có API endpoint riêng cho override mismatch

### Hướng giải quyết

**Bước A — Sửa `approve()` để block posting khi mismatch**

Hiện tại `approve()` post invoice ngay kể cả khi `matching_status = "mismatch"`. Cần thêm check:

```typescript
async approve(id: number, user: any) {
  ...
  // Thêm check mismatch TRƯỚC khi post
  if (invoice.matching_status === "mismatch") {
    throw {
      status: 422,
      code: "MISMATCH_REQUIRES_OVERRIDE",
      message: "Hóa đơn có kết quả 3-Way Matching không khớp. Cần ghi đè mismatch trước khi duyệt.",
      invoice_id: id,
    };
  }
  ...
}
```

**Bước B — Thêm endpoint `POST /ap-invoices/:id/override-mismatch`**

```typescript
async overrideMismatch(id: number, user: any, reason: string) {
  if (user.role !== Role.CHACC) {
    throw { status: 403, message: "Chỉ Kế toán trưởng mới được ghi đè mismatch" };
  }
  const invoice = await ApInvoice.findByPk(id);
  if (!invoice) throw { status: 404, message: "Không tìm thấy hóa đơn" };
  if (invoice.matching_status !== "mismatch") {
    throw { status: 400, message: "Hóa đơn không ở trạng thái mismatch" };
  }
  if (!reason?.trim()) {
    throw { status: 400, message: "override_reason là bắt buộc" };
  }

  // Chuyển matching_status → "matched" (với note override)
  await invoice.update({ matching_status: "matched" });

  // Ghi audit log
  await apInvoiceAuditLogService.logOverride({
    ap_invoice_id: id,
    created_by: user.id,
    override_type: "mismatch",
    override_reason: reason,
  });

  return this.getById(id, user);
}
```

### Files cần sửa/tạo

#### [MODIFY] [apInvoice.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/purchase/services/apInvoice.service.ts)
- `approve()`: thêm guard block khi `matching_status === "mismatch"`
- Thêm method `overrideMismatch()`

#### [MODIFY] routes file của purchase
- Thêm route `POST /ap-invoices/:id/override-mismatch`

#### [MODIFY] controller
- Thêm handler `overrideMismatch`

---

## Vấn đề 3 — P1: Tolerance Rule cho 3-Way Matching

### Hiện trạng
[`ThreeWayMatcherService`](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/threeWayMatcher.service.ts) đang hard-code so sánh `> 0` — bất kỳ chênh lệch nào cũng thành mismatch.

### Hướng giải quyết

**Bước A — Tạo bảng `matching_tolerances`**

```sql
CREATE TABLE matching_tolerances (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  branch_id     BIGINT NOT NULL,
  -- Loại áp dụng (null = mặc định toàn branch)
  supplier_id   BIGINT NULL,
  category_id   BIGINT NULL,  -- product_category_id
  -- Ngưỡng cho phép
  price_tolerance_pct   DECIMAL(5,2) NOT NULL DEFAULT 0,  -- % chênh lệch giá
  qty_tolerance_pct     DECIMAL(5,2) NOT NULL DEFAULT 0,  -- % chênh lệch số lượng
  amount_tolerance_abs  DECIMAL(18,2) NOT NULL DEFAULT 0, -- Chênh lệch tuyệt đối VND
  -- Độ ưu tiên: supplier > category > mặc định
  priority      INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_by    BIGINT NOT NULL,
  created_at    DATETIME,
  updated_at    DATETIME
);
```

**Bước B — Tạo model `MatchingTolerance`**

```typescript
// matching_tolerances model với các field tương ứng
```

**Bước C — Cập nhật `ThreeWayMatcherService`**

```typescript
// Trước:
if (Math.abs(priceDiff) > 0) { status = "mismatch"; }

// Sau: lấy tolerance từ DB
async getTolerance(branchId, supplierId?, categoryId?): Promise<{
  price_pct: number;
  qty_pct: number;
  amount_abs: number;
}> {
  // Ưu tiên: supplier-specific > category-specific > mặc định
  const tol = await MatchingTolerance.findOne({
    where: { branch_id: branchId, is_active: true,
      [Op.or]: [{ supplier_id: supplierId }, { category_id: categoryId }, { supplier_id: null, category_id: null }]
    },
    order: [["priority", "DESC"]],
  });
  return { price_pct: tol?.price_tolerance_pct ?? 0, qty_pct: tol?.qty_tolerance_pct ?? 0, amount_abs: tol?.amount_tolerance_abs ?? 0 };
}

// Trong match():
const priceDiffPct = Math.abs(priceDiff) / poPrice * 100;
const withinTolerance =
  priceDiffPct <= tolerance.price_pct ||
  Math.abs(priceDiff * qty) <= tolerance.amount_abs;

if (!withinTolerance) { lineStatus = "mismatch"; }
```

**Bước D — CRUD API cho tolerance config**

Cần các endpoint để kế toán trưởng cấu hình tolerance.

### Files cần sửa/tạo

#### [NEW] `src/migrations/YYYYMMDD-create-matching-tolerances.js`
#### [NEW] `src/modules/purchase/models/matchingTolerance.model.ts`
#### [MODIFY] `src/modules/document-intelligence/services/threeWayMatcher.service.ts`
- Thêm `getTolerance()`, cập nhật logic so sánh
#### [NEW] `src/modules/purchase/services/matchingTolerance.service.ts`
- CRUD: getAll, create, update, delete
#### [NEW] Route + Controller cho tolerance config

---

## Vấn đề 4 — I1: Reservation / Commit Stock

### Hiện trạng
[`StockBalance`](file:///d:/WorkSpace/TLCN\ERP-MINI\erp-backend\src\modules\inventory\models\stockBalance.model.ts) không có `reserved_qty`. Không có cơ chế lock tồn kho khi SO confirm — chỉ check khi tạo stock move (quá muộn).

### Hướng giải quyết

**Bước A — Migration: thêm `reserved_qty` vào `stock_balances`**

```sql
ALTER TABLE stock_balances
ADD COLUMN reserved_qty DECIMAL(18,3) NOT NULL DEFAULT 0;

-- Bảng tracking chi tiết reservation
CREATE TABLE stock_reservations (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id      BIGINT NOT NULL,
  warehouse_id    BIGINT NOT NULL,
  qty             DECIMAL(18,3) NOT NULL,
  reference_type  ENUM('sale_order', 'transfer') NOT NULL,
  reference_id    BIGINT NOT NULL,
  status          ENUM('active', 'released', 'fulfilled') DEFAULT 'active',
  created_at      DATETIME,
  released_at     DATETIME NULL
);
```

**Bước B — Model updates**

```typescript
// StockBalance: thêm reserved_qty
public reserved_qty!: number;  // virtual: available = quantity - reserved_qty
```

**Bước C — Service mới: `stockReservation.service.ts`**

3 methods cốt lõi:
- `reserve(product_id, warehouse_id, qty, reference_type, reference_id)` → lock row, check available = qty - reserved_qty, tăng reserved_qty
- `release(reference_type, reference_id)` → giảm reserved_qty, mark as released
- `fulfill(reference_type, reference_id)` → mark as fulfilled (stock move đã post)

**Bước D — Tích hợp vào Sale Order service**

```typescript
// saleOrder.service.ts — confirmSaleOrder():
for (const line of so.lines) {
  const result = await stockReservationService.reserve({
    product_id: line.product_id,
    warehouse_id: user.branch.default_warehouse_id,  // warehouse mặc định
    qty: line.quantity,
    reference_type: "sale_order",
    reference_id: soId,
  });
  if (!result.success) {
    await stockReservationService.release("sale_order", soId);
    throw { status: 400, message: result.message };
  }
}

// cancelSaleOrder():
if (so.status === "confirmed") {
  await stockReservationService.release("sale_order", soId);
}
```

**Bước E — Tích hợp vào `processIssue()`**

Khi Stock Move type=issue được approve, gọi `fulfill()` để giảm reserved_qty cùng với quantity.

**Bước F — API: `GET /inventory/stock/available`**

Endpoint trả về `{ quantity, reserved_qty, available_qty, reservations[] }`.

> [!IMPORTANT]
> **Câu hỏi cần xác nhận**: Sale Order hiện tại được confirm ở endpoint nào? Warehouse mặc định của SO lấy từ đâu — từ branch hay từ SO header? Cần biết để tích hợp đúng.

### Files cần sửa/tạo

#### [NEW] `src/migrations/YYYYMMDD-add-reserved-qty-to-stock-balances.js`
#### [NEW] `src/migrations/YYYYMMDD-create-stock-reservations.js`
#### [NEW] `src/modules/inventory/models/stockReservation.model.ts`
#### [MODIFY] [stockBalance.model.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/models/stockBalance.model.ts)
- Thêm field `reserved_qty`
#### [NEW] `src/modules/inventory/services/stockReservation.service.ts`
- `reserve()`, `release()`, `fulfill()`
#### [MODIFY] Sales Order service (xác nhận path)
- `confirmSaleOrder()`: gọi reserve
- `cancelSaleOrder()`: gọi release
#### [MODIFY] [stockMove.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/services/stockMove.service.ts)
- `processIssue()`: gọi `fulfill()` và cập nhật `reserved_qty`
- `createIssue()`: dùng `available_qty` thay vì `quantity` khi check tồn kho
#### [NEW] Route + Controller cho `/inventory/stock/available`

---

## Vấn đề 5 — I2: Lot/Serial bắt buộc theo sản phẩm

### Hiện trạng
`StockMoveLine.lot_id` luôn `allowNull: true`. [`Product`](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/product/models/product.model.ts) không có trường `lot_tracking`. Không có enforcement nào.

### Hướng giải quyết

**Bước A — Migration: thêm `lot_tracking` vào `products`**

```sql
ALTER TABLE products
ADD COLUMN lot_tracking ENUM('none', 'lot', 'serial') NOT NULL DEFAULT 'none';
-- 'none'  = không cần lot/serial
-- 'lot'   = bắt buộc nhập số lô (nhiều cái/lô)
-- 'serial' = bắt buộc nhập serial riêng từng cái
```

**Bước B — Cập nhật Product model**

```typescript
public lot_tracking!: 'none' | 'lot' | 'serial';
```

**Bước C — Enforcement trong `createReceipt()` và `createIssue()`**

```typescript
// Trong createReceipt() và createIssue(), sau validation hiện tại:
for (const line of body.lines) {
  const product = await Product.findByPk(line.product_id);
  if (product?.lot_tracking !== 'none' && !line.lot_id && !line.new_lot?.lot_no) {
    throw {
      status: 400,
      message: `Sản phẩm '${product?.name}' yêu cầu ${product.lot_tracking === 'serial' ? 'số serial' : 'số lô'}. Vui lòng chọn hoặc tạo mới.`,
      code: "LOT_REQUIRED",
      product_id: line.product_id,
    };
  }
  // Serial: mỗi line chỉ được qty=1
  if (product?.lot_tracking === 'serial' && Number(line.quantity) !== 1) {
    throw {
      status: 400,
      message: `Sản phẩm '${product?.name}' quản lý theo serial — mỗi line chỉ được nhập 1 cái.`,
    };
  }
}
```

### Files cần sửa/tạo

#### [NEW] `src/migrations/YYYYMMDD-add-lot-tracking-to-products.js`
#### [MODIFY] Product model
- Thêm `lot_tracking` field
#### [MODIFY] [stockMove.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/services/stockMove.service.ts)
- `createReceipt()`: thêm lot validation
- `createIssue()`: thêm lot validation
- `updateReceipt()`, `updateIssue()`: tương tự

---

## Vấn đề 6 — I5: Kiểm kê có Approval flow

### Hiện trạng
[`physicalInventory.service.ts`](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/services/physicalInventory.service.ts) — `validate()` cho phép thủ kho tự validate luôn mà không qua bước phê duyệt. `PhysicalInventory.status` không có `waiting_approval`.

### Hướng giảiquyết

**Bước A — Migration: thêm `waiting_approval` vào status enum + thêm `approved_by`**

```sql
-- Thêm trạng thái mới
ALTER TABLE physical_inventories
  MODIFY status ENUM('draft','in_progress','waiting_approval','approved','validated','cancelled'),
  ADD COLUMN approved_by BIGINT NULL,
  ADD COLUMN approved_at DATETIME NULL,
  ADD COLUMN reject_reason VARCHAR(255) NULL;
```

**Bước B — Cập nhật Model**

```typescript
export type PhysicalInventoryStatus =
  | "draft" | "in_progress" | "waiting_approval"
  | "approved" | "validated" | "cancelled";
  
// Thêm fields: approved_by, approved_at, reject_reason
```

**Bước C — Tách `validate()` thành 2 bước**

```typescript
// Bước 1: Thủ kho submit → in_progress → waiting_approval
async submitForApproval(id: number, userId: number) {
  const inv = await PhysicalInventory.findByPk(id);
  if (inv?.status !== "in_progress") throw { status: 400, message: "Chỉ submit được khi in_progress" };
  if (inv.created_by !== userId) throw { status: 403, message: "Chỉ người tạo mới được submit" };
  await inv.update({ status: "waiting_approval" });
  return this.getById(id);
}

// Bước 2: Kế toán trưởng/Warehouse Manager approve → waiting_approval → approved → validated
async approve(id: number, userId: number) {
  const inv = await PhysicalInventory.findByPk(id, { include: ["lines"] });
  if (inv?.status !== "waiting_approval") throw { status: 400, message: "Chỉ approve được khi waiting_approval" };
  
  // Cập nhật stock balances (logic hiện tại)
  await this.applyAdjustments(inv, userId);
  
  await inv.update({
    status: "validated",
    approved_by: userId,
    approved_at: new Date(),
    validated_by: userId,
    validated_at: new Date(),
  });
  return this.getById(id);
}

// Bước 3: Reject
async reject(id: number, userId: number, reason: string) {
  const inv = await PhysicalInventory.findByPk(id);
  if (inv?.status !== "waiting_approval") throw { status: 400 };
  await inv.update({ status: "in_progress", reject_reason: reason });
  return this.getById(id);
}
```

**Bước D — API endpoints mới**

- `POST /physical-inventories/:id/submit` — thủ kho submit
- `POST /physical-inventories/:id/approve` — quản lý approve
- `POST /physical-inventories/:id/reject` — quản lý reject

### Files cần sửa/tạo

#### [NEW] `src/migrations/YYYYMMDD-add-approval-to-physical-inventories.js`
#### [MODIFY] [physicalInventory.model.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/models/physicalInventory.model.ts)
- Thêm status enum `waiting_approval`
- Thêm `approved_by`, `approved_at`, `reject_reason`
#### [MODIFY] [physicalInventory.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/services/physicalInventory.service.ts)
- Thêm `submitForApproval()`, `approve()`, `reject()`
- Tách logic apply adjustment thành `applyAdjustments()` private
- Sửa `validate()` cũ → gọi `submitForApproval()` hoặc giữ backward compat
#### [MODIFY] Route + Controller
- Thêm 3 endpoint mới

---

## Vấn đề 7 — I4: Internal Transfer có In-Transit

### Hiện trạng
`processTransfer()` hiện tại là **atomic** — trừ kho nguồn và cộng kho đích trong cùng 1 lần approve. Không có trạng thái "đã xuất kho nguồn, chưa đến kho đích".

### Hướng giải quyết

**Cách tiếp cận: 2-phase transfer**

```
draft → waiting_approval → in_transit → posted
                                ↑
                        Kho nguồn đã xuất
                        Kho đích chưa nhận
```

**Bước A — Migration: thêm `in_transit` vào status enum**

```sql
ALTER TABLE stock_moves
  MODIFY status ENUM('draft','waiting_approval','in_transit','posted','cancelled');

-- Thêm bảng in-transit balance (optional, dùng để track)
CREATE TABLE stock_in_transit (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  stock_move_id   BIGINT NOT NULL UNIQUE,
  product_id      BIGINT NOT NULL,
  warehouse_from  BIGINT NOT NULL,
  warehouse_to    BIGINT NOT NULL,
  qty             DECIMAL(18,3) NOT NULL,
  dispatched_at   DATETIME NOT NULL,
  received_at     DATETIME NULL
);
```

**Bước B — Cập nhật `approveStockMove()`**

```typescript
case "transfer":
  // Phase 1: Approve = xuất kho nguồn + đưa vào in_transit
  await this.processTransferPhase1(move, lines, t);
  await move.update({ status: "in_transit", ... }, { transaction: t });
  break;
```

**Bước C — Thêm `receiveTransfer()` — Phase 2**

```typescript
async receiveTransfer(stockMoveId: number, user: any) {
  // Chỉ Warehouse Manager/Staff của kho ĐÍCH mới được nhận
  const move = await StockMove.findByPk(stockMoveId, { include: ["lines"] });
  if (move?.status !== "in_transit") throw { status: 400, message: "Chỉ nhận được phiếu đang in_transit" };
  if (move.type !== "transfer") throw { status: 400, message: "Chỉ áp dụng cho transfer" };
  
  const t = await sequelize.transaction();
  // Cộng kho đích
  await this.processTransferPhase2(move, move.lines, t);
  await move.update({ status: "posted", ... }, { transaction: t });
  await t.commit();
}

async processTransferPhase1(move, lines, t) {
  // Trừ kho nguồn
  for (const line of lines) {
    await this.updateStockBalance(move.warehouse_from_id, line.product_id, -actualQty, ..., t);
  }
  // Ghi vào in-transit
  for (const line of lines) {
    await StockInTransit.create({ stock_move_id: move.id, product_id: line.product_id, qty: actualQty, ... }, { transaction: t });
  }
}

async processTransferPhase2(move, lines, t) {
  // Cộng kho đích
  for (const line of lines) {
    await this.updateStockBalance(move.warehouse_to_id, line.product_id, +actualQty, ..., t);
  }
  // Xóa in-transit records
  await StockInTransit.destroy({ where: { stock_move_id: move.id }, transaction: t });
}
```

**Bước D — API endpoint mới**

- `POST /stock-moves/:id/receive` — Phase 2: nhận hàng tại kho đích

### Files cần sửa/tạo

#### [NEW] `src/migrations/YYYYMMDD-add-in-transit-to-stock-moves.js`
#### [NEW] `src/migrations/YYYYMMDD-create-stock-in-transit.js`
#### [NEW] `src/modules/inventory/models/stockInTransit.model.ts`
#### [MODIFY] [stockMove.model.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/models/stockMove.model.ts)
- Thêm `in_transit` vào status enum
#### [MODIFY] [stockMove.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/inventory/services/stockMove.service.ts)
- `approveStockMove()`: case "transfer" → phase 1 only, set `in_transit`
- Tách `processTransfer()` → `processTransferPhase1()` + `processTransferPhase2()`
- Thêm `receiveTransfer()`
#### [MODIFY] Route + Controller
- `POST /stock-moves/:id/receive`

---

## Thứ tự thực hiện đề xuất

```
Sprint 1 (ít rủi ro, không phụ thuộc nhau):
  P4 → P2 → I5

Sprint 2 (cần schema change):
  P1 → I2

Sprint 3 (phức tạp, có dependencies):
  I1 → I4
```

## Verification Plan

### Automated / Manual Tests

| Item | Cách verify |
|------|------------|
| P4 | Tạo PO với payment_term Net45 → createPartialFromPO() → kiểm tra due_date = invoice_date + 45 |
| P2 | Tạo invoice mismatch → approve() → nhận lỗi 422 → gọi override → approve lại → thành công |
| P1 | Cấu hình tolerance 1% → tạo invoice chênh 0.5% → matching_status = "matched" |
| I1 | Confirm SO 8 cái (tồn kho 10) → confirm SO 5 cái → nhận lỗi "Chỉ còn 2 khả dụng" |
| I2 | Cấu hình product lot_tracking='lot' → tạo receipt không có lot → nhận lỗi |
| I5 | Thủ kho submit PI → validate không được → quản lý approve → stock_balance cập nhật |
| I4 | Tạo transfer → approve → status=in_transit (kho nguồn trừ, kho đích chưa tăng) → receive → posted |

### Open Questions

> [!IMPORTANT]
> **I1 - Sale Order**: Sale Order confirm endpoint cụ thể ở đâu trong codebase? Và `warehouse_id` mặc định cho SO lấy từ đâu (branch config hay SO header field)?

> [!NOTE]
> **I4 - In-transit**: Kho đích có thể reject một phần không (nhận thiếu so với phiếu)? Hay luôn phải nhận đúng 100% số lượng trên phiếu?

> [!NOTE]
> **P1 - Tolerance**: Tolerance cấu hình ở cấp độ nào là đủ — Branch level (toàn chi nhánh) hay cần đến supplier/category level ngay từ đầu?
