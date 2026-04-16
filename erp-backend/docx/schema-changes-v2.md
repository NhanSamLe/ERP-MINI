# Schema Changes V2 — ERP Backend

> **Ngày lập:** 2026-04-16  
> **Tác giả:** Dev Team  
> **Trạng thái:** Pending Implementation  
> **Branch liên quan:** feature/schema-v2

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Products](#2-products)
3. [Purchase Order Line](#3-purchase-order-line)
4. [Stock Balance](#4-stock-balance)
5. [Stock Locations (Bảng mới)](#5-stock-locations-bảng-mới)
6. [Stock Move Lines](#6-stock-move-lines)
7. [Stock Lots — Truy xuất nguồn gốc (Bảng mới)](#7-stock-lots--truy-xuất-nguồn-gốc-bảng-mới)
8. [Physical Inventories — Kiểm kê định kỳ (Bảng mới)](#8-physical-inventories--kiểm-kê-định-kỳ-bảng-mới)
9. [Physical Inventory Lines (Bảng mới)](#9-physical-inventory-lines-bảng-mới)
10. [Stock Moves — Cập nhật ENUM](#10-stock-moves--cập-nhật-enum)
11. [Thứ tự chạy Migration](#11-thứ-tự-chạy-migration)
12. [Impact — Files cần cập nhật](#12-impact--files-cần-cập-nhật)

---

## 1. Tổng quan

Đây là tài liệu mô tả toàn bộ thay đổi schema database trong phiên bản V2 của ERP Backend. Các thay đổi tập trung vào:

- Nâng cấp module **Product**: chuẩn hóa UOM, thêm loại sản phẩm, thông tin nhà cung cấp
- Nâng cấp module **Inventory**: thêm vị trí kho (Location), truy xuất nguồn gốc (Lot/Serial), kiểm kê định kỳ
- Bổ sung **chiết khấu** cho Purchase Order Line
- Thêm **giá vốn** vào Stock Balance

### Thống kê thay đổi

| Loại thay đổi                 | Số lượng |
| ----------------------------- | -------- |
| Bảng mới                      | 5        |
| Bảng ALTER (thêm cột)         | 4        |
| Bảng ALTER (đổi ENUM)         | 1        |
| Migration files               | ~12      |
| Model TypeScript cần cập nhật | ~9       |

---

## 2. Products

### 2.1 Chuyển `uom` từ STRING → `uom_id` + `purchase_uom_id`

**Lý do:** Cột `uom` hiện tại là chuỗi tự do (`VARCHAR(50)`), không liên kết với bảng `uoms`. Việc này gây khó khăn khi cần convert đơn vị và không đảm bảo tính nhất quán dữ liệu.

| Thay đổi | Chi tiết                                       |
| -------- | ---------------------------------------------- |
| Xóa cột  | `uom VARCHAR(50)`                              |
| Thêm cột | `uom_id BIGINT NULL` → FK → `uoms.id`          |
| Thêm cột | `purchase_uom_id BIGINT NULL` → FK → `uoms.id` |

- `uom_id`: Đơn vị tính dùng khi bán hàng / xuất kho
- `purchase_uom_id`: Đơn vị tính khi mua hàng (có thể khác `uom_id`, ví dụ mua theo thùng, bán theo cái)
- Nếu `purchase_uom_id` là NULL thì mặc định dùng `uom_id`

> ⚠️ **Breaking change**: `stock_move_lines.uom` (STRING) cũng cần được chuyển sang `uom_id` trong cùng đợt này.

### 2.2 Thêm cột `product_type`

| Cột            | Kiểu                                      | Default      | Mô tả         |
| -------------- | ----------------------------------------- | ------------ | ------------- |
| `product_type` | `ENUM('storable','consumable','service')` | `'storable'` | Loại sản phẩm |

- `storable`: Hàng hóa có theo dõi tồn kho (nhập/xuất kho tạo stock move)
- `consumable`: Hàng tiêu hao, không theo dõi tồn kho chi tiết
- `service`: Dịch vụ, không tạo stock move

### 2.3 Thêm cột `min_stock_qty`

| Cột             | Kiểu            | Default | Mô tả                                                              |
| --------------- | --------------- | ------- | ------------------------------------------------------------------ |
| `min_stock_qty` | `DECIMAL(18,3)` | `0`     | Tồn kho tối thiểu — dùng để cảnh báo khi tồn kho xuống dưới ngưỡng |

### 2.4 Tạo bảng `product_supplier_info`

Lưu thông tin nhà cung cấp theo từng sản phẩm. Một sản phẩm có thể có nhiều nhà cung cấp.

```
product_supplier_info
├── id                    BIGINT PK AUTO_INCREMENT
├── product_id            BIGINT NOT NULL  → FK products.id (CASCADE DELETE)
├── supplier_id           BIGINT NOT NULL  → FK partners.id (CASCADE DELETE)
├── supplier_product_code VARCHAR(100)     -- Mã sản phẩm theo nhà cung cấp
├── supplier_product_name VARCHAR(255)     -- Tên sản phẩm theo nhà cung cấp
├── min_order_qty         DECIMAL(18,3)    -- Số lượng đặt hàng tối thiểu
├── lead_time_days        INT              -- Thời gian giao hàng (ngày)
├── price                 DECIMAL(18,2)   -- Giá mua từ nhà cung cấp
├── currency_id           BIGINT          → FK currencies.id
├── is_preferred          BOOLEAN DEFAULT false -- Nhà cung cấp ưu tiên
├── created_at            DATETIME
└── updated_at            DATETIME

UNIQUE KEY uq_product_supplier (product_id, supplier_id)
```

### 2.5 Thêm các thuộc tính bổ sung

| Cột               | Kiểu            | Nullable | Mô tả                      |
| ----------------- | --------------- | -------- | -------------------------- |
| `internal_ref`    | `VARCHAR(100)`  | YES      | Mã tham chiếu nội bộ       |
| `weight`          | `DECIMAL(10,3)` | YES      | Trọng lượng (kg)           |
| `volume`          | `DECIMAL(10,3)` | YES      | Thể tích (lít hoặc m³)     |
| `warranty_months` | `INT`           | YES      | Thời gian bảo hành (tháng) |
| `notes`           | `TEXT`          | YES      | Ghi chú tự do              |

---

## 3. Purchase Order Line

### 3.1 Thêm cột `discount`

| Cột        | Kiểu           | Default | Mô tả                                |
| ---------- | -------------- | ------- | ------------------------------------ |
| `discount` | `DECIMAL(5,2)` | `0`     | Chiết khấu theo % trên dòng đặt hàng |

**Công thức tính lại `line_total`:**

```
line_total = quantity × unit_price × (1 - discount / 100)
line_tax   = line_total × tax_rate
line_total_after_tax = line_total + line_tax
```

---

## 4. Stock Balance

### 4.1 Thêm `unit_cost` — Giá vốn đơn vị

| Cột         | Kiểu            | Default | Mô tả                                                                     |
| ----------- | --------------- | ------- | ------------------------------------------------------------------------- |
| `unit_cost` | `DECIMAL(18,4)` | `0`     | Giá vốn đơn vị hiện tại (dùng 4 chữ số thập phân để đảm bảo độ chính xác) |

### 4.2 Thêm `total_value` — Tổng giá trị tồn kho

| Cột           | Kiểu            | Default | Mô tả                                 |
| ------------- | --------------- | ------- | ------------------------------------- |
| `total_value` | `DECIMAL(18,2)` | `0`     | Tổng giá trị = `quantity × unit_cost` |

> **Lưu ý:** `total_value` được lưu vào DB (không phải computed column) để tối ưu query báo cáo. Service chịu trách nhiệm cập nhật giá trị này mỗi khi `quantity` hoặc `unit_cost` thay đổi.

> ⚠️ **Unique key thay đổi:** Khi thêm `location_id` (mục 6) và `lot_id` (mục 8), unique key của bảng này sẽ được cập nhật theo từng bước:
>
> - Hiện tại: `UNIQUE (warehouse_id, product_id)`
> - Sau mục 6: `UNIQUE (warehouse_id, product_id, location_id)`
> - Sau mục 8: `UNIQUE (warehouse_id, product_id, location_id, lot_id)`

---

## 5. Stock Locations (Bảng mới)

Quản lý vị trí lưu trữ trong kho theo cấu trúc cây (parent-child). Cho phép định nghĩa chi tiết từng kệ, ngăn, tầng trong kho.

```
stock_locations
├── id             BIGINT PK AUTO_INCREMENT
├── warehouse_id   BIGINT NOT NULL  → FK warehouses.id (CASCADE DELETE)
├── parent_id      BIGINT NULL      → FK stock_locations.id (self-reference)
├── name           VARCHAR(100) NOT NULL
├── code           VARCHAR(50) UNIQUE NOT NULL
├── type           ENUM('view','internal','input','output','customer','supplier','transit') NOT NULL
├── is_active      BOOLEAN DEFAULT true
├── path           VARCHAR(500)     -- Đường dẫn đầy đủ, ví dụ: "/WH/Input/Shelf-A/Row-1"
├── created_at     DATETIME
└── updated_at     DATETIME
```

**Giải thích `type`:**

| Giá trị    | Mô tả                                              |
| ---------- | -------------------------------------------------- |
| `view`     | Nhóm ảo, không lưu hàng thực tế (dùng để phân cấp) |
| `internal` | Vị trí lưu trữ thực tế trong kho                   |
| `input`    | Vị trí nhận hàng vào (receiving dock)              |
| `output`   | Vị trí xuất hàng ra (shipping dock)                |
| `customer` | Vị trí ảo đại diện cho khách hàng                  |
| `supplier` | Vị trí ảo đại diện cho nhà cung cấp                |
| `transit`  | Vị trí trung chuyển giữa các kho                   |

---

## 6. Stock Move Lines

### 6.1 Thêm `location_from_id` và `location_to_id`

| Cột                | Kiểu     | Nullable | Mô tả                                      |
| ------------------ | -------- | -------- | ------------------------------------------ |
| `location_from_id` | `BIGINT` | YES      | Vị trí xuất hàng → FK `stock_locations.id` |
| `location_to_id`   | `BIGINT` | YES      | Vị trí nhận hàng → FK `stock_locations.id` |

> **Phụ thuộc:** Migration tạo `stock_locations` (mục 5) phải chạy trước.

### 6.2 Chuyển `uom` STRING → `uom_id`

| Thay đổi | Chi tiết                              |
| -------- | ------------------------------------- |
| Xóa cột  | `uom VARCHAR(50)`                     |
| Thêm cột | `uom_id BIGINT NULL` → FK → `uoms.id` |

---

## 7. Stock Lots — Truy xuất nguồn gốc (Bảng mới)

Quản lý Lot Number và Serial Number để truy xuất nguồn gốc hàng hóa.

```
stock_lots
├── id               BIGINT PK AUTO_INCREMENT
├── product_id       BIGINT NOT NULL  → FK products.id (CASCADE DELETE)
├── lot_no           VARCHAR(100) NOT NULL   -- Số lô hàng
├── serial_no        VARCHAR(100) NULL       -- Số serial (nếu theo dõi từng cái)
├── manufacture_date DATE NULL              -- Ngày sản xuất
├── expiry_date      DATE NULL              -- Ngày hết hạn
├── supplier_id      BIGINT NULL  → FK partners.id (SET NULL)
├── notes            TEXT NULL
├── created_at       DATETIME
└── updated_at       DATETIME

UNIQUE KEY uq_lot (product_id, lot_no)
```

> **Lưu ý:** Nếu sản phẩm theo dõi theo Serial Number (từng cái riêng lẻ), mỗi serial là 1 row với `lot_no = serial_no`. Nếu theo dõi theo Lot (cả lô), nhiều đơn vị dùng chung 1 `lot_no`.

---

## 8. Thêm `lot_id` vào Stock Move Lines và Stock Balances

### 8.1 `stock_move_lines`

| Cột      | Kiểu     | Nullable | Mô tả                           |
| -------- | -------- | -------- | ------------------------------- |
| `lot_id` | `BIGINT` | YES      | FK → `stock_lots.id` (SET NULL) |

### 8.2 `stock_balances`

| Cột      | Kiểu     | Nullable | Mô tả                           |
| -------- | -------- | -------- | ------------------------------- |
| `lot_id` | `BIGINT` | YES      | FK → `stock_lots.id` (SET NULL) |

> **Phụ thuộc:** Migration tạo `stock_lots` (mục 7) phải chạy trước.  
> **Unique key** của `stock_balances` sau bước này: `UNIQUE (warehouse_id, product_id, location_id, lot_id)`

---

## 9. Physical Inventories — Kiểm kê định kỳ (Bảng mới)

Header của phiếu kiểm kê kho.

```
physical_inventories
├── id             BIGINT PK AUTO_INCREMENT
├── inv_no         VARCHAR(50) UNIQUE NOT NULL  -- Số phiếu kiểm kê
├── warehouse_id   BIGINT NOT NULL  → FK warehouses.id
├── branch_id      BIGINT NOT NULL  → FK branches.id
├── inv_date       DATE NOT NULL               -- Ngày kiểm kê
├── status         ENUM('draft','in_progress','validated','cancelled') DEFAULT 'draft'
├── created_by     BIGINT NOT NULL  → FK users.id
├── validated_by   BIGINT NULL      → FK users.id
├── validated_at   DATETIME NULL
├── created_at     DATETIME
└── updated_at     DATETIME
```

**Luồng trạng thái:**

```
draft → in_progress → validated
  └──────────────────→ cancelled
```

---

## 10. Physical Inventory Lines (Bảng mới)

Chi tiết từng dòng sản phẩm trong phiếu kiểm kê.

```
physical_inventory_lines
├── id               BIGINT PK AUTO_INCREMENT
├── inventory_id     BIGINT NOT NULL  → FK physical_inventories.id (CASCADE DELETE)
├── product_id       BIGINT NOT NULL  → FK products.id
├── location_id      BIGINT NULL      → FK stock_locations.id
├── lot_id           BIGINT NULL      → FK stock_lots.id
├── theoretical_qty  DECIMAL(18,3) DEFAULT 0  -- Tồn kho lý thuyết (lấy từ stock_balances)
├── counted_qty      DECIMAL(18,3) DEFAULT 0  -- Số lượng đếm thực tế
├── difference_qty   DECIMAL(18,3) DEFAULT 0  -- = counted_qty - theoretical_qty (tính bởi service)
├── unit_cost        DECIMAL(18,4)            -- Giá vốn tại thời điểm kiểm kê
├── created_at       DATETIME
└── updated_at       DATETIME
```

> **Lưu ý:** `difference_qty` được tính và lưu bởi service (không dùng GENERATED COLUMN để tránh phức tạp với MySQL). Khi `validated`, hệ thống tự động tạo stock adjustment move để điều chỉnh tồn kho theo `difference_qty`.

---

## 11. Thứ tự chạy Migration

Thứ tự này bắt buộc phải tuân theo do ràng buộc Foreign Key:

```
Bước  | Migration file                                          | Phụ thuộc
------|--------------------------------------------------------|------------------
 1    | alter-products-v2                                       | —
      |   - xóa uom STRING                                     |
      |   - thêm uom_id, purchase_uom_id                       |
      |   - thêm product_type, min_stock_qty                   |
      |   - thêm internal_ref, weight, volume,                 |
      |     warranty_months, notes                             |
 2    | create-product-supplier-info                           | products, partners, currencies
 3    | add-discount-to-purchase-order-lines                   | —
 4    | add-cost-fields-to-stock-balances                      | —
      |   - thêm unit_cost, total_value                        |
 5    | create-stock-locations                                 | warehouses
 6    | update-stock-move-lines-v2                             | stock_locations, uoms
      |   - xóa uom STRING                                     |
      |   - thêm uom_id                                        |
      |   - thêm location_from_id, location_to_id              |
 7    | add-location-to-stock-balances                         | stock_locations
      |   - thêm location_id                                   |
      |   - cập nhật unique key                                |
 8    | create-stock-lots                                      | products, partners
 9    | add-lot-id-to-stock-lines-and-balances                 | stock_lots
      |   - stock_move_lines: thêm lot_id                      |
      |   - stock_balances: thêm lot_id + cập nhật unique key  |
10    | create-physical-inventories                            | warehouses, branches, users
11    | create-physical-inventory-lines                        | physical_inventories,
      |                                                         | products, stock_locations,
      |                                                         | stock_lots
12    | update-stock-moves-type-enum                           | —
      |   - thêm 'scrap' vào ENUM type                         |
```

---

## 12. Impact — Files cần cập nhật

### Models TypeScript

| File                                                          | Thay đổi                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/product/models/product.model.ts`                 | Xóa `uom`, thêm `uom_id`, `purchase_uom_id`, `product_type`, `min_stock_qty`, `internal_ref`, `weight`, `volume`, `warranty_months`, `notes` |
| `src/modules/product/models/productSupplierInfo.model.ts`     | **Tạo mới**                                                                                                                                  |
| `src/modules/purchase/models/purchaseOrderLine.model.ts`      | Thêm `discount`                                                                                                                              |
| `src/modules/inventory/models/stockBalance.model.ts`          | Thêm `unit_cost`, `total_value`, `location_id`, `lot_id`                                                                                     |
| `src/modules/inventory/models/stockMoveLine.model.ts`         | Xóa `uom`, thêm `uom_id`, `location_from_id`, `location_to_id`, `lot_id`                                                                     |
| `src/modules/inventory/models/stockMove.model.ts`             | Cập nhật ENUM `type` thêm `'scrap'`                                                                                                          |
| `src/modules/inventory/models/stockLocation.model.ts`         | **Tạo mới**                                                                                                                                  |
| `src/modules/inventory/models/stockLot.model.ts`              | **Tạo mới**                                                                                                                                  |
| `src/modules/inventory/models/physicalInventory.model.ts`     | **Tạo mới**                                                                                                                                  |
| `src/modules/inventory/models/physicalInventoryLine.model.ts` | **Tạo mới**                                                                                                                                  |

### Services cần cập nhật

| File                                                     | Lý do                                                    |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `src/modules/product/services/product.service.ts`        | `uom` → `uom_id`                                         |
| `src/modules/inventory/services/stockMove.service.ts`    | `uom` → `uom_id`, thêm location logic                    |
| `src/modules/inventory/services/stockBalance.service.ts` | Thêm `unit_cost`, `total_value`, `location_id`, `lot_id` |
| `src/modules/purchase/services/purchaseOrder.service.ts` | Tính lại `line_total` với `discount`                     |

### Associations

| File                         | Thay đổi                         |
| ---------------------------- | -------------------------------- |
| `src/models/associations.ts` | Thêm associations cho 5 bảng mới |
| `src/models/index.ts`        | Export 5 model mới               |

---

_Tài liệu này được tạo tự động từ phân tích schema. Cập nhật lần cuối: 2026-04-16._
