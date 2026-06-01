# Purchase Module — Workflow Analysis
> Phân tích workflow trước/sau khi bổ sung, lý do thêm, và giao diện cần bổ sung
> Ngày: 2026-05-10

---

## Mục lục
1. [Workflow tổng thể — Trước vs Sau](#1-workflow-tổng-thể)
2. [RFQ — Request for Quotation](#2-rfq)
3. [Purchase Order — Bổ sung fields](#3-purchase-order)
4. [AP Invoice — Bổ sung fields](#4-ap-invoice)
5. [AP Payment — Bổ sung fields](#5-ap-payment)
6. [Purchase Return / Debit Note / Vendor Refund](#6-purchase-return)
7. [Tổng hợp giao diện cần bổ sung](#7-giao-diện)

---

## 1. Workflow tổng thể

### TRƯỚC KHI BỔ SUNG
```
Nhân viên mua hàng nhận yêu cầu
        ↓
Tạo thẳng Purchase Order (PO)
        ↓
Nhận hàng vào kho (GRN - stock move)
        ↓
Nhận hóa đơn từ NCC → Tạo AP Invoice thủ công
        ↓
Tạo AP Payment → Phân bổ vào Invoice
        ↓
        ✅ XONG

Khi có vấn đề (hàng lỗi, sai giá...):
        ↓
❌ Không có quy trình → xử lý ngoài hệ thống
   (gọi điện NCC, ghi chú tay, không có chứng từ)
```

**Vấn đề thực tế:**
- Không biết đã hỏi giá NCC nào, giá nào tốt nhất
- Không track được hàng đã nhận bao nhiêu / còn thiếu bao nhiêu trên từng PO
- Không biết PO đã lập hóa đơn chưa, lập thiếu hay đủ
- Thanh toán xong không biết còn dư tiền không, đã phân bổ hết chưa
- Hàng lỗi trả NCC → không có chứng từ → không giảm được công nợ phải trả

---

### SAU KHI BỔ SUNG
```
Nhân viên mua hàng nhận yêu cầu
        ↓
Tạo RFQ → Gửi cho 1 hoặc nhiều NCC
        ↓
Nhận báo giá → So sánh → Chọn NCC tốt nhất
        ↓
Convert RFQ → Purchase Order (1 click)
        ↓
PO tự động track: receipt_status / invoice_status
        ↓
Nhận hàng → GRN → PO line qty_received tự cập nhật
        ↓
Nhận hóa đơn NCC → AP Invoice (manual hoặc OCR)
        ↓
AP Invoice tự track: paid_amount / status (partially_paid → paid)
        ↓
AP Payment → Phân bổ → allocation_status tự cập nhật
        ↓
        ✅ XONG — toàn bộ có chứng từ, track được

Khi có vấn đề (hàng lỗi, sai giá...):
        ↓
Tạo Purchase Return Authorization (PRA) — xin phép trả hàng
        ↓
Duyệt PRA → Tạo Purchase Return — xuất kho trả NCC
        ↓
Tạo AP Debit Note — giảm công nợ phải trả NCC
        ↓
NCC hoàn tiền → Tạo Vendor Refund
        ↓
        ✅ Toàn bộ có chứng từ kế toán
```

---

## 2. RFQ — Request for Quotation

### Tại sao cần?

**Trước:** Nhân viên mua hàng nhớ giá trong đầu hoặc hỏi qua Zalo/email rồi tạo PO luôn.
Hệ thống không biết: đã hỏi NCC nào, giá nào, điều kiện giao hàng ra sao.

**Sau:** Mọi báo giá đều có chứng từ trong hệ thống. Manager có thể xem lại lịch sử,
so sánh giá giữa các NCC, audit trail đầy đủ.

---

### Workflow chi tiết

```
[Bước 1] Tạo RFQ
  Nhân viên tạo RFQ với danh sách sản phẩm cần mua
  Chọn NCC (hoặc để trống nếu chưa biết)
  Điền số lượng, yêu cầu giao hàng
  Status: draft

[Bước 2] Gửi RFQ cho NCC
  Click "Gửi RFQ" → status: sent, sent_at = now
  Hệ thống có thể gửi email tự động cho NCC (tích hợp email)

[Bước 3] Nhận báo giá
  NCC phản hồi → Nhân viên cập nhật unit_price vào RFQ lines
  Status: received, received_at = now
  Nếu NCC gửi lại giá khác → tạo RFQ version mới (version+1, parent_id = rfq cũ)

[Bước 4] So sánh & Chọn
  Nếu gửi nhiều NCC → xem bảng so sánh giá
  Chọn RFQ tốt nhất → status: accepted
  Các RFQ còn lại → status: rejected

[Bước 5] Convert sang PO
  Click "Tạo PO từ RFQ"
  Hệ thống tự copy: supplier_id, lines, giá, điều khoản
  PO.rfq_id = rfq.id (truy vết nguồn gốc)
  RFQ status: accepted (đã dùng)
```

### Trường hợp đặc biệt
- **RFQ hết hạn:** `valid_until < today` → status tự chuyển `expired`, không thể convert PO
- **Versioning:** NCC gửi lại giá → tạo version mới thay vì sửa trực tiếp (giữ lịch sử đàm phán)
- **Multi-supplier:** Cùng 1 nhu cầu mua → tạo nhiều RFQ cho nhiều NCC → so sánh

### Giao diện cần bổ sung

**Trang danh sách RFQ** (`/purchase/rfqs`)
```
┌─────────────────────────────────────────────────────────────┐
│ RFQ List                              [+ Tạo RFQ mới]       │
├──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│ RFQ No   │ NCC      │ Ngày     │ Hết hạn  │ Tổng   │ Status │
├──────────┼──────────┼──────────┼──────────┼────────┼────────┤
│ RFQ-001  │ NCC A    │ 01/05    │ 15/05    │ 50tr   │ sent   │
│ RFQ-002  │ NCC B    │ 01/05    │ 15/05    │ 48tr   │ received│
│ RFQ-003  │ NCC C    │ 01/05    │ 15/05    │ 52tr   │ draft  │
└──────────┴──────────┴──────────┴──────────┴────────┴────────┘
  [So sánh báo giá]  ← button chọn nhiều RFQ để so sánh
```

**Trang chi tiết RFQ** (`/purchase/rfqs/:id`)
```
┌─────────────────────────────────────────────────────────────┐
│ RFQ-001  │ NCC: Công ty A  │ Status: received               │
│ Ngày: 01/05  │ Hết hạn: 15/05  │ Version: 2                 │
├─────────────────────────────────────────────────────────────┤
│ Sản phẩm    │ SL  │ ĐVT │ Đơn giá  │ CK% │ Thành tiền      │
│ SP A        │ 100 │ Cái │ 500,000  │ 2%  │ 49,000,000      │
│ SP B        │ 50  │ Hộp │ 200,000  │ 0%  │ 10,000,000      │
├─────────────────────────────────────────────────────────────┤
│ Tổng trước thuế: 59,000,000  │ Thuế: 5,900,000              │
│ Tổng sau thuế: 64,900,000                                   │
├─────────────────────────────────────────────────────────────┤
│ [Gửi RFQ]  [Cập nhật giá]  [Tạo PO từ RFQ]  [Từ chối]     │
└─────────────────────────────────────────────────────────────┘
```

**Trang so sánh báo giá** (`/purchase/rfqs/compare?ids=1,2,3`)
```
┌──────────────────────────────────────────────────────────────────┐
│ So sánh báo giá — SP A, SP B                                     │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ Sản phẩm     │ NCC A        │ NCC B        │ NCC C                │
├──────────────┼──────────────┼──────────────┼──────────────────────┤
│ SP A (100c)  │ 500,000 ✅   │ 520,000      │ 490,000 🏆 rẻ nhất  │
│ SP B (50h)   │ 200,000      │ 190,000 🏆   │ 210,000              │
│ Lead time    │ 7 ngày       │ 5 ngày 🏆    │ 10 ngày              │
│ Tổng         │ 64.9tr       │ 63.5tr 🏆    │ 65.4tr               │
├──────────────┴──────────────┴──────────────┴──────────────────────┤
│                              [Chọn NCC B → Tạo PO]               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Purchase Order — Bổ sung fields

### Tại sao cần từng field?

#### `receipt_status` (pending / partial / fully_received)
**Trước:** Nhân viên phải mở từng PO line, đếm tay xem đã nhận đủ chưa.
Không có cái nhìn tổng quan "PO nào đang chờ nhận hàng".

**Sau:** Dashboard hiển thị ngay: 5 PO đang `partial` (nhận thiếu), 3 PO `pending` (chưa nhận gì).
Kho biết cần nhận hàng cho PO nào.

**Logic tự động:**
```
Khi GRN (stock move) được confirm liên kết với PO:
  → Cập nhật purchase_order_lines.qty_received
  → Tính lại: nếu tất cả lines qty_received >= quantity → receipt_status = 'fully_received'
              nếu có ít nhất 1 line qty_received > 0    → receipt_status = 'partial'
              nếu tất cả lines qty_received = 0         → receipt_status = 'pending'
```

#### `invoice_status` (not_invoiced / partial / invoiced)
**Trước:** Kế toán không biết PO nào đã có hóa đơn, PO nào chưa.
Dễ bị NCC gửi hóa đơn trùng hoặc bỏ sót không lập hóa đơn.

**Sau:** Kế toán filter ngay "PO đã nhận hàng nhưng chưa có hóa đơn" → xử lý kịp thời.

**Logic tự động:**
```
Khi AP Invoice line liên kết với PO line (po_line_id):
  → Cập nhật purchase_order_lines.qty_invoiced
  → Tính lại invoice_status tương tự receipt_status
```

#### `currency_id` + `exchange_rate`
**Trước:** Mua hàng ngoại tệ (USD, EUR) → ghi tay vào description, không tính được chênh lệch tỷ giá.

**Sau:** Hệ thống tự quy đổi sang VND, track chênh lệch tỷ giá khi thanh toán.

#### `payment_term_id`
**Trước:** Điều khoản thanh toán ghi trong description tự do ("Net 30", "50% trước 50% sau").
Kế toán phải đọc text để biết khi nào phải trả.

**Sau:** Link với bảng `payment_terms` → hệ thống tự tính `due_date` cho AP Invoice,
có thể cảnh báo "5 PO sắp đến hạn thanh toán".

#### `buyer_id`
**Trước:** Không biết ai phụ trách PO này, khi có vấn đề không biết hỏi ai.

**Sau:** Mỗi PO có người phụ trách rõ ràng. Manager xem được KPI mua hàng theo nhân viên.

#### `expected_delivery_date`
**Trước:** Ngày giao hàng thỏa thuận miệng hoặc trong email, không vào hệ thống.

**Sau:** Hệ thống cảnh báo "10 PO quá hạn giao hàng" → nhân viên follow up NCC kịp thời.

#### `qty_received` + `qty_invoiced` trên PO lines
**Trước:** Không track được từng dòng đã nhận/lập hóa đơn bao nhiêu.
Ví dụ: PO 100 cái SP A, nhận 60 cái → không biết còn thiếu 40 cái.

**Sau:** Mỗi line hiển thị rõ: `Đặt: 100 | Đã nhận: 60 | Còn thiếu: 40 | Đã lập HĐ: 60`

### Giao diện cần bổ sung

**Trang chi tiết PO — thêm tracking panel**
```
┌─────────────────────────────────────────────────────────────────┐
│ PO-2026-001  │ NCC: Công ty A  │ Ngày: 01/05/2026              │
│ Buyer: Nguyễn Văn A  │ Giao hàng dự kiến: 15/05/2026           │
│ Điều khoản TT: Net 30  │ Tiền tệ: VND  │ Tỷ giá: 1.00         │
├──────────────────────────────────────────────────────────────────┤
│ Trạng thái nhận hàng: [====60%====] partial                     │
│ Trạng thái hóa đơn:  [====60%====] partial                     │
├──────────────────────────────────────────────────────────────────┤
│ Sản phẩm │ Đặt │ Đã nhận │ Còn thiếu │ Đã HĐ │ Đơn giá │ CK% │
│ SP A     │ 100 │   60    │    40     │   60  │ 500,000 │  2% │
│ SP B     │  50 │   50    │     0 ✅  │   50  │ 200,000 │  0% │
├──────────────────────────────────────────────────────────────────┤
│ [Tạo GRN]  [Tạo AP Invoice]  [Tạo Return]  [Xem lịch sử]      │
└──────────────────────────────────────────────────────────────────┘
```

**Dashboard Purchase — thêm widgets**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PO chờ nhận  │ │ PO quá hạn   │ │ HĐ chưa lập  │ │ Sắp đến hạn  │
│ hàng         │ │ giao hàng    │ │              │ │ thanh toán   │
│     12       │ │      3       │ │      8       │ │      5       │
│  [Xem ngay]  │ │  [Xem ngay]  │ │  [Xem ngay]  │ │  [Xem ngay]  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 4. AP Invoice — Bổ sung fields

### Tại sao cần từng field?

#### `paid_amount`
**Trước:** Muốn biết hóa đơn đã trả bao nhiêu phải vào bảng `ap_payment_allocations`,
cộng tay tất cả `applied_amount`. Không có con số tổng hợp trên hóa đơn.

**Sau:** `paid_amount` được cập nhật tự động mỗi khi có allocation.
Kế toán nhìn vào hóa đơn thấy ngay: `Tổng: 100tr | Đã trả: 60tr | Còn nợ: 40tr`.

**Logic:**
```
Khi tạo AP Payment Allocation:
  ap_invoices.paid_amount += applied_amount
  if paid_amount >= total_after_tax → status = 'paid', last_payment_date = today
  if 0 < paid_amount < total_after_tax → status = 'partially_paid'

Khi xóa/hủy Allocation:
  ap_invoices.paid_amount -= applied_amount
  Recalculate status
```

#### `currency_id` + `exchange_rate`
**Trước:** Hóa đơn ngoại tệ ghi tay, không tính được chênh lệch tỷ giá khi thanh toán.

**Sau:** Hóa đơn USD 1,000 @ 25,000 VND = 25,000,000 VND.
Khi thanh toán tỷ giá 25,500 → chênh lệch 500,000 VND → hạch toán vào tài khoản chênh lệch tỷ giá.

#### `payment_term_id` + `due_date`
**Trước:** `due_date` đã có nhưng nhập tay, dễ sai. Không link với điều khoản thanh toán.

**Sau:** Chọn `payment_term_id` → `due_date` tự tính = `invoice_date + payment_term.days`.
Hệ thống cảnh báo hóa đơn sắp đến hạn.

#### `last_payment_date`
**Trước:** Không biết lần cuối trả tiền cho hóa đơn này là khi nào.

**Sau:** Hiển thị trên hóa đơn, dùng để báo cáo "hóa đơn không có thanh toán trong 30 ngày".

### Workflow AP Invoice sau khi bổ sung
```
[Tạo AP Invoice] ← từ PO hoặc OCR
  invoice_date, due_date (tự tính từ payment_term)
  currency_id, exchange_rate
  status: draft → posted (sau khi duyệt)
  paid_amount: 0
        ↓
[Duyệt AP Invoice]
  approval_status: waiting_approval → approved
  status: draft → posted
        ↓
[Tạo AP Payment + Allocation]
  applied_amount = X
  → ap_invoices.paid_amount += X
  → Nếu paid_amount < total: status = 'partially_paid'
  → Nếu paid_amount >= total: status = 'paid', last_payment_date = today
        ↓
[Hóa đơn đã thanh toán đủ]
  status: paid ✅
```

### Giao diện cần bổ sung

**Trang chi tiết AP Invoice — thêm payment tracking**
```
┌─────────────────────────────────────────────────────────────────┐
│ AP Invoice #INV-2026-001                                        │
│ NCC: Công ty A  │ Ngày HĐ: 01/05  │ Đến hạn: 31/05 ⚠️ 5 ngày │
│ Điều khoản: Net 30  │ Tiền tệ: VND                             │
├─────────────────────────────────────────────────────────────────┤
│ Tổng tiền:        100,000,000                                   │
│ Đã thanh toán:     60,000,000  (60%)                           │
│ Còn phải trả:      40,000,000                                   │
│ [████████████░░░░░░░░] 60%  partially_paid                     │
├─────────────────────────────────────────────────────────────────┤
│ Lịch sử thanh toán:                                            │
│ 10/05 - Payment #PAY-001 - 40,000,000 VND                      │
│ 15/05 - Payment #PAY-002 - 20,000,000 VND                      │
├─────────────────────────────────────────────────────────────────┤
│ [Tạo thanh toán]  [Xem PO gốc]  [Tải PDF]                     │
└─────────────────────────────────────────────────────────────────┘
```

**Danh sách AP Invoice — thêm cột tracking**
```
│ Số HĐ    │ NCC    │ Ngày HĐ │ Đến hạn │ Tổng    │ Đã trả  │ Còn nợ  │ Status        │
│ INV-001  │ NCC A  │ 01/05   │ 31/05⚠️ │ 100tr   │ 60tr    │ 40tr    │ partially_paid│
│ INV-002  │ NCC B  │ 05/05   │ 04/06   │  50tr   │  0      │ 50tr    │ posted        │
│ INV-003  │ NCC C  │ 10/05   │ 09/06   │  80tr   │ 80tr    │  0      │ paid ✅       │
```

---

## 5. AP Payment — Bổ sung fields

### Tại sao cần từng field?

#### `allocation_status` (unallocated / partially_allocated / fully_allocated)
**Trước:** Tạo payment xong không biết đã phân bổ vào hóa đơn nào chưa.
Kế toán phải vào bảng allocations kiểm tra thủ công.

**Sau:** Payment list hiển thị ngay: "3 payment chưa phân bổ" → kế toán xử lý ngay.

**Logic:**
```
Khi tạo Payment:
  allocation_status = 'unallocated'

Khi tạo Allocation:
  Tính tổng applied_amount của payment này
  if tổng < payment.amount → 'partially_allocated'
  if tổng >= payment.amount → 'fully_allocated', status = 'completed'

Khi xóa Allocation:
  Recalculate allocation_status
```

#### `bank_account_id`
**Trước:** Không biết thanh toán từ tài khoản ngân hàng nào.
Kế toán phải đối chiếu sao kê ngân hàng thủ công.

**Sau:** Mỗi payment link với bank account → tự động đối chiếu sao kê,
tính số dư từng tài khoản ngân hàng.

#### `transaction_reference`
**Trước:** Số tham chiếu giao dịch ngân hàng ghi tay vào notes, không có field riêng.
Không thể search/filter theo số giao dịch.

**Sau:** Field riêng → search được "tìm payment theo số giao dịch ngân hàng ABC123".

#### `currency_id` + `exchange_rate`
**Trước:** Thanh toán ngoại tệ không track được tỷ giá thực tế khi chuyển tiền.

**Sau:** Hóa đơn USD 1,000 @ 25,000 VND, thanh toán @ 25,500 VND
→ Chênh lệch tỷ giá = 500,000 VND → hạch toán tự động vào GL.

### Workflow AP Payment sau khi bổ sung
```
[Tạo AP Payment]
  Chọn NCC, số tiền, phương thức
  Chọn bank_account_id (tài khoản dùng để trả)
  Nhập transaction_reference (số giao dịch ngân hàng)
  currency_id, exchange_rate
  allocation_status: unallocated
        ↓
[Duyệt Payment]
  approval_status: approved
  status: posted
        ↓
[Phân bổ vào Invoice(s)]
  Chọn 1 hoặc nhiều AP Invoice để phân bổ
  Nhập applied_amount cho từng invoice
  → ap_invoices.paid_amount tự cập nhật
  → allocation_status: partially_allocated hoặc fully_allocated
        ↓
[Khi fully_allocated]
  status: completed ✅
```

### Giao diện cần bổ sung

**Trang tạo AP Payment — thêm fields**
```
┌─────────────────────────────────────────────────────────────────┐
│ Tạo AP Payment                                                  │
├─────────────────────────────────────────────────────────────────┤
│ NCC: [Công ty A ▼]          Ngày TT: [10/05/2026]              │
│ Số tiền: [40,000,000]       Phương thức: [Chuyển khoản ▼]      │
│ Tài khoản NH: [Vietcombank - 1234567890 ▼]  ← THÊM MỚI        │
│ Số GD ngân hàng: [FT26130123456]            ← THÊM MỚI        │
│ Tiền tệ: [VND ▼]  Tỷ giá: [1.00]           ← THÊM MỚI        │
├─────────────────────────────────────────────────────────────────┤
│ Phân bổ vào hóa đơn:                        ← THÊM MỚI        │
│ ☑ INV-001  Còn nợ: 40tr  Phân bổ: [40,000,000]                │
│ ☐ INV-002  Còn nợ: 50tr  Phân bổ: [          ]                │
├─────────────────────────────────────────────────────────────────┤
│ Tổng phân bổ: 40,000,000 / 40,000,000 ✅ fully_allocated       │
│                                    [Lưu]  [Lưu & Duyệt]       │
└─────────────────────────────────────────────────────────────────┘
```

**Danh sách AP Payment — thêm cột allocation**
```
│ Số PT   │ NCC    │ Ngày   │ Số tiền │ Tài khoản NH │ Allocation    │ Status    │
│ PAY-001 │ NCC A  │ 10/05  │ 40tr    │ VCB-1234     │ fully ✅      │ completed │
│ PAY-002 │ NCC B  │ 11/05  │ 50tr    │ TCB-5678     │ partial ⚠️   │ posted    │
│ PAY-003 │ NCC C  │ 12/05  │ 30tr    │ —            │ unallocated ❌│ posted    │
```

---

## 6. Purchase Return / Debit Note / Vendor Refund

### Tại sao cần?

**Trước:** Nhận hàng lỗi từ NCC → gọi điện thỏa thuận → trả hàng → NCC trừ vào đơn sau.
Không có chứng từ nào trong hệ thống. Kế toán không biết công nợ phải trả đã giảm.
Dễ xảy ra: trả hàng rồi vẫn trả tiền đủ (mất tiền), hoặc NCC không ghi nhận (tranh chấp).

**Sau:** Toàn bộ quy trình có chứng từ, approval workflow, liên kết kế toán.

---

### Workflow chi tiết — 4 bước

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1: Purchase Return Authorization (PRA) — Xin phép trả hàng
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ai làm: Nhân viên kho / mua hàng
Khi nào: Phát hiện hàng lỗi, sai quy cách, thừa số lượng

  Tạo PRA:
    - Chọn PO gốc (hoặc AP Invoice gốc)
    - Chọn NCC
    - Nhập lý do trả hàng
    - Chọn hình thức xử lý: refund / replacement / debit_note
    - Nhập tổng giá trị hàng trả
    Status: draft → submitted → approved/rejected

  Sau khi approved:
    → Chuyển sang Bước 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2: Purchase Return — Xuất kho trả NCC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ai làm: Nhân viên kho
Khi nào: Sau khi PRA được duyệt, NCC đồng ý nhận hàng trả

  Tạo Purchase Return:
    - Link với PRA đã duyệt
    - Chọn kho xuất hàng
    - Nhập từng dòng: sản phẩm, số lượng trả, tình trạng (good/damaged/defective)
    - Nhập ngày trả hàng
    Status: draft → shipped (đã gửi hàng) → confirmed (NCC xác nhận nhận) → completed

  Khi status = confirmed:
    → Hệ thống tự tạo stock move (xuất kho) → giảm tồn kho
    → Cập nhật qty_confirmed, qty_rejected trên từng return line
    → Chuyển sang Bước 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3: AP Debit Note — Giảm công nợ phải trả
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ai làm: Kế toán
Khi nào: Sau khi NCC xác nhận nhận hàng trả

  Tạo AP Debit Note:
    - Link với Purchase Return
    - Link với AP Invoice gốc (để biết giảm công nợ nào)
    - Lines tự copy từ return lines (sản phẩm, số lượng, đơn giá)
    - Tính lại thuế
    Status: draft → posted (sau khi duyệt)

  Khi posted:
    → Tạo GL Entry: Nợ AP / Có Hàng trả lại NCC
    → Giảm công nợ phải trả NCC
    → AP Invoice gốc: paid_amount += debit_note.total (hoặc tạo allocation riêng)

  Nếu return_type = 'debit_note': dừng ở đây (trừ vào đơn sau)
  Nếu return_type = 'refund': chuyển sang Bước 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 4: Vendor Refund — NCC hoàn tiền
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ai làm: Kế toán
Khi nào: NCC chuyển tiền hoàn lại (return_type = 'refund')

  Tạo Vendor Refund:
    - Link với AP Debit Note
    - Nhập số tiền NCC hoàn
    - Chọn phương thức (bank/cash/transfer)
    - Chọn tài khoản ngân hàng nhận tiền
    Status: draft → posted

  Khi posted:
    → Tạo GL Entry: Nợ Tiền mặt/NH / Có AP
    → Tăng số dư tài khoản ngân hàng
```

---

### Ví dụ thực tế

```
Tình huống: Mua 100 cái SP A, nhận về 10 cái bị lỗi, giá 500,000/cái

Bước 1 — PRA:
  Lý do: Hàng lỗi, không đúng quy cách
  Hình thức: refund (NCC hoàn tiền)
  Giá trị: 10 × 500,000 = 5,000,000 VND

Bước 2 — Purchase Return:
  Xuất kho 10 cái SP A (condition: defective)
  NCC xác nhận nhận lại → confirmed

Bước 3 — AP Debit Note:
  Giảm công nợ phải trả NCC: 5,000,000 + thuế 500,000 = 5,500,000
  AP Invoice gốc: 50,000,000 → sau debit note còn nợ: 44,500,000

Bước 4 — Vendor Refund:
  NCC chuyển khoản 5,500,000 vào tài khoản Vietcombank
  GL: Nợ NH 5,500,000 / Có AP 5,500,000
```

### Giao diện cần bổ sung

**Menu Purchase — thêm mục Return**
```
Purchase
  ├── RFQ
  ├── Purchase Orders
  ├── Receipts (GRN)
  ├── AP Invoices
  ├── AP Payments
  └── Returns ← THÊM MỚI
        ├── Return Authorizations (PRA)
        ├── Purchase Returns
        ├── Debit Notes
        └── Vendor Refunds
```

**Trang PRA List** (`/purchase/return-authorizations`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Purchase Return Authorizations          [+ Tạo PRA mới]        │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ PRA No   │ NCC      │ PO gốc   │ Giá trị  │ Hình thức│ Status  │
├──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ PRA-001  │ NCC A    │ PO-001   │ 5.5tr    │ refund   │approved │
│ PRA-002  │ NCC B    │ PO-005   │ 2tr      │ debit    │submitted│
│ PRA-003  │ NCC A    │ PO-010   │ 8tr      │ replace  │draft    │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```

**Trang chi tiết PRA — timeline trạng thái**
```
┌─────────────────────────────────────────────────────────────────┐
│ PRA-001  │ NCC: Công ty A  │ PO: PO-2026-001                   │
│ Lý do: Hàng lỗi, không đúng quy cách                          │
│ Hình thức xử lý: Hoàn tiền (refund)                           │
├─────────────────────────────────────────────────────────────────┤
│ Timeline:                                                       │
│ ✅ PRA tạo ngày 05/05  →  ✅ Duyệt 06/05  →  ✅ Return 07/05  │
│ →  ✅ Debit Note 08/05  →  ⏳ Vendor Refund (chờ NCC chuyển)  │
├─────────────────────────────────────────────────────────────────┤
│ Sản phẩm │ SL trả │ Tình trạng  │ Đơn giá  │ Thành tiền       │
│ SP A     │   10   │ defective   │ 500,000  │ 5,000,000        │
├─────────────────────────────────────────────────────────────────┤
│ [Tạo Purchase Return]  [Xem Debit Note]  [Xem Vendor Refund]  │
└─────────────────────────────────────────────────────────────────┘
```

**Trang AP Debit Note List** (`/purchase/debit-notes`)
```
┌─────────────────────────────────────────────────────────────────┐
│ AP Debit Notes                          [+ Tạo Debit Note]     │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ DN No    │ NCC      │ HĐ gốc   │ Tổng     │ Ngày     │ Status  │
├──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ DN-001   │ NCC A    │ INV-001  │ 5.5tr    │ 08/05    │ posted  │
│ DN-002   │ NCC B    │ INV-005  │ 2.2tr    │ 09/05    │ draft   │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```

---

## 7. Tổng hợp giao diện cần bổ sung

### Trang mới hoàn toàn

| Trang | Route | Mô tả |
|---|---|---|
| RFQ List | `/purchase/rfqs` | Danh sách RFQ, filter theo status/NCC/ngày |
| RFQ Detail | `/purchase/rfqs/:id` | Chi tiết + lines + actions (gửi/convert PO) |
| RFQ Compare | `/purchase/rfqs/compare` | So sánh báo giá nhiều NCC cùng lúc |
| PRA List | `/purchase/return-authorizations` | Danh sách yêu cầu trả hàng |
| PRA Detail | `/purchase/return-authorizations/:id` | Chi tiết + timeline + actions |
| Purchase Return List | `/purchase/returns` | Danh sách phiếu trả hàng |
| Purchase Return Detail | `/purchase/returns/:id` | Chi tiết + lines + stock move |
| AP Debit Note List | `/purchase/debit-notes` | Danh sách debit note |
| AP Debit Note Detail | `/purchase/debit-notes/:id` | Chi tiết + lines + GL entry |
| Vendor Refund List | `/purchase/vendor-refunds` | Danh sách hoàn tiền từ NCC |
| Vendor Refund Detail | `/purchase/vendor-refunds/:id` | Chi tiết + GL entry |

---

### Trang hiện có — cần bổ sung thêm

#### Purchase Order Detail — thêm
- [ ] Panel **Tracking**: `receipt_status` progress bar, `invoice_status` progress bar
- [ ] Cột trên lines: `Đã nhận`, `Còn thiếu`, `Đã lập HĐ`
- [ ] Field: `Buyer`, `Ngày giao dự kiến`, `Điều khoản TT`, `Tiền tệ`, `Tỷ giá`
- [ ] Field: `Số tham chiếu NCC` (supplier_ref_no)
- [ ] Tab `Ghi chú nội bộ` / `Ghi chú cho NCC`
- [ ] Button: `Tạo Return` (khi đã nhận hàng)
- [ ] Button: `Tạo từ RFQ` (khi tạo PO mới)

#### AP Invoice Detail — thêm
- [ ] Panel **Thanh toán**: `Tổng`, `Đã trả`, `Còn nợ`, progress bar
- [ ] Lịch sử thanh toán (danh sách payments đã phân bổ)
- [ ] Field: `Điều khoản TT`, `Tiền tệ`, `Tỷ giá`
- [ ] Cảnh báo đến hạn (badge màu đỏ nếu `due_date < today + 7`)
- [ ] Button: `Tạo Debit Note` (khi có return)

#### AP Payment Detail — thêm
- [ ] Field: `Tài khoản ngân hàng`, `Số GD ngân hàng`
- [ ] Field: `Tiền tệ`, `Tỷ giá`
- [ ] Panel **Phân bổ**: danh sách invoices đã phân bổ, tổng đã phân bổ vs tổng payment
- [ ] Badge `allocation_status`: unallocated (đỏ) / partially (vàng) / fully (xanh)

---

### Dashboard Purchase — widgets mới

```
┌──────────────────────────────────────────────────────────────────────┐
│ PURCHASE DASHBOARD                                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────┤
│ RFQ chờ xử  │ PO chờ nhận  │ HĐ sắp đến  │ Payment chưa │ Return  │
│ lý           │ hàng         │ hạn (7 ngày) │ phân bổ      │ đang xử │
│     5        │     12       │      8       │      3       │    2    │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────┘

Biểu đồ: Chi phí mua hàng theo tháng (bar chart)
Biểu đồ: Top 5 NCC theo giá trị mua (pie chart)
Bảng: PO quá hạn giao hàng (cần follow up)
Bảng: AP Invoice đến hạn trong 7 ngày
```

---

### Notifications / Alerts cần thêm

| Trigger | Thông báo | Người nhận |
|---|---|---|
| RFQ `valid_until` còn 3 ngày | "RFQ-001 sắp hết hạn" | Buyer |
| PO `expected_delivery_date` quá hạn | "PO-001 quá hạn giao hàng 3 ngày" | Buyer + Manager |
| AP Invoice `due_date` còn 7 ngày | "INV-001 đến hạn thanh toán 31/05" | Kế toán |
| AP Payment `allocation_status = unallocated` sau 24h | "PAY-001 chưa được phân bổ" | Kế toán |
| PRA được duyệt | "PRA-001 đã được duyệt, tạo Return" | Nhân viên kho |
| Purchase Return `confirmed` | "Return-001 NCC xác nhận, tạo Debit Note" | Kế toán |

---

### Tóm tắt — Trước vs Sau

| Khía cạnh | Trước | Sau |
|---|---|---|
| Hỏi giá NCC | Zalo/email, không lưu | RFQ có chứng từ, so sánh được |
| Theo dõi nhận hàng | Đếm tay từng PO | receipt_status tự động, dashboard |
| Theo dõi lập HĐ | Kiểm tra thủ công | invoice_status tự động |
| Thanh toán một phần | Không track | paid_amount, partially_paid status |
| Phân bổ payment | Không biết đã phân bổ chưa | allocation_status rõ ràng |
| Hàng lỗi trả NCC | Xử lý ngoài hệ thống | 4 bước có chứng từ đầy đủ |
| Công nợ sau trả hàng | Kế toán tính tay | Debit Note tự giảm AP |
| NCC hoàn tiền | Ghi chú tay | Vendor Refund + GL Entry tự động |
| Cảnh báo đến hạn | Không có | Notification tự động |
| Báo cáo mua hàng | Hạn chế | Đầy đủ: theo NCC, theo buyer, theo kỳ |

---
*File này được tạo từ phân tích gap Purchase vs Sale. Xem thêm: purchase-sale-gap-analysis.md*
