# Implementation Plan V2 — ERP Backend & Frontend

> **File:** `erp-backend/docx/implementation-plan-v2.md`
> **Ngày lập:** 2026-04-16
> **Mục đích:** Kế hoạch triển khai chi tiết sau khi hoàn thành Schema V2
> **Trạng thái:** Pending

---

## Mục lục

1. [Bức tranh tổng thể](#1-bức-tranh-tổng-thể)
2. [Nhóm 1 — Hoàn thiện Product](#2-nhóm-1--hoàn-thiện-product)
3. [Nhóm 2 — Stock Location](#3-nhóm-2--stock-location)
4. [Nhóm 3 — Stock Lot](#4-nhóm-3--stock-lot)
5. [Nhóm 4 — Physical Inventory](#5-nhóm-4--physical-inventory)
6. [Nhóm 5 — Refactor Stock Balance Service](#6-nhóm-5--refactor-stock-balance-service)
7. [Nhóm 6 — Reports & Dashboard](#7-nhóm-6--reports--dashboard)
8. [Thứ tự thực hiện](#8-thứ-tự-thực-hiện)
9. [Tổng hợp file cần tạo/sửa](#9-tổng-hợp-file-cần-tạosửa)

---

## 1. Bức tranh tổng thể

Schema V2 đã thêm 5 bảng mới và nhiều cột mới vào các bảng hiện có. Tuy nhiên **chưa có service / controller / route / frontend nào** cho các tính năng đó. Toàn bộ công việc còn lại chia làm 6 nhóm:

| Nhóm | Tên                                     | Ưu tiên           |
| ---- | --------------------------------------- | ----------------- |
| 1    | Hoàn thiện Product (backend + frontend) | 🔴 Cao            |
| 2    | Stock Location (backend + frontend)     | 🔴 Cao            |
| 3    | Stock Lot — Truy xuất nguồn gốc         | 🟡 Trung bình     |
| 4    | Physical Inventory — Kiểm kê định kỳ    | 🟡 Trung bình     |
| 5    | Refactor Stock Balance Service          | 🔴 Cao (nền tảng) |
| 6    | Reports & Dashboard                     | 🟢 Thấp           |

> **Nguyên tắc:** Nhóm 5 (Stock Balance refactor) phải làm **trước hoặc song song** với Nhóm 2 và 3, vì location + lot ảnh hưởng trực tiếp đến cách cập nhật tồn kho.

---

## 2. Nhóm 1 — Hoàn thiện Product

### Hiện trạng

- `product.service.ts` vẫn dùng `uom` string cũ trong `attributes` của include
- Chưa có API nào cho `product_supplier_info`
- Form frontend chưa có field cho: `product_type`, `source_type`, `uom_id`, `purchase_uom_id`, `min_stock_qty`, `internal_ref`, `weight`, `volume`, `warranty_months`, `notes`

---

### 2.1 Backend

#### a. Cập nhật `product.service.ts`

```
- getAll() / getAllOnActive():
    include Uom as "uom"
    include Uom as "purchaseUom"
    bỏ attributes "uom" (string cũ), thêm "uom_id", "purchase_uom_id"

- getById(id):
    include Uom, ProductSupplierInfo (kèm Partner as "supplier")

- create(data):
    nhận thêm: uom_id, purchase_uom_id, product_type, source_type,
               min_stock_qty, internal_ref, weight, volume,
               warranty_months, notes

- update(id, data):
    tương tự create

- Validation:
    Nếu source_type = 'purchased' → cảnh báo nếu chưa có supplier info
    Nếu product_type = 'service' → không cho tạo stock move
```

#### b. Tạo mới `productSupplierInfo.service.ts`

```typescript
// Các method cần có:
getByProduct(productId: number)
create(data: ProductSupplierInfoDTO)
update(id: number, data: Partial<ProductSupplierInfoDTO>)
delete(id: number)
setPreferred(id: number, productId: number)
  // → set is_preferred = true cho record này
  // → set is_preferred = false cho tất cả record khác cùng product_id
```

#### c. Tạo mới `productSupplierInfo.controller.ts`

```
GET    /products/:productId/suppliers          — danh sách NCC của product
POST   /products/:productId/suppliers          — thêm NCC
PUT    /products/:productId/suppliers/:id      — sửa thông tin NCC
DELETE /products/:productId/suppliers/:id      — xóa NCC
PATCH  /products/:productId/suppliers/:id/set-preferred  — đặt làm ưu tiên
```

#### d. Cập nhật `product.routes.ts`

Thêm các route supplier info vào router của product.

---

### 2.2 Frontend

#### a. Cập nhật `CreateProductPage.tsx` / `EditProductPage.tsx`

Chia form thành **3 tab**:

**Tab 1 — Thông tin chung**

```
- Tên, SKU, Barcode (đã có)
- Danh mục (đã có)
- product_type: Select ["Storable", "Consumable", "Service"]
- source_type: Select ["Purchased", "Manufactured"]
  (chỉ hiện khi product_type ≠ 'service')
- uom_id: Select từ API GET /uoms
- purchase_uom_id: Select từ API GET /uoms (optional)
- min_stock_qty: Number input
- Giá vốn, giá bán, thuế (đã có)
- Trạng thái (đã có)
```

**Tab 2 — Thuộc tính**

```
- internal_ref: Text input
- weight: Number input (kg)
- volume: Number input (lít/m³)
- warranty_months: Number input (tháng)
- origin: Text input (đã có)
- notes: Textarea
- description: Textarea (đã có)
```

**Tab 3 — Nhà cung cấp** _(chỉ hiện khi source_type = 'purchased')_

```
- Bảng danh sách ProductSupplierInfo:
  Cột: Nhà cung cấp | Mã SP theo NCC | Giá | Tiền tệ | MOQ | Lead time | Ưu tiên
- Nút "Thêm NCC" → mở modal form
- Nút "Đặt làm ưu tiên" trên mỗi row
- Nút xóa trên mỗi row
```

#### b. Cập nhật `ProductsPage.tsx`

```
- Thêm cột "Loại" (product_type badge)
- Thêm cột "Nguồn" (source_type badge: NCC / Sản xuất)
- Filter dropdown: Lọc theo product_type, source_type
- Hiển thị UOM name thay vì uom_id
```

#### c. Tạo mới `ProductSupplierInfoModal.tsx`

```
Form fields:
- supplier_id: Select Partner (type = supplier)
- supplier_product_code: Text
- supplier_product_name: Text
- price: Number
- currency_id: Select Currency
- min_order_qty: Number
- lead_time_days: Number
- is_preferred: Checkbox
```

---

## 3. Nhóm 2 — Stock Location

Tính năng **hoàn toàn mới**, chưa có gì ở cả backend lẫn frontend.

### 3.1 Backend

#### a. Tạo `stockLocation.service.ts`

```typescript
getAll(warehouseId: number): StockLocation[]
  // Trả về danh sách phẳng, filter theo warehouse

getTree(warehouseId: number): StockLocationTree[]
  // Đệ quy build cây parent → children

getById(id: number): StockLocation

create(data: CreateLocationDTO): StockLocation
  // Tự build path:
  //   Nếu có parent: path = parent.path + "/" + data.code
  //   Nếu không có parent: path = "/" + data.code

update(id: number, data: UpdateLocationDTO): StockLocation
  // Nếu đổi parent_id → rebuild path của node này và tất cả children (đệ quy)

delete(id: number): void
  // Kiểm tra: không có stock_balance.location_id trỏ vào
  // Kiểm tra: không có stock_move_lines.location_from/to_id trỏ vào
  // Kiểm tra: không có children

getByType(warehouseId: number, type: StockLocationType): StockLocation[]
  // Lấy locations theo type (ví dụ: chỉ lấy type='internal' để chọn khi nhập kho)
```

#### b. Tạo `stockLocation.controller.ts`

```
GET    /warehouses/:warehouseId/locations         — danh sách phẳng
GET    /warehouses/:warehouseId/locations/tree    — dạng cây
GET    /locations/:id                             — chi tiết
POST   /locations                                 — tạo mới
PUT    /locations/:id                             — cập nhật
DELETE /locations/:id                             — xóa
GET    /warehouses/:warehouseId/locations/by-type/:type
```

#### c. Tạo `stockLocation.routes.ts`

Mount vào app.ts.

---

### 3.2 Frontend

#### a. Trang `StockLocationPage.tsx`

```
Layout:
- Sidebar trái: Tree view các location (dạng cây có thể expand/collapse)
  Mỗi node hiển thị: icon theo type, name, code, badge is_active
- Panel phải: Chi tiết location được chọn

Actions:
- Nút "Thêm vị trí" → mở form (có thể chọn parent)
- Nút sửa / xóa trên mỗi node
- Toggle is_active
```

#### b. Tích hợp vào `StockMovePages.tsx`

```
Mỗi dòng stock move line thêm:
- location_from_id: Select location (filter theo warehouse_from, type='internal'/'output')
- location_to_id: Select location (filter theo warehouse_to, type='internal'/'input')
```

---

## 4. Nhóm 3 — Stock Lot

### 4.1 Backend

#### a. Tạo `stockLot.service.ts`

```typescript
getAll(filters?: { productId?: number; supplierId?: number }): StockLot[]

getById(id: number): StockLot

getByProduct(productId: number): StockLot[]

create(data: CreateLotDTO): StockLot
  // Kiểm tra unique (product_id, lot_no)

update(id: number, data: UpdateLotDTO): StockLot

delete(id: number): void
  // Kiểm tra: không có stock_balance.lot_id trỏ vào
  // Kiểm tra: không có stock_move_lines.lot_id trỏ vào

getExpiringLots(days: number): StockLot[]
  // WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL days DAY
  // Dùng cho cảnh báo dashboard
```

#### b. Tạo `stockLot.controller.ts`

```
GET    /lots                        — tất cả, query: ?productId=&supplierId=
GET    /lots/:id
GET    /products/:productId/lots    — lots của 1 product
POST   /lots
PUT    /lots/:id
DELETE /lots/:id
GET    /lots/expiring?days=30       — cảnh báo hết hạn
```

#### c. Tích hợp vào Stock Move

```
stockMove.service.ts — createReceipt():
  Mỗi line có thể kèm lot_id (chọn lot có sẵn) hoặc newLot (tạo lot mới inline)
  Nếu newLot: tạo StockLot trước, lấy id, gán vào line

stockMove.service.ts — createIssue() / createTransfer():
  Nếu product có lot tracking → bắt buộc chọn lot_id
  Kiểm tra lot có đủ tồn kho không (query stock_balances với lot_id)

updateStockBalance() — xem Nhóm 5
```

---

### 4.2 Frontend

#### a. Trang `StockLotPage.tsx`

```
Bảng danh sách:
- Cột: Sản phẩm | Số lô | Serial | NSX | HSD | Nhà cung cấp | Ghi chú
- Badge màu đỏ nếu HSD < 30 ngày
- Badge màu cam nếu HSD < 90 ngày
- Filter: theo product, theo trạng thái hết hạn

Actions:
- Tạo lot thủ công
- Sửa / xóa
```

#### b. Tích hợp vào Stock Move Form

```
Mỗi dòng stock move line thêm:
- lot_id: Select lot (filter theo product_id)
  Hiển thị: lot_no + expiry_date
- Nút "Tạo lot mới" inline (chỉ khi receipt)
```

---

## 5. Nhóm 4 — Physical Inventory

### 5.1 Backend

#### a. Tạo `physicalInventory.service.ts`

```typescript
getAll(branchId: number): PhysicalInventory[]

getById(id: number): PhysicalInventory
  // include lines (kèm product, location, lot)

create(data: CreateInventoryDTO): PhysicalInventory
  // Tạo header với status = 'draft'

startInventory(id: number): PhysicalInventory
  // draft → in_progress
  // Tự động load theoretical_qty từ stock_balances:
  //   Với mỗi line: theoretical_qty = stock_balances.quantity
  //                 unit_cost = stock_balances.unit_cost

updateLine(lineId: number, counted_qty: number): PhysicalInventoryLine
  // Cập nhật counted_qty
  // Tự tính: difference_qty = counted_qty - theoretical_qty

validate(id: number, userId: number): PhysicalInventory
  // in_progress → validated
  // Với mỗi line có difference_qty ≠ 0:
  //   Tạo StockMove type='adjustment' tự động
  //   Cập nhật stock_balances (gọi updateStockBalance)
  // Set validated_by = userId, validated_at = NOW()

cancel(id: number): PhysicalInventory
  // draft | in_progress → cancelled
```

#### b. Tạo `physicalInventory.controller.ts`

```
GET    /physical-inventories                        — danh sách
GET    /physical-inventories/:id                    — chi tiết kèm lines
POST   /physical-inventories                        — tạo mới (draft)
POST   /physical-inventories/:id/start              — bắt đầu kiểm kê
PATCH  /physical-inventories/:id/lines/:lineId      — cập nhật counted_qty
POST   /physical-inventories/:id/validate           — xác nhận
POST   /physical-inventories/:id/cancel             — hủy
```

---

### 5.2 Frontend

#### a. Trang `PhysicalInventoryListPage.tsx`

```
Bảng:
- Cột: Số phiếu | Kho | Chi nhánh | Ngày | Trạng thái | Người tạo | Actions
- Status badge: draft (xám) | in_progress (xanh) | validated (xanh đậm) | cancelled (đỏ)
- Nút "Tạo phiếu kiểm kê"
```

#### b. Trang `PhysicalInventoryDetailPage.tsx`

```
Header section:
- Thông tin phiếu: inv_no, warehouse, branch, inv_date
- Status badge + action buttons theo trạng thái:
  draft:       [Bắt đầu kiểm kê] [Hủy]
  in_progress: [Xác nhận] [Hủy]
  validated:   [Xem Stock Adjustment]
  cancelled:   (read-only)

Lines table:
- Cột: Sản phẩm | Vị trí | Lô | Tồn lý thuyết | Tồn thực tế | Chênh lệch | Giá vốn
- Khi in_progress: cột "Tồn thực tế" là input có thể nhập
- Chênh lệch tự tính, màu đỏ nếu âm, màu xanh nếu dương
- Nút "Thêm dòng" (thêm product chưa có trong danh sách)
```

---

## 6. Nhóm 5 — Refactor Stock Balance Service

Đây là **nền tảng** cho Nhóm 2, 3, 4. Cần làm sớm.

### Hiện trạng

```typescript
// Hiện tại — chưa có location, lot, unit_cost
async updateStockBalance(warehouseId, productId, quantityChange) {
  // findOne({ warehouse_id, product_id })
  // ...
}
```

### Cần refactor thành

```typescript
interface UpdateStockBalanceParams {
  warehouseId: number;
  productId: number;
  locationId?: number | null;   // mới
  lotId?: number | null;        // mới
  quantityChange: number;
  unitCost?: number | null;     // mới — giá nhập vào (dùng cho receipt)
}

async updateStockBalance(params: UpdateStockBalanceParams): Promise<StockBalance>
```

### Logic Weighted Average Cost (WAC)

```
Khi nhập kho (quantityChange > 0):
  old_qty   = balance.quantity
  old_cost  = balance.unit_cost ?? 0
  new_qty   = old_qty + quantityChange
  new_cost  = (old_qty * old_cost + quantityChange * unitCost) / new_qty
  new_value = new_qty * new_cost

Khi xuất kho (quantityChange < 0):
  new_qty   = old_qty + quantityChange  (giảm)
  unit_cost = giữ nguyên (không đổi khi xuất)
  new_value = new_qty * unit_cost

Khi điều chỉnh (adjustment):
  Nếu tăng: tính WAC như nhập kho
  Nếu giảm: giữ unit_cost, chỉ giảm qty và value
```

### Cập nhật findByProductAndWarehouse

```typescript
// Cũ
findByProductAndWarehouse(productId, warehouseId)

// Mới — thêm locationId, lotId để tìm đúng record
findBalance({ warehouseId, productId, locationId?, lotId? })
```

---

## 7. Nhóm 6 — Reports & Dashboard

### 7.1 Backend

```
GET /reports/stock-summary
  Params: warehouseId?, productId?, categoryId?
  Response: [{ product, warehouse, location, lot, quantity, unit_cost, total_value }]

GET /reports/stock-valuation
  Params: warehouseId?, date?
  Response: Tổng giá trị tồn kho, breakdown theo category

GET /reports/stock-movement
  Params: productId?, warehouseId?, from, to
  Response: Lịch sử nhập/xuất theo khoảng thời gian

GET /reports/low-stock
  Response: Products có quantity < min_stock_qty

GET /reports/expiring-lots
  Params: days=30
  Response: Lots có expiry_date trong vòng N ngày
```

### 7.2 Frontend

#### Dashboard Inventory

```
Cards tổng quan:
- Tổng giá trị tồn kho
- Số sản phẩm dưới mức tối thiểu
- Số lot sắp hết hạn
- Số phiếu kho chờ duyệt

Biểu đồ:
- Line chart: Biến động tồn kho theo thời gian (7/30/90 ngày)
- Bar chart: Top 10 sản phẩm có giá trị tồn kho cao nhất

Bảng cảnh báo:
- Tồn kho thấp: product | warehouse | qty hiện tại | min_stock_qty
- Lot sắp hết hạn: product | lot_no | HSD | số ngày còn lại
```

---

## 8. Thứ tự thực hiện

```
Tuần 1
├── Nhóm 5: Refactor updateStockBalance (nền tảng)
└── Nhóm 1 Backend: product.service + productSupplierInfo API

Tuần 2
└── Nhóm 1 Frontend: Product form (3 tab) + ProductsPage filter

Tuần 3
├── Nhóm 2 Backend: stockLocation service + controller + routes
└── Nhóm 2 Frontend: StockLocationPage (tree view)

Tuần 4
├── Nhóm 3 Backend: stockLot service + controller + routes
├── Nhóm 3 Frontend: StockLotPage
└── Tích hợp location + lot vào Stock Move Form (FE + BE)

Tuần 5
├── Nhóm 4 Backend: physicalInventory service + controller + routes
└── Nhóm 4 Frontend: PhysicalInventory pages

Tuần 6
├── Nhóm 6 Backend: Reports APIs
└── Nhóm 6 Frontend: Dashboard + Charts
```

---

## 9. Tổng hợp file cần tạo/sửa

### Backend

| File                                                            | Trạng thái                  | Nhóm |
| --------------------------------------------------------------- | --------------------------- | ---- |
| `modules/product/services/product.service.ts`                   | Sửa                         | 1    |
| `modules/product/services/productSupplierInfo.service.ts`       | Tạo mới                     | 1    |
| `modules/product/controllers/productSupplierInfo.controller.ts` | Tạo mới                     | 1    |
| `modules/product/routes/product.routes.ts`                      | Sửa                         | 1    |
| `modules/inventory/services/stockBalance.service.ts`            | Sửa (refactor)              | 5    |
| `modules/inventory/services/stockLocation.service.ts`           | Tạo mới                     | 2    |
| `modules/inventory/controllers/stockLocation.controller.ts`     | Tạo mới                     | 2    |
| `modules/inventory/routes/stockLocation.routes.ts`              | Tạo mới                     | 2    |
| `modules/inventory/services/stockLot.service.ts`                | Tạo mới                     | 3    |
| `modules/inventory/controllers/stockLot.controller.ts`          | Tạo mới                     | 3    |
| `modules/inventory/routes/stockLot.routes.ts`                   | Tạo mới                     | 3    |
| `modules/inventory/services/stockMove.service.ts`               | Sửa (tích hợp lot/location) | 3    |
| `modules/inventory/services/physicalInventory.service.ts`       | Tạo mới                     | 4    |
| `modules/inventory/controllers/physicalInventory.controller.ts` | Tạo mới                     | 4    |
| `modules/inventory/routes/physicalInventory.routes.ts`          | Tạo mới                     | 4    |
| `modules/reports/controllers/inventory.report.controller.ts`    | Tạo mới                     | 6    |
| `modules/reports/routes.ts`                                     | Sửa                         | 6    |

### Frontend

| File                                                        | Trạng thái                  | Nhóm |
| ----------------------------------------------------------- | --------------------------- | ---- |
| `features/products/pages/CreateProductPage.tsx`             | Sửa (3 tab)                 | 1    |
| `features/products/pages/EditProductPage.tsx`               | Sửa (3 tab)                 | 1    |
| `features/products/pages/ProductsPage.tsx`                  | Sửa (filter, cột mới)       | 1    |
| `features/products/components/ProductSupplierInfoModal.tsx` | Tạo mới                     | 1    |
| `features/products/api/productSupplierInfo.api.ts`          | Tạo mới                     | 1    |
| `features/inventory/pages/StockLocationPage.tsx`            | Tạo mới                     | 2    |
| `features/inventory/api/stockLocation.api.ts`               | Tạo mới                     | 2    |
| `features/inventory/pages/StockMovePages.tsx`               | Sửa (location + lot fields) | 2, 3 |
| `features/inventory/pages/StockLotPage.tsx`                 | Tạo mới                     | 3    |
| `features/inventory/api/stockLot.api.ts`                    | Tạo mới                     | 3    |
| `features/inventory/pages/PhysicalInventoryListPage.tsx`    | Tạo mới                     | 4    |
| `features/inventory/pages/PhysicalInventoryDetailPage.tsx`  | Tạo mới                     | 4    |
| `features/inventory/api/physicalInventory.api.ts`           | Tạo mới                     | 4    |
| `features/inventory/InventoryDashboard.tsx`                 | Sửa (thêm cards, charts)    | 6    |
| `features/reports/pages/StockReportPage.tsx`                | Tạo mới                     | 6    |

---

_Tài liệu này được tạo ngày 2026-04-16. Cập nhật khi có thay đổi kế hoạch._
