# Hướng Dẫn Vận Hành & Luồng Dữ Liệu OCR 3-Way Matching (ERP Mini)

Tài liệu này mô tả chi tiết cơ chế hoạt động, luồng xử lý dữ liệu (Flow), các service nghiệp vụ, quy tắc tính toán dung sai (Tolerance) và quy trình so khớp 3 bên (3-Way Matching) giữa Hóa đơn AP Invoice, Đơn mua hàng (PO), và Phiếu nhập kho (GRN).

---

## 1. Cơ Chế 3-Way Matching Là Gì?
Trong quản lý mua hàng và kế toán phải trả (AP), **3-Way Matching** là quy trình đối chiếu 3 chứng từ quan trọng trước khi thanh toán cho nhà cung cấp:
1. **Purchase Order (PO)**: Đơn đặt mua hàng (chứa đơn giá đã thỏa thuận).
2. **Goods Receipt Note (GRN - Stock Move)**: Phiếu thực nhập kho (chứa số lượng thực tế nhận được).
3. **AP Invoice (Hóa đơn mua hàng từ nhà cung cấp)**: Do OCR quét từ hóa đơn PDF/ảnh (chứa số lượng và đơn giá nhà cung cấp yêu cầu thanh toán).

```text
       [1. Purchase Order] (Đơn giá thỏa thuận)
             /       \
            /         \
           /           \
[2. Goods Receipt] ─── [3. AP Invoice] (OCR)
 (Số lượng thực nhập)   (Số lượng & Đơn giá thực tế thanh toán)
```

---

## 2. Sơ Đồ Khối & Luồng Xử Lý Chi Tiết (ASCII Diagram)

Dưới đây là luồng đi của dữ liệu từ khi upload hóa đơn cho đến khi hoàn thành so khớp 3 bên:

```text
[Người dùng UI]
      │ (1. Upload file Hóa đơn PDF/Ảnh)
      ▼
[Frontend Component] ──► Gọi API: `POST /api/documents/upload`
                                 │
                                 ▼
[DocumentController] ──► Gọi: `documentService.uploadDocument()`
                                 │
  ┌──────────────────────────────┴──────────────────────────────┐
  │ 1. Validate file & Lưu trữ local (`uploads/invoices/...`)    │
  │ 2. Gọi: `ocrEngineFactory.getEngine('openai_vision')`       │
  │ 3. Gọi: `openAIVisionOCRService.extract()` (OCR quét text)   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ (Trả về JSON dữ liệu thô)
                                 ▼
[Data Enrichment Phase] ───────► Gọi: `productMatcher` & `vendorMatcher`
                                 │ (Ánh xạ Supplier & Product ID thực tế)
                                 ▼
[Create AP Invoice Service] ──► Gọi: `apInvoiceService.createAPInvoice()`
                                 │ (Lưu trạng thái tạm nháp)
                                 ▼
[ThreeWayMatcherService] ─────► Gọi: `threeWayMatcher.match(ap_invoice_id)`
                                 │
                                 ├─► A. Lấy thông tin PO & các Phiếu nhập kho (GRN) liên quan
                                 ├─► B. Lấy cấu hình dung sai: `getTolerance(branchId, supplierId)`
                                 ├─► C. Duyệt từng dòng (Lines) để so khớp:
                                 │      ├── Kiếm tra chênh lệch đơn giá (so với PO)
                                 │      └── Kiểm tra chênh lệch số lượng (so với GRN thực nhận)
                                 │
                                 ▼
                        [Cập nhật trạng thái]
         ┌───────────────────────┴───────────────────────┐
         ▼ (Không lệch hoặc trong dung sai)              ▼ (Vượt dung sai cho phép)
  [matching_status: 'matched']                    [matching_status: 'mismatch']
  (Đủ điều kiện tự động duyệt)                    (Chờ Kế toán duyệt thủ công)
```

---

## 3. Chi Tiết Các Bước Thực Thi & Tên File Code

### Bước 1: Tiếp nhận và xử lý OCR

#### A. Tiếp nhận & Lưu trữ tệp cục bộ (Local Storage)
* **API Entrypoint**: `POST /api/documents/upload` thuộc [document.controller.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/controllers/document.controller.ts).
* Khi nhận được tệp từ request, [document.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/document.service.ts) thực hiện:
  1. **Làm sạch tên file**: Hàm `sanitizeFilename()` (trong [fileUtils.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/utils/fileUtils.ts)) loại bỏ các ký tự độc hại (chống tấn công Path Traversal) và sửa lỗi mã hóa font tiếng Việt (mojibake) từ Multer.
  2. **Tạo đường dẫn lưu trữ**: Hàm `generateStoragePath()` sinh một UUID ngẫu nhiên để tránh trùng tên file và xác định đường dẫn:
     `uploads/invoices/<branchId>/<uuid>.<ext>`
  3. **Lưu file**: Hàm `moveFileToFinalPath()` tạo các thư mục cha (nếu chưa có) và di chuyển file từ thư mục tạm thời của hệ thống về thư mục lưu trữ local này.
  4. **Tạo bản ghi Database**: Hệ thống tạo bản ghi trong bảng `InvoiceDocument` với trạng thái `ocr_status: "pending"` và chạy tiến trình OCR chạy ngầm (asynchronous background task) để không gây nghẽn UI của người dùng.

