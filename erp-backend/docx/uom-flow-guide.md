# Hướng dẫn luồng UOM (Unit of Measure) trong hệ thống ERP

> **Mục đích:** Tài liệu này giải thích cách hệ thống quản lý đơn vị tính (UOM) xuyên suốt các nghiệp vụ: tạo sản phẩm, mua hàng, nhập kho, chuyển kho, kiểm kê, xuất kho và hóa đơn.

---

## Ví dụ thực tế: Nước suối Lavie 500ml

Nhà cung cấp bán theo **thùng**, kho lưu theo **chai**. Đây là trường hợp điển hình cần quản lý UOM đúng cách.

---

## Bước 0: Setup dữ liệu nền

### Bảng `uoms` — Danh mục đơn vị tính

| id  | code  | name            |
| --- | ----- | --------------- |
| 1   | CHAI  | Chai            |
| 2   | THUNG | Thùng (24 chai) |
| 3   | KG    | Kilogram        |

### Bảng `uom_conversions` — Quy tắc quy đổi

| from_uom_id | to_uom_id | factor |
| ----------- | --------- | ------ |
| 2 (THUNG)   | 1 (CHAI)  | 24     |

> **Đọc là:** 1 Thùng = 24 Chai

---

## Bước 1: Tạo Product

```
products:
  sku        = "LAV500"
  name       = "Nước suối Lavie 500ml"
  uom_id     = 1 (CHAI)   ← đơn vị lưu kho (stock UOM)
  cost_price = 7,000       ← giá nhập 1 chai
  sale_price = 10,000      ← giá bán 1 chai
```

> ⚠️ **Quan trọng:** `uom_id` trên product là **Stock UOM** — đơn vị chuẩn để tính tồn kho.
> Mọi giao dịch kho đều phải quy về đơn vị này.

---

## Bước 2: Tạo Purchase Order — Mua 10 thùng

Người mua nhập: **10 thùng**, đơn giá **168,000đ/thùng**.

```
purchase_order_lines:
  product_id       = LAV500
  quantity         = 10           ← 10 thùng (purchase UOM)
  uom_id           = 2 (THUNG)    ← đơn vị mua
  qty_in_stock_uom = 240          ← 10 × 24 = 240 chai (hệ thống tự tính)
  unit_price       = 168,000      ← giá 1 thùng
  line_total       = 1,680,000
```

> 💡 `qty_in_stock_uom` được tính tự động bằng cách tra bảng `uom_conversions`.
> Nếu không có conversion → `qty_in_stock_uom = quantity` (giữ nguyên).

---

## Bước 3: Nhập hàng → Tạo Stock Move

Khi xác nhận nhận hàng, hệ thống tạo phiếu nhập kho dùng `qty_in_stock_uom`:

```
stock_moves:
  reference_type = "purchase_order"
  reference_id   = PO_ID
  move_type      = "in"
  status         = "posted"

stock_move_lines:
  product_id = LAV500
  quantity   = 240        ← lấy từ qty_in_stock_uom, KHÔNG phải 10
  uom_id     = 1 (CHAI)   ← luôn là stock UOM
```

**Tồn kho sau nhập:**

```
stock_balances:
  product_id = LAV500
  warehouse  = Kho A
  quantity   = 240 CHAI
```

---

## Bước 4: Chuyển kho (Transfer)

Chuyển 2 thùng (= 48 chai) từ Kho A → Kho B.

> UI cho phép nhập "2 thùng" → tự convert → lưu 48 chai.

```
stock_move_lines:
  product_id    = LAV500
  quantity      = 48        ← đã quy đổi về stock UOM
  uom_id        = 1 (CHAI)
  from_location = Kho A
  to_location   = Kho B
```

**Tồn kho sau chuyển:**

```
Kho A: 192 CHAI
Kho B:  48 CHAI
```

---

## Bước 5: Kiểm kê (Inventory Adjustment)

Đếm thực tế Kho A chỉ còn 190 chai (mất 2 chai).

```
stock_moves:
  move_type = "adjustment"

stock_move_lines:
  product_id = LAV500
  quantity   = -2          ← điều chỉnh âm (hao hụt)
  uom_id     = 1 (CHAI)
```

**Tồn kho sau kiểm kê:**

```
Kho A: 190 CHAI
```

---

## Bước 6: Xuất kho bán hàng

Bán 5 thùng (= 120 chai) cho khách hàng.