#### B. Khởi tạo OCR Engine qua Factory
* Khi tiến trình OCR chạy ngầm khởi chạy, nó gọi:
  ```typescript
  const engine = OcrEngineFactory.create();
  ```
* [OcrEngineFactory](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/ocrEngine.factory.ts) sẽ đọc cấu hình từ file `.env` (thông qua `ocrConfig` service) để lấy loại Engine và API Key tương ứng.
* Mặc định, Factory sẽ khởi tạo và trả về đối tượng của lớp [OpenAIVisionOcr](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/openaiVisionOcr.service.ts) (sử dụng GPT-4o-mini).

#### C. Trích xuất dữ liệu thô bằng OpenAI Vision OCR
Hàm `extract(filePath)` tại [openaiVisionOcr.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/openaiVisionOcr.service.ts#L64) xử lý tệp theo 3 kịch bản:

* **Kịch bản 1: File định dạng Ảnh (JPG/JPEG/PNG)**
  * Hệ thống đọc tệp từ ổ đĩa local thành Buffer, mã hóa dưới dạng chuỗi Base64.
  * Đóng gói thành Data URL (`data:image/jpeg;base64,...`) và gửi trực tiếp sang OpenAI API bằng thuộc tính `image_url`.

* **Kịch bản 2: File PDF có chứa Text trực tiếp (Searchable PDF)**
  * Hệ thống sử dụng thư viện `pdf-parse` để đọc toàn bộ ký tự text hiển thị trong file PDF mà không cần quét ảnh (giúp tiết kiệm token và tăng tốc độ xử lý).
  * Văn bản text thô trích xuất từ PDF sẽ được gửi kèm trong Prompt text thông thường gửi lên OpenAI.

* **Kịch bản 3: File PDF dạng Ảnh scan (Scanned PDF)**
  * Nếu dùng `pdf-parse` nhưng độ dài text trích xuất được dưới 20 ký tự (PDF không chứa text), hệ thống xác định đây là PDF dạng ảnh scan.
  * Do OpenAI Vision không thể đọc trực tiếp file `.pdf`, hệ thống sẽ **tải tạm thời** file PDF này lên Cloudinary thông qua hàm helper `uploadBufferToCloudinary`.
  * Lợi dụng tính năng của Cloudinary, hệ thống đổi đuôi file `.pdf` thành `.jpg` trên URL tải về để ép Cloudinary render trang đầu tiên thành ảnh JPEG.
  * URL ảnh JPEG này được gửi sang OpenAI Vision để nhận diện. Sau đó, hệ thống đặt lịch tự động xóa ảnh tạm này khỏi Cloudinary sau 2 phút để dọn dẹp bộ nhớ.

* **Cơ chế Prompting & Structuring**:
  * **System Prompt chuyên biệt**: Chỉ thị OpenAI lưu ý các quy tắc hóa đơn Việt Nam (ví dụ dấu chấm `.` là phân cách hàng nghìn, dấu phẩy `,` là phân cách thập phân như `25.000.000đ` là 25 triệu) để tránh nhận diện sai lệch số tiền.
  * **Đầu ra mong muốn**: Yêu cầu OpenAI trả về cấu trúc JSON chuẩn có sẵn (các trường `vendor_name`, `invoice_no`, `items` chứa mảng mặt hàng với đơn giá, số lượng,...).
  * **Xử lý kết quả**: Dữ liệu trả về từ OpenAI sẽ được làm sạch các ký tự markdown bao ngoài (ví dụ ` ```json ` và ` ``` `), sau đó chạy `JSON.parse` để chuyển đổi thành cấu trúc Object dùng cho các bước tiếp theo.
  * **Xử lý lỗi**: Thiết lập timeout 25 giây bằng `AbortController` và hỗ trợ thử lại (retry) tối đa 2 lần nếu cuộc gọi API bị lỗi hoặc quá thời gian.

### Bước 2: Chuẩn hóa dữ liệu (Enrichment)
* **Khớp nhà cung cấp**: `vendorMatcher` sử dụng các thông tin tên, MST, địa chỉ trên hóa đơn để tìm ID nhà cung cấp tương ứng trong DB.
* **Khớp sản phẩm**: [productMatcher.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/productMatcher.service.ts) tìm kiếm tên sản phẩm trên hóa đơn khớp với Product trong danh mục ERP.

### Bước 3: Thực thi so khớp 3 bên (3-Way Matching Logic)
Toàn bộ logic so khớp nằm tại [threeWayMatcher.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/threeWayMatcher.service.ts).

Hàm `match(ap_invoice_id)` thực hiện tuần tự:

1. **Lấy dữ liệu nhập kho (GRN)**:
   * Truy vấn tất cả phiếu kho `StockMove` có `type: "receipt"`, `reference_type: "purchase_order"`, trạng thái `posted` thuộc về PO này.
   * Tính toán tổng số lượng đã nhận (`totalReceived`) theo từng sản phẩm.
2. **Lấy dữ liệu đã xuất hóa đơn trước đó**:
   * Truy vấn các hóa đơn `ApInvoice` khác liên kết với cùng PO (tránh tình trạng nhà cung cấp xuất nhiều hóa đơn vượt quá số lượng đặt).
   * Tính toán số lượng đã xuất hóa đơn (`previouslyInvoiced`).
   * Xác định số lượng còn lại được phép xuất hóa đơn:
     ```text
     Lượng còn lại được xuất hóa đơn = Tổng số lượng đã nhận - Tổng số lượng đã xuất hóa đơn trước đó
     ```
3. **Lấy cấu hình dung sai (Tolerance)**:
   * Gọi hàm `getTolerance(branchId, supplierId, categoryId)` để lấy cấu hình dung sai từ bảng `MatchingTolerance` theo thứ tự ưu tiên: Nhà cung cấp cụ thể -> Nhóm sản phẩm -> Mặc định của chi nhánh.
4. **Kiểm tra chênh lệch đơn giá (Price Check)**:
   * So sánh đơn giá trên hóa đơn (P_invoice) với đơn giá trên PO (P_po).
   * Kiểm tra xem độ lệch phần trăm và số tiền tuyệt đối có vượt quá cấu hình hay không:
     ```text
     Độ lệch giá = |Đơn giá hóa đơn - Đơn giá PO|
     % Lệch đơn giá = (Độ lệch giá / Đơn giá PO) * 100%
     Số tiền lệch tuyệt đối = Độ lệch giá * Số lượng hóa đơn
     ```
   * Nếu vượt quá cả phần trăm dung sai cho phép và số tiền chênh lệch tuyệt đối tối thiểu, đánh dấu dòng là `price_mismatch`.

5. **Kiểm tra chênh lệch số lượng (Quantity Check)**:
   * So sánh số lượng hóa đơn (Q_invoice) với lượng còn lại được phép xuất hóa đơn (Lượng còn lại được xuất hóa đơn).
   * Công thức tính số lượng tối đa cho phép nhập hóa đơn:
     ```text
     Số lượng tối đa cho phép = Lượng còn lại được xuất hóa đơn * (1 + Dung sai số lượng %)
     ```
   * Nếu Q_invoice > Số lượng tối đa cho phép, đánh dấu dòng là `qty_mismatch`.

---

## 4. Các Ví Dụ Thực Tế Chạy End-To-End

### Ví dụ 1: Khớp hoàn toàn (Matching Status: `matched`)
* **Dữ liệu PO**:
  * Đặt mua: `5 cái iPhone 15 Pro Max`, Đơn giá: `30.000.000đ`
* **Dữ liệu Nhập kho (GRN)**:
  * Đã nhập kho thành công: `5 cái iPhone 15 Pro Max`
* **Dữ liệu Hóa đơn OCR quét về**:
  * Số lượng: `5 cái`, Đơn giá: `30.000.000đ`
* **Kết quả xử lý**:
  * Lượng còn lại được xuất hóa đơn: 5 - 0 = 5 cái.
  * Số lượng hóa đơn 5 <= 5 => Khớp số lượng.
  * Đơn giá hóa đơn 30.000.000 = 30.000.000 => Khớp đơn giá.
  * **Trạng thái cuối cùng**: `overall_status: "matched"`. Hệ thống tự động chuyển trạng thái AP Invoice thành Đã duyệt (Approved) hoặc chuyển tiếp thanh toán.

---

### Ví dụ 2: Lệch Đơn Giá vượt dung sai (Matching Status: `mismatch`)
* **Dữ liệu PO**:
  * Đặt mua: `10 cái Tai nghe Airpods Pro`, Đơn giá: `5.000.000đ`
* **Cấu hình Dung sai (Tolerance)**:
  * Cho phép lệch giá tối đa: `2%`, số tiền lệch tối đa: `50.000đ`
* **Dữ liệu Hóa đơn OCR quét về**:
  * Số lượng: `10 cái`, Đơn giá: `5.200.000đ` (do nhà cung cấp tăng giá đột xuất)
* **Kết quả xử lý**:
  * Lệch giá thực tế: 5.200.000 - 5.000.000 = 200.000đ (tương đương lệch 4%).
  * Tổng tiền chênh lệch: 200.000đ * 10 = 2.000.000đ.
  * Cả phần trăm lệch (4% > 2%) và số tiền chênh lệch tuyệt đối (2.000.000đ > 50.000đ) đều vượt ngưỡng dung sai.
  * **Trạng thái cuối cùng**: `overall_status: "mismatch"`.
  * **Hành động tiếp theo**: Hệ thống gắn cờ cảnh báo `price_mismatch`, đưa hóa đơn vào danh sách "Chờ xử lý chênh lệch" để Kế toán phải trả làm việc lại với nhà cung cấp hoặc tiến hành ghi đè duyệt thủ công (Manual Override).

---

### Ví dụ 3: Lệch Số Lượng do giao thiếu hàng (Matching Status: `mismatch`)
* **Dữ liệu PO**:
  * Đặt mua: `100 cái Ốp lưng iPhone`
* **Dữ liệu Nhập kho (GRN)**:
  * Thực tế nhà cung cấp chỉ mới giao và nhập kho: `80 cái` (20 cái giao sau)
* **Dữ liệu Hóa đơn OCR quét về**:
  * Nhà cung cấp xuất hóa đơn đòi tiền toàn bộ đơn hàng: `100 cái`
* **Kết quả xử lý**:
  * Lượng thực nhận từ GRN: `80 cái`. Chưa có hóa đơn nào xuất trước đó.
  * Lượng tối đa được phép xuất hóa đơn: `80 cái`.
  * Số lượng trên hóa đơn yêu cầu là `100 cái`, vượt quá lượng thực nhận (100 > 80).
  * **Trạng thái cuối cùng**: `overall_status: "mismatch"` với lỗi `qty_mismatch`.
  * **Hành động tiếp theo**: Hóa đơn bị chặn thanh toán tự động, chờ kế toán xử lý (hoặc nhập nốt 20 cái còn lại rồi chạy lại đối chiếu, hoặc yêu cầu nhà cung cấp xuất lại hóa đơn đúng số lượng 80).

---

## 5. Hệ thống Phát Hiện Bất Thường (OCR Anomaly Detection Pipeline)

Bên cạnh việc so khớp 3 bên, phân hệ `document-intelligence` còn tích hợp một pipeline phân tích và phát hiện bất thường tự động để bảo vệ hệ thống ERP trước các lỗi nhập liệu, hóa đơn giả mạo, hoặc gian lận tài chính (bao gồm kiểm tra toán học, phân tích thống kê giá mua, phát hiện mẫu gian lận MST/từ khóa, phân tích hành vi gửi ngoài giờ, và mô hình Machine Learning Isolation Forest).

Để xem chi tiết hơn về cấu trúc, thuật toán, công thức tính toán điểm rủi ro (Risk Score) và cơ chế ghi vết kiểm toán khi duyệt ghi đè (Manual Override), vui lòng tham khảo tài liệu chuyên biệt:
👉 **[Tài liệu Kỹ thuật OCR Anomaly Detection Pipeline](file:///d:/WorkSpace/TLCN/ERP-MINI/OCR_ANOMALY_DETECTION_GUIDE.md)**

---

## 6. Tham Chiếu Các File Source Code Liên Quan

* [threeWayMatcher.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/threeWayMatcher.service.ts): Chứa logic cốt lõi so khớp số lượng và đơn giá.
* [apInvoice.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/purchase/services/apInvoice.service.ts): Nơi kích hoạt quy trình so khớp khi tạo hóa đơn AP từ OCR.
* [document.controller.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/controllers/document.controller.ts): API upload tài liệu hóa đơn.
* [matchingTolerance.model.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/purchase/models/matchingTolerance.model.ts): Định nghĩa cấu trúc bảng lưu cấu hình dung sai.
* [anomalyDetector.service.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/services/anomaly/anomalyDetector.service.ts): Trình điều phối luồng phân tích bất thường OCR hóa đơn.
* [fileUtils.ts](file:///d:/WorkSpace/TLCN/ERP-MINI/erp-backend/src/modules/document-intelligence/utils/fileUtils.ts): Các helper xử lý file (lưu trữ local, làm sạch tên tệp).