```
sale_order_lines:
  product_id       = LAV500
  quantity         = 5            ← 5 thùng (sale UOM)
  uom_id           = 2 (THUNG)
  qty_in_stock_uom = 120          ← 5 × 24 (tự tính)
  unit_price       = 240,000      ← giá bán 1 thùng

stock_move_lines (xuất):
  product_id = LAV500
  quantity   = -120        ← trừ kho theo stock UOM
  uom_id     = 1 (CHAI)
```

**Tồn kho sau xuất:**

```
Kho A: 70 CHAI
```

---

## Bước 7: AP Invoice — Hóa đơn nhà cung cấp

Invoice từ nhà cung cấp cho 10 thùng đã mua:

```
ap_invoice_lines:
  product_id = LAV500
  quantity   = 10           ← giữ nguyên đơn vị mua (thùng)
  uom_id     = 2 (THUNG)
  unit_price = 168,000
  line_total = 1,680,000
```

> AP Invoice giữ nguyên purchase UOM để **khớp với PO** khi đối chiếu 3-way matching.
> Không cần convert vì đây là chứng từ tài chính.

---

## Bước 8: AR Invoice — Hóa đơn bán hàng

```
ar_invoice_lines:
  product_id = LAV500
  quantity   = 5            ← đơn vị bán (thùng)
  uom_id     = 2 (THUNG)
  unit_price = 240,000
  line_total = 1,200,000
```

---

## Tổng kết: Nguyên tắc UOM theo từng nghiệp vụ

| Nghiệp vụ    | Bảng                        | UOM dùng                  | Ghi chú              |
| ------------ | --------------------------- | ------------------------- | -------------------- |
| Tạo sản phẩm | `products.uom_id`           | **Stock UOM** (CHAI)      | Đơn vị chuẩn tồn kho |
| Tạo PO       | `po_lines.uom_id`           | **Purchase UOM** (THUNG)  | Đơn vị nhà cung cấp  |
| Tạo PO       | `po_lines.qty_in_stock_uom` | Stock UOM (240)           | Hệ thống tự tính     |
| Nhập kho     | `stock_move_lines.uom_id`   | **Stock UOM** (CHAI)      | Luôn quy về chuẩn    |
| Chuyển kho   | `stock_move_lines.uom_id`   | **Stock UOM** (CHAI)      | Luôn quy về chuẩn    |
| Kiểm kê      | `stock_move_lines.uom_id`   | **Stock UOM** (CHAI)      | Luôn quy về chuẩn    |
| Tồn kho      | `stock_balances.quantity`   | **Stock UOM** (CHAI)      | Tồn kho thực tế      |
| Bán hàng     | `so_lines.uom_id`           | **Sale UOM** (THUNG/CHAI) | Theo hợp đồng        |
| AP Invoice   | `ap_invoice_lines.uom_id`   | **Purchase UOM** (THUNG)  | Khớp với PO          |
| AR Invoice   | `ar_invoice_lines.uom_id`   | **Sale UOM** (THUNG/CHAI) | Khớp với SO          |

---

## Quy tắc vàng

> **Chỉ có `stock_move_lines` và `stock_balances` luôn dùng Stock UOM.**
>
> Mọi chứng từ khác (PO, SO, Invoice) dùng UOM theo nghiệp vụ, nhưng **bắt buộc phải có `qty_in_stock_uom`** để hệ thống biết cần cộng/trừ kho bao nhiêu.

### Công thức quy đổi

```
qty_in_stock_uom = quantity × factor
```

Trong đó `factor` lấy từ bảng `uom_conversions` với `from_uom_id = purchase_uom` và `to_uom_id = stock_uom`.

Nếu không tìm thấy conversion thuận, hệ thống thử chiều ngược lại:

```
qty_in_stock_uom = quantity / reverse_factor
```

Nếu không có conversion nào → `qty_in_stock_uom = quantity` (coi như cùng đơn vị).

---

## Lưu ý khi phát triển

1. **Khi tạo/sửa PO line hoặc SO line:** Luôn gọi `resolveQtyInStockUom()` để tính lại `qty_in_stock_uom`.
2. **Khi tạo stock move từ PO:** Dùng `qty_in_stock_uom`, không dùng `quantity`.
3. **Khi hiển thị tồn kho:** Luôn kèm đơn vị (VD: "190 Chai"), không hiển thị số trần.
4. **Khi thêm UOM mới:** Nhớ tạo conversion tương ứng trong `uom_conversions`.
5. **Invoice:** Giữ nguyên UOM của chứng từ gốc (PO/SO) để đối chiếu dễ dàng.

---

_Tài liệu được tạo ngày 30/04/2026 — ERP Mini Project_
