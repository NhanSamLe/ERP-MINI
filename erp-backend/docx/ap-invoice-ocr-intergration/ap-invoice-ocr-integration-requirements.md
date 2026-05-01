# Tài Liệu Yêu Cầu: Tích Hợp AP Invoice với OCR

## Giới Thiệu

Tài liệu này quy định tích hợp thống nhất giữa tạo AP Invoice với xử lý OCR tài liệu. Hiện tại, hệ thống có hai luồng công việc riêng biệt:

1. **Tạo AP Invoice Thủ Công**: Kế toán viên tạo hóa đơn từ những Đơn Đặt Hàng (PO) đã hoàn thành bằng phương thức `createFromPO()`
2. **Xử Lý Tài Liệu OCR**: Module document-intelligence trích xuất dữ liệu hóa đơn từ tài liệu quét

Mục tiêu là tạo một luồng thống nhất, liền mạch nơi xử lý tài liệu OCR được đưa vào tạo AP Invoice, hỗ trợ cả tạo tự động (khi OCR khớp với PO) và tạo thủ công (khi không có PO). Hệ thống sẽ tận dụng đối soát 3 chiều (PO ↔ Invoice ↔ Phiếu Nhập Kho) để xác thực tính toàn vẹn dữ liệu và giảm thiểu can thiệp thủ công cho các kết quả OCR có độ tin cậy cao.

---

## Bảng Thuật Ngữ

- **AP_Invoice**: Bản ghi Hóa Đơn Phải Trả trong bảng `ap_invoices`
- **AP_Invoice_Line**: Chi tiết dòng hàng hóa trong bảng `ap_invoice_lines`
- **OCR_Engine**: Thành phần AI (GPT-4o-mini Vision) trích xuất dữ liệu có cấu trúc từ tài liệu hóa đơn
- **Invoice_Document**: Bản ghi metadata trong bảng `invoice_documents` lưu trữ trạng thái upload, OCR và kết quả
- **Vendor_Matcher**: Dịch vụ khớp tên nhà cung cấp/mã số thuế được trích xuất với bản ghi Partner bằng fuzzy matching
- **Product_Matcher**: Dịch vụ khớp tên sản phẩm được trích xuất với bản ghi Product
- **Duplicate_Detector**: Dịch vụ xác định hóa đơn trùng lặp theo (invoice_no, supplier_id, branch_id)
- **Three_Way_Matcher**: Dịch vụ xác thực tính nhất quán dữ liệu Invoice ↔ PO ↔ Phiếu Nhập Kho (GRN)
- **GRN**: Phiếu Nhập Kho, được biểu diễn bằng bản ghi `stock_moves` có `type = 'receipt'` và `reference_type = 'purchase_order'`
- **Confidence_Score**: Giá trị số (0.0-1.0) chỉ mức độ chắc chắn của AI khi trích xuất một trường dữ liệu
- **Overall_Confidence**: Trung bình có trọng số độ tin cậy trên các trường quan trọng (invoice_no, vendor_tax_code, total, line items)
- **Partial_Delivery**: Tình huống một PO nhận nhiều lần giao hàng, mỗi lần có một GRN riêng
- **Three_Way_Match_Result**: Kết quả xác thực cho biết trạng thái matched, price_mismatch, hoặc qty_mismatch
- **Pre_Fill**: Tự động điền dữ liệu vào các trường form tạo AP Invoice từ dữ liệu OCR được làm giàu
- **Unified_Entry_Point**: Phương thức dịch vụ duy nhất xử lý cả tạo AP Invoice từ OCR và tạo thủ công
- **Audit_Trail**: Bản ghi hoàn chỉnh về nguồn gốc tạo (manual vs OCR), điểm tin cậy và kết quả đối soát
- **Hệ Thống**: Hệ thống ERP xử lý AP Invoice và xử lý tài liệu OCR

---

## Yêu Cầu

### Yêu Cầu 1: Điểm Vào Thống Nhất Để Tạo AP Invoice

**User Story:** Là một kiến trúc sư hệ thống, tôi muốn có một điểm vào duy nhất, thống nhất để tạo AP Invoice xử lý cả đường dẫn tạo từ OCR và tạo thủ công, để logic kinh doanh được tập trung và dễ bảo trì.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI cung cấp phương thức thống nhất `createAPInvoice()` chấp nhận dữ liệu trích xuất từ OCR hoặc nhập liệu thủ công
2. KHI `createAPInvoice()` được gọi với `source = 'ai_ocr'`, HỆ THỐNG PHẢI xác thực rằng `invoice_document_id` được cung cấp và tham chiếu đến kết quả OCR đã hoàn thành
3. KHI `createAPInvoice()` được gọi với `source = 'manual'`, HỆ THỐNG PHẢI xác thực rằng tất cả các trường bắt buộc được cung cấp trực tiếp (vendor_id, invoice_no, invoice_date, line items)
4. HỆ THỐNG PHẢI tạo AP_Invoice với trường `source` được đặt thành `'manual'` hoặc `'ai_ocr'` để theo dõi nguồn gốc tạo
5. HỆ THỐNG PHẢI lưu trữ `ocr_confidence` trong AP_Invoice khi source là `'ai_ocr'`, và đặt thành `null` khi source là `'manual'`
6. HỆ THỐNG PHẢI thực hiện toàn bộ tạo AP_Invoice và AP_Invoice_Line trong một giao dịch cơ sở dữ liệu duy nhất để đảm bảo tính nguyên tử
7. KHI `createAPInvoice()` hoàn thành thành công, HỆ THỐNG PHẢI trả về AP_Invoice đã tạo với tất cả dữ liệu liên quan (lines, supplier, matching results)

---

### Yêu Cầu 2: Luồng Công Việc OCR-to-AP Invoice

**User Story:** Là một kế toán viên, tôi muốn upload một tài liệu hóa đơn và hệ thống tự động trích xuất dữ liệu, khớp với PO, và tạo AP Invoice với can thiệp thủ công tối thiểu, để thời gian xử lý hóa đơn được giảm từ 5-10 phút xuống còn 1-2 phút.

#### Tiêu Chí Chấp Nhận

1. KHI kế toán viên upload tài liệu hóa đơn qua `POST /api/documents/upload`, HỆ THỐNG PHẢI tạo bản ghi Invoice_Document với `ocr_status = 'pending'`
2. KHI xử lý OCR hoàn thành thành công, HỆ THỐNG PHẢI cập nhật `ocr_status = 'done'` và điền `ocr_result` với các trường được trích xuất
3. KHI `GET /api/documents/:id/result` được gọi sau khi OCR hoàn thành, HỆ THỐNG PHẢI trả về dữ liệu OCR được làm giàu bao gồm:
   - Nhà cung cấp được khớp (bản ghi Partner) với độ tin cậy khớp
   - Sản phẩm được khớp với độ tin cậy khớp cho mỗi dòng hàng
   - Cảnh báo trùng lặp nếu hóa đơn đã tồn tại
   - Kết quả đối soát 3 chiều nếu PO được xác định
4. KHI overall_confidence >= 0.85 VÀ không có hóa đơn trùng lặp VÀ đối soát 3 chiều không có sai lệch, HỆ THỐNG PHẢI chỉ ra rằng hóa đơn sẵn sàng để tạo tự động
5. KHI overall_confidence < 0.85 HOẶC có hóa đơn trùng lặp HOẶC đối soát 3 chiều có sai lệch, HỆ THỐNG PHẢI yêu cầu xem xét thủ công và xác nhận trước khi tạo
6. KHI kế toán viên xác nhận kết quả OCR qua `POST /api/documents/:id/confirm`, HỆ THỐNG PHẢI gọi `createAPInvoice()` với source = 'ai_ocr' và tất cả dữ liệu được làm giàu
7. HỆ THỐNG PHẢI cập nhật `Invoice_Document.purchase_invoice_id` để tham chiếu đến AP_Invoice đã tạo sau khi xác nhận thành công

---

### Yêu Cầu 3: Luồng Công Việc Tạo AP Invoice Thủ Công

**User Story:** Là một kế toán viên, tôi muốn tạo AP Invoice thủ công khi tôi có hóa đơn nhà cung cấp không khớp với bất kỳ PO nào (ví dụ: hóa đơn dịch vụ, chi phí linh tinh), để tôi có thể xử lý tất cả các loại hóa đơn.

**Ví Dụ Trường Hợp Thực Tế:**

1. **Hóa Đơn Dịch Vụ Tư Vấn**: Công ty nhận hóa đơn từ công ty tư vấn XYZ về dịch vụ tư vấn quản lý dự án (50 triệu đồng). Không có PO trước đó vì dịch vụ được gọi điện thoại. Cần tạo AP Invoice để ghi nhận công nợ phải trả.

2. **Hóa Đơn Chi Phí Định Kỳ**: Công ty nhận hóa đơn tiền điện hàng tháng (20 triệu đồng) từ công ty cấp điện. Đây là chi phí định kỳ không có PO. Cần tạo AP Invoice để ghi nhận chi phí.

3. **Hóa Đơn Dịch Vụ Bảo Hành**: Công ty nhận hóa đơn dịch vụ bảo hành máy CNC (15 triệu đồng) từ nhà cung cấp máy móc. Bảo hành được gọi khẩn cấp không có PO. Cần tạo AP Invoice để ghi nhận chi phí bảo hành.

4. **Hóa Đơn Phí Logistics**: Công ty nhận hóa đơn phí vận chuyển hàng nhập khẩu (8 triệu đồng) từ công ty logistics. Phí được tính sau khi giao hàng, không có PO. Cần tạo AP Invoice để ghi nhận chi phí logistics.

5. **Hóa Đơn Điều Chỉnh/Hoàn Tiền**: Công ty nhận hóa đơn điều chỉnh hoàn tiền (-5 triệu đồng) do lỗi hàng hóa trước đó. Đây là điều chỉnh hóa đơn cũ, không có PO mới. Cần tạo AP Invoice để ghi nhận hoàn tiền.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI hỗ trợ tạo AP_Invoice mà không có PO bằng cách gọi `createAPInvoice()` với `po_id = null`
2. KHI `po_id = null`, HỆ THỐNG PHẢI yêu cầu `supplier_id` được cung cấp một cách rõ ràng (vì vẫn cần biết nhà cung cấp để ghi nhận công nợ)
3. KHI `po_id = null`, HỆ THỐNG PHẢI bỏ qua đối soát 3 chiều và đặt `matching_status = 'pending'` với thông báo "Hóa đơn không liên kết PO - không thực hiện đối soát 3 chiều"
4. KHI `po_id = null`, HỆ THỐNG PHẢI vẫn xác thực rằng tất cả các dòng hàng có product_id và unit_price hợp lệ
5. HỆ THỐNG PHẢI cho phép tạo thủ công qua cả lệnh gọi API trực tiếp và qua xác nhận OCR khi kết quả OCR không có PO khớp
6. KHI tạo mà không có PO, HỆ THỐNG PHẢI đặt `source = 'manual'` và `ocr_confidence = null`
7. HỆ THỐNG PHẢI vẫn cho phép kế toán viên submit hóa đơn không có PO để phê duyệt và thanh toán bình thường

---

### Yêu Cầu 4: Logic Quyết Định Tạo Tự Động vs Thủ Công

**User Story:** Là một trưởng phòng tài chính, tôi muốn có các quy tắc rõ ràng, minh bạch về khi nào hóa đơn được tạo tự động so với yêu cầu xác nhận thủ công, để tôi hiểu hành vi của hệ thống và có thể cấu hình các ngưỡng một cách thích hợp.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI xác định các tiêu chí rõ ràng cho tạo tự động:
   - overall_confidence >= 0.85
   - Không có hóa đơn trùng lặp
   - Nhà cung cấp được khớp thành công (matchConfidence >= 0.90)
   - Tất cả sản phẩm được khớp thành công (matchConfidence >= 0.80 cho mỗi dòng)
   - Trạng thái đối soát 3 chiều = 'matched' (nếu PO tồn tại)
2. KHI tất cả tiêu chí được đáp ứng, HỆ THỐNG PHẢI tự động tạo AP_Invoice với `approval_status = 'draft'` và `status = 'draft'`
3. KHI bất kỳ tiêu chí nào không được đáp ứng, HỆ THỐNG PHẢI yêu cầu xác nhận thủ công trước khi tạo
4. KHI xác nhận thủ công được yêu cầu, HỆ THỐNG PHẢI trình bày cho kế toán viên:
   - Lý do cụ thể tại sao tạo tự động không thể thực hiện
   - Các sửa chữa hoặc khớp được đề xuất
   - Tùy chọn ghi đè và tiếp tục với xác nhận thủ công
5. HỆ THỐNG PHẢI ghi nhật ký tất cả các quyết định tạo tự động với dấu thời gian, user_id và tiêu chí được đáp ứng/không được đáp ứng
6. HỆ THỐNG PHẢI ghi nhật ký tất cả các ghi đè thủ công với dấu thời gian, user_id và lý do được cung cấp

---

### Yêu Cầu 5: Tích Hợp Đối Soát 3 Chiều

**User Story:** Là một trưởng phòng tài chính, tôi muốn hệ thống tự động xác thực rằng số lượng hóa đơn và giá khớp với PO và hàng hóa thực tế được nhận, để tôi có thể phát hiện sai lệch sớm và ngăn chặn thanh toán quá mức.

#### Tiêu Chí Chấp Nhận

1. KHI AP_Invoice được tạo với `po_id` hợp lệ, HỆ THỐNG PHẢI ngay lập tức thực hiện đối soát 3 chiều
2. HỆ THỐNG PHẢI lấy tất cả bản ghi GRN (stock_moves với type='receipt', reference_type='purchase_order', reference_id=po_id, status='posted')
3. CHO MỖI dòng sản phẩm trong AP_Invoice, HỆ THỐNG PHẢI tính toán:
   - `total_received`: Tổng số lượng từ tất cả dòng GRN cho sản phẩm đó
   - `previously_invoiced`: Tổng số lượng từ các AP_Invoice_Line khác (status != 'cancelled') cho sản phẩm đó
   - `remaining_to_invoice`: total_received - previously_invoiced
4. KHI `invoice_line.quantity > remaining_to_invoice`, HỆ THỐNG PHẢI đánh dấu dòng đó là `qty_mismatch` với thông báo "Số lượng hóa đơn {qty} vượt quá số lượng còn lại để hóa đơn {remaining}"
5. KHI `ABS(invoice_line.unit_price - po_line.unit_price) > 0`, HỆ THỐNG PHẢI đánh dấu dòng đó là `price_mismatch` với thông báo "Lệch giá: Hóa đơn {invoice_price} vs PO {po_price}"
6. KHI tất cả các dòng được đánh dấu `matched`, HỆ THỐNG PHẢI đặt `matching_status = 'matched'`
7. KHI có ít nhất một dòng `price_mismatch` hoặc `qty_mismatch`, HỆ THỐNG PHẢI đặt `matching_status = 'mismatch'`
8. HỆ THỐNG PHẢI lưu trữ kết quả đối soát trong `ap_invoices.matching_status` và `ap_invoices.matching_details` (JSON)
9. HỆ THỐNG PHẢI lưu trữ kết quả đối soát từng dòng trong `ap_invoice_lines.matching_result`
10. KHI `matching_status = 'mismatch'`, HỆ THỐNG PHẢI bao gồm thông tin sai lệch chi tiết trong phản hồi nhưng vẫn cho phép tạo hóa đơn (với xác nhận thủ công)

---

### Yêu Cầu 6: Hỗ Trợ Giao Hàng Từng Phần

**User Story:** Là một kế toán viên, tôi muốn hệ thống xử lý chính xác các tình huống mà một PO nhận nhiều lần giao hàng (giao hàng từng phần), để tôi có thể hóa đơn cho mỗi lần giao hàng riêng biệt mà không bị tính trùng.

#### Tiêu Chí Chấp Nhận

1. KHI một PO có nhiều bản ghi GRN (giao hàng từng phần), HỆ THỐNG PHẢI tổng hợp số lượng trên tất cả các GRN khi tính `total_received`
2. KHI tính `remaining_to_invoice`, HỆ THỐNG PHẢI tính đến số lượng đã được hóa đơn trong các AP_Invoice trước đó cho cùng một PO
3. KHI số lượng dòng AP_Invoice bằng `remaining_to_invoice`, HỆ THỐNG PHẢI đánh dấu là `matched` ngay cả khi `total_received > po_line.quantity`
4. HỆ THỐNG PHẢI cho phép nhiều AP_Invoice cho cùng một PO miễn là `remaining_to_invoice > 0` cho ít nhất một sản phẩm
5. KHI `remaining_to_invoice = 0` cho tất cả sản phẩm trong một PO, HỆ THỐNG PHẢI ngăn chặn tạo AP_Invoice mới cho PO đó với lỗi "Tất cả số lượng cho PO này đã được hóa đơn"
6. HỆ THỐNG PHẢI cung cấp báo cáo cho mỗi PO: total_ordered, total_received, total_invoiced, remaining_to_invoice

---

### Yêu Cầu 7: Giải Quyết Xung Đột và Xác Thực Dữ Liệu

**User Story:** Là một kế toán viên, tôi muốn hệ thống xác định rõ ràng và giúp giải quyết xung đột giữa dữ liệu OCR và dữ liệu PO, để tôi có thể đưa ra quyết định sáng suốt về dữ liệu nào để tin tưởng.

#### Tiêu Chí Chấp Nhận

1. KHI tên nhà cung cấp được trích xuất từ OCR không khớp với bản ghi Partner được khớp, HỆ THỐNG PHẢI hiển thị cả hai tên và yêu cầu xác nhận
2. KHI tên sản phẩm được trích xuất từ OCR không khớp với bản ghi Product được khớp, HỆ THỐNG PHẢI hiển thị các khớp được đề xuất và cho phép lựa chọn thủ công
3. KHI unit_price được trích xuất từ OCR khác với unit_price của PO, HỆ THỐNG PHẢI làm nổi bật sự khác biệt và yêu cầu xác nhận rõ ràng để tiếp tục
4. KHI số lượng được trích xuất từ OCR khác với số lượng PO, HỆ THỐNG PHẢI kiểm tra xem nó có nằm trong remaining_to_invoice không và cờ nếu không
5. KHI tổng được trích xuất từ OCR không khớp với tổng các dòng hàng, HỆ THỐNG PHẢI cờ là vấn đề chất lượng dữ liệu và yêu cầu xác minh thủ công
6. KHI ngày hóa đơn được trích xuất từ OCR cách đây hơn 30 ngày, HỆ THỐNG PHẢI cờ là hóa đơn trùng lặp hoặc hóa đơn muộn tiềm ẩn
7. HỆ THỐNG PHẢI cung cấp phần "Sửa Chữa Được Đề Xuất" hiển thị:
   - Khớp nhà cung cấp được đề xuất với điểm tin cậy
   - Khớp sản phẩm được đề xuất với điểm tin cậy
   - Số lượng được đề xuất dựa trên remaining_to_invoice
   - Giá được đề xuất từ PO

---

### Yêu Cầu 8: Dấu Vết Kiểm Toán và Tuân Thủ

**User Story:** Là một sĩ quan tuân thủ, tôi muốn có dấu vết kiểm toán hoàn chỉnh cho tất cả tạo AP Invoice (cả thủ công và OCR), để tôi có thể theo dõi nguồn gốc dữ liệu và đảm bảo các kiểm soát tài chính được duy trì.

#### Tiêu Chí Chấp Nhận

1. KHI AP_Invoice được tạo, HỆ THỐNG PHẢI ghi lại:
   - `source` (manual | ai_ocr)
   - `created_by` (user_id)
   - `created_at` (dấu thời gian)
   - `invoice_document_id` (nếu source = ai_ocr)
   - `ocr_confidence` (nếu source = ai_ocr)
2. KHI source = ai_ocr, HỆ THỐNG PHẢI lưu trữ trong JSON `ap_invoices.matching_details`:
   - Độ tin cậy trích xuất OCR cho mỗi trường
   - Độ tin cậy khớp nhà cung cấp và matched_partner_id
   - Độ tin cậy khớp sản phẩm cho mỗi dòng
   - Kết quả đối soát 3 chiều
3. KHI kế toán viên ghi đè quyết định tạo tự động, HỆ THỐNG PHẢI ghi nhật ký:
   - Dấu thời gian ghi đè
   - User_id thực hiện ghi đè
   - Lý do ghi đè (nếu được cung cấp)
   - Tiêu chí quyết định ban đầu không được đáp ứng
4. KHI đối soát 3 chiều phát hiện sai lệch, HỆ THỐNG PHẢI ghi nhật ký:
   - Chi tiết sai lệch (qty_mismatch | price_mismatch)
   - Giá trị dự kiến vs thực tế
   - Liệu hóa đơn có được tạo bất chấp sai lệch không
5. HỆ THỐNG PHẢI cung cấp báo cáo kiểm toán hiển thị:
   - Tất cả AP_Invoice được tạo trong phạm vi ngày
   - Nguồn gốc (manual vs OCR)
   - Độ tin cậy OCR (nếu có)
   - Trạng thái đối soát
   - Bất kỳ ghi đè hoặc ngoại lệ nào
6. HỆ THỐNG PHẢI duy trì bản ghi kiểm toán bất biến không thể được sửa đổi sau khi tạo

---

### Yêu Cầu 9: Xử Lý Lỗi và Trường Hợp Đặc Biệt

**User Story:** Là một kế toán viên, tôi muốn hệ thống xử lý các tình huống bất thường một cách nhẹ nhàng và cung cấp hướng dẫn rõ ràng về cách giải quyết vấn đề, để tôi không bao giờ bị chặn và luôn có thể tiếp tục với nhập liệu thủ công nếu cần.

#### Tiêu Chí Chấp Nhận

1. NẾU xử lý OCR thất bại (timeout, lỗi API, file không hợp lệ), HỆ THỐNG PHẢI:
   - Đặt `ocr_status = 'failed'`
   - Lưu trữ thông báo lỗi trong `ocr_raw_text`
   - Cung cấp tùy chọn để thử lại hoặc nhập liệu thủ công
   - Thử lại tự động một lần sau 3 giây trước khi đánh dấu là thất bại
2. NẾU khớp nhà cung cấp thất bại (không tìm thấy khớp), HỆ THỐNG PHẢI:
   - Trả về `matchedPartnerId = null`
   - Cung cấp `vendorSuggestion` với khớp gần nhất
   - Cung cấp `createVendorUrl` để nhanh chóng tạo nhà cung cấp mới
   - Cho phép lựa chọn nhà cung cấp thủ công
3. NẾU khớp sản phẩm thất bại cho một dòng hàng, HỆ THỐNG PHẢI:
   - Trả về `matchedProductId = null` cho dòng đó
   - Cung cấp gợi ý sản phẩm
   - Cho phép lựa chọn sản phẩm thủ công
   - Đánh dấu dòng là `needsManualSelection = true`
4. NẾU phát hiện hóa đơn trùng lặp, HỆ THỐNG PHẢI:
   - Hiển thị chi tiết hóa đơn hiện có (invoice_no, ngày, số tiền)
   - Cung cấp tùy chọn để xem hóa đơn hiện có
   - Yêu cầu xác nhận rõ ràng để tiếp tục tạo
   - Ghi nhật ký ghi đè với lý do
5. NẾU đối soát 3 chiều cho thấy qty_mismatch, HỆ THỐNG PHẢI:
   - Hiển thị số lượng dự kiến vs thực tế
   - Hiển thị giá trị remaining_to_invoice
   - Cho phép tạo với xác nhận rõ ràng
   - Yêu cầu bình luận giải thích sai lệch
6. NẾU đối soát 3 chiều cho thấy price_mismatch, HỆ THỐNG PHẢI:
   - Hiển thị giá PO vs giá hóa đơn
   - Hiển thị số tiền chênh lệch giá
   - Cho phép tạo với xác nhận rõ ràng
   - Yêu cầu bình luận giải thích sai lệch
7. NẾU upload file vượt quá 10MB, HỆ THỐNG PHẢI từ chối với thông báo rõ ràng "Kích thước file vượt quá giới hạn 10MB"
8. NẾU định dạng file không được hỗ trợ (không phải PDF, JPG, JPEG, PNG), HỆ THỐNG PHẢI từ chối với thông báo rõ ràng "Định dạng file không được hỗ trợ. Vui lòng upload file PDF hoặc ảnh"
9. NẾU độ tin cậy OCR rất thấp (< 0.50), HỆ THỐNG PHẢI khuyến nghị nhập liệu thủ công thay vì tạo tự động

---

### Yêu Cầu 10: Trải Nghiệm Người Dùng và Can Thiệp Thủ Công Tối Thiểu

**User Story:** Là một kế toán viên, tôi muốn hệ thống giảm thiểu công việc thủ công bằng cách tạo tự động hóa đơn khi độ tin cậy cao, trong khi vẫn yêu cầu xem xét cho các trường hợp đặc biệt, để tôi có thể xử lý 80% hóa đơn chỉ bằng một cú nhấp chuột.

#### Tiêu Chí Chấp Nhận

1. KHI kết quả OCR sẵn sàng và đáp ứng tiêu chí tạo tự động, HỆ THỐNG PHẢI hiển thị:
   - Trạng thái "Sẵn sàng để tạo tự động"
   - Tóm tắt dữ liệu được trích xuất
   - Điểm tin cậy cho các trường chính
   - Nút "Tạo Hóa Đơn" để tạo một cú nhấp chuột
2. KHI kết quả OCR yêu cầu xem xét thủ công, HỆ THỐNG PHẢI hiển thị:
   - Lý do cụ thể tại sao tạo tự động không thể thực hiện
   - Các trường được làm nổi bật cần xem xét
   - Các sửa chữa được đề xuất
   - Nút "Xem Xét và Tạo" để tiếp tục với xác nhận thủ công
3. KHI kế toán viên nhấp "Tạo Hóa Đơn", HỆ THỐNG PHẢI:
   - Tạo AP_Invoice ngay lập tức
   - Hiển thị thông báo thành công với số hóa đơn
   - Cung cấp liên kết để xem hóa đơn đã tạo
   - Cung cấp liên kết đến hóa đơn tiếp theo để xử lý
4. HỆ THỐNG PHẢI hỗ trợ xử lý hàng loạt nơi kế toán viên có thể:
   - Chọn nhiều kết quả OCR đáp ứng tiêu chí tạo tự động
   - Tạo tất cả hóa đơn bằng hành động "Tạo Hàng Loạt" duy nhất
   - Xem tóm tắt các hóa đơn đã tạo
5. HỆ THỐNG PHẢI cung cấp bảng điều khiển hiển thị:
   - Số lượng hóa đơn chờ xử lý OCR
   - Số lượng hóa đơn sẵn sàng để tạo tự động
   - Số lượng hóa đơn yêu cầu xem xét thủ công
   - Thời gian xử lý trung bình cho mỗi hóa đơn
6. HỆ THỐNG PHẢI cho phép kế toán viên cấu hình ngưỡng tạo tự động:
   - Độ tin cậy tối thiểu cho tạo tự động
   - Độ tin cậy khớp nhà cung cấp tối thiểu
   - Độ tin cậy khớp sản phẩm tối thiểu
   - Liệu có tạo tự động khi đối soát 3 chiều có sai lệch không

---

### Yêu Cầu 11: Tích Hợp với Luồng Công Việc AP Invoice Hiện Có

**User Story:** Là một kiến trúc sư hệ thống, tôi muốn tích hợp OCR mới hoạt động liền mạch với các luồng công việc AP Invoice hiện có (phê duyệt, thanh toán, đăng GL), để không có chức năng hiện có bị phá vỡ.

#### Tiêu Chí Chấp Nhận

1. KHI AP_Invoice được tạo qua OCR, HỆ THỐNG PHẢI hỗ trợ tất cả các hoạt động hiện có:
   - Gửi để phê duyệt
   - Phê duyệt/từ chối
   - Đăng vào GL
   - Tạo phân bổ thanh toán
   - Hủy hóa đơn
2. KHI AP_Invoice được tạo qua OCR được phê duyệt, HỆ THỐNG PHẢI thực hiện logic đăng GL giống như hóa đơn được tạo thủ công
3. HỆ THỐNG PHẢI KHÔNG yêu cầu bất kỳ thay đổi nào đối với luồng công việc phê duyệt hiện có dựa trên nguồn gốc tạo
4. KHI lọc AP_Invoice, HỆ THỐNG PHẢI hỗ trợ lọc theo `source` (manual | ai_ocr)
5. KHI xem chi tiết AP_Invoice, HỆ THỐNG PHẢI hiển thị:
   - Nguồn gốc tạo (Manual | OCR)
   - Độ tin cậy OCR (nếu có)
   - Trạng thái đối soát và chi tiết (nếu có)
   - Liên kết đến Invoice_Document gốc (nếu có)
6. HỆ THỐNG PHẢI duy trì khả năng tương thích ngược với phương thức `createFromPO()` hiện có (có thể bị loại bỏ nhưng không được phá vỡ)
7. KHI mã hiện có gọi `createFromPO()`, HỆ THỐNG PHẢI nội bộ gọi `createAPInvoice()` với `source = 'manual'` và tham số `po_id`

---

### Yêu Cầu 12: Cập Nhật Lược Đồ Dữ Liệu

**User Story:** Là một kiến trúc sư cơ sở dữ liệu, tôi muốn lược đồ hỗ trợ tích hợp OCR trong khi duy trì khả năng tương thích ngược, để dữ liệu hiện có không bị ảnh hưởng.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI thêm các cột sau vào bảng `ap_invoices`:
   - `source` (ENUM: 'manual' | 'ai_ocr', DEFAULT 'manual')
   - `invoice_document_id` (BIGINT, FK to invoice_documents, nullable)
   - `ocr_confidence` (DECIMAL(5,4), nullable)
   - `matching_status` (ENUM: 'pending' | 'matched' | 'mismatch', DEFAULT 'pending')
   - `matching_details` (JSONB, nullable)
   - `supplier_id` (BIGINT, NOT NULL) - để hỗ trợ hóa đơn không có PO
2. HỆ THỐNG PHẢI thêm các cột sau vào bảng `ap_invoice_lines`:
   - `po_line_id` (BIGINT, FK to purchase_order_lines, nullable)
   - `grn_line_id` (BIGINT, FK to stock_move_lines, nullable)
   - `matching_result` (ENUM: 'matched' | 'price_mismatch' | 'qty_mismatch', nullable)
3. HỆ THỐNG PHẢI tạo bảng `invoice_documents` với các cột:
   - `id` (BIGINT PK)
   - `branch_id` (BIGINT NOT NULL)
   - `purchase_invoice_id` (BIGINT FK to ap_invoices, nullable)
   - `original_filename` (VARCHAR(255))
   - `file_path` (VARCHAR(500))
   - `file_type` (ENUM: 'pdf' | 'jpg' | 'png')
   - `ocr_status` (ENUM: 'pending' | 'processing' | 'done' | 'failed', DEFAULT 'pending')
   - `ocr_engine` (ENUM: 'openai_vision' | 'google_doc_ai', DEFAULT 'openai_vision')
   - `ocr_raw_text` (TEXT, nullable)
   - `ocr_result` (JSONB, nullable)
   - `ocr_confidence` (DECIMAL(5,4), nullable)
   - `processing_time_ms` (INTEGER, nullable)
   - `created_by` (BIGINT NOT NULL)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)
4. HỆ THỐNG PHẢI tạo chỉ mục:
   - `invoice_documents(branch_id, ocr_status)` để tối ưu truy vấn polling
   - `ap_invoices(invoice_no, supplier_id, branch_id)` để tối ưu Duplicate_Detector
   - `ap_invoices(source, created_at)` để báo cáo
5. KHI migration chạy trên cơ sở dữ liệu hiện có, HỆ THỐNG PHẢI:
   - Đặt `source = 'manual'` cho tất cả ap_invoices hiện có
   - Đặt `matching_status = 'pending'` cho tất cả ap_invoices hiện có
   - Đặt `supplier_id` từ purchase_order.supplier_id liên quan
6. HỆ THỐNG PHẢI duy trì tính toàn vẹn tham chiếu với khóa ngoài và quy tắc xếp tầng

---

### Yêu Cầu 13: Báo Cáo và Phân Tích

**User Story:** Là một trưởng phòng tài chính, tôi muốn có khả năng hiển thị các chỉ số xử lý OCR và các mẫu tạo hóa đơn, để tôi có thể xác định các nút thắt và tối ưu hóa quy trình.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI cung cấp báo cáo hiển thị:
   - Tổng hóa đơn được xử lý (manual vs OCR)
   - Điểm tin cậy OCR trung bình
   - Phần trăm hóa đơn được tạo tự động so với yêu cầu xem xét thủ công
   - Thời gian xử lý trung bình cho mỗi hóa đơn
   - Tỷ lệ lỗi và các loại lỗi phổ biến
2. HỆ THỐNG PHẢI cung cấp báo cáo hiển thị:
   - Hóa đơn có sai lệch đối soát 3 chiều
   - Phân tích theo loại sai lệch (qty_mismatch vs price_mismatch)
   - Nhà cung cấp có tỷ lệ sai lệch cao nhất
   - Sản phẩm có tỷ lệ sai lệch cao nhất
3. HỆ THỐNG PHẢI cung cấp báo cáo hiển thị:
   - Hóa đơn trùng lặp được phát hiện và xử lý
   - Nhà cung cấp có tỷ lệ trùng lặp cao nhất
   - Thời gian giữa phát hiện trùng lặp và giải quyết
4. HỆ THỐNG PHẢI cung cấp báo cáo hiển thị:
   - Phân phối độ tin cậy OCR (biểu đồ)
   - Phân phối độ tin cậy khớp nhà cung cấp
   - Phân phối độ tin cậy khớp sản phẩm
5. HỆ THỐNG PHẢI hỗ trợ lọc báo cáo theo:
   - Phạm vi ngày
   - Chi nhánh
   - Nhà cung cấp
   - Ngưỡng độ tin cậy OCR
   - Trạng thái đối soát

---

### Yêu Cầu 14: Cấu Hình và Khả Mở Rộng

**User Story:** Là một quản trị viên hệ thống, tôi muốn cấu hình hành vi OCR và ngưỡng mà không cần thay đổi mã, để tôi có thể thích ứng với các yêu cầu kinh doanh khác nhau.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG PHẢI hỗ trợ cấu hình qua các biến môi trường:
   - `OCR_ENGINE` (openai_vision | google_doc_ai)
   - `OCR_MIN_CONFIDENCE_AUTO_CREATE` (mặc định 0.85)
   - `VENDOR_MATCH_MIN_CONFIDENCE` (mặc định 0.90)
   - `PRODUCT_MATCH_MIN_CONFIDENCE` (mặc định 0.80)
   - `AUTO_CREATE_WITH_MISMATCHES` (true | false, mặc định false)
   - `MAX_FILE_SIZE_MB` (mặc định 10)
   - `OCR_TIMEOUT_SECONDS` (mặc định 25)
2. HỆ THỐNG PHẢI hỗ trợ ghi đè cấu hình theo chi nhánh được lưu trữ trong cơ sở dữ liệu
3. HỆ THỐNG PHẢI ghi nhật ký tất cả các giá trị cấu hình khi khởi động để kiểm toán
4. HỆ THỐNG PHẢI xác thực các giá trị cấu hình và thất bại nhanh nếu không hợp lệ
5. HỆ THỐNG PHẢI hỗ trợ mẫu factory cho các OCR engine để cho phép thêm các engine mới mà không cần thay đổi mã

---

## Tóm Tắt Tiêu Chí Chấp Nhận

Tài liệu yêu cầu này xác định tích hợp toàn diện của tạo AP Invoice với xử lý tài liệu OCR. Các tiêu chí chấp nhận chính tập trung vào:

1. **Điểm Vào Thống Nhất**: Phương thức `createAPInvoice()` duy nhất xử lý cả đường dẫn OCR và thủ công
2. **Quyết Định Tạo Tự Động vs Thủ Công**: Tiêu chí rõ ràng cho khi nào tạo tự động so với yêu cầu xác nhận thủ công
3. **Đối Soát 3 Chiều**: Xác thực tính nhất quán dữ liệu Invoice ↔ PO ↔ GRN
4. **Hỗ Trợ Giao Hàng Từng Phần**: Xử lý chính xác nhiều lần giao hàng cho một PO
5. **Giải Quyết Xung Đột**: Xác định rõ ràng và giải quyết xung đột dữ liệu
6. **Dấu Vết Kiểm Toán**: Theo dõi hoàn chỉnh nguồn gốc tạo và logic quyết định
7. **Xử Lý Lỗi**: Xử lý nhẹ nhàng các trường hợp đặc biệt với hướng dẫn rõ ràng cho người dùng
8. **Can Thiệp Thủ Công Tối Thiểu**: 80% hóa đơn được tạo tự động với độ tin cậy cao
9. **Khả Năng Tương Thích Ngược**: Tích hợp liền mạch với luồng công việc AP Invoice hiện có
10. **Cập Nhật Lược Đồ**: Thay đổi cơ sở dữ liệu hỗ trợ tích hợp OCR
11. **Báo Cáo**: Khả năng hiển thị các chỉ số OCR và mẫu
12. **Cấu Hình**: Cấu hình linh hoạt mà không cần thay đổi mã
13. **Khả Mở Rộng**: Hỗ trợ nhiều OCR engine qua mẫu factory

---

## Các Bước Tiếp Theo

Tài liệu yêu cầu này sẵn sàng để xem xét. Sau khi phê duyệt, nhóm sẽ tiến hành:

1. **Giai Đoạn Thiết Kế**: Tạo tài liệu thiết kế kỹ thuật chi tiết
2. **Tạo Tác Vụ**: Chia nhỏ yêu cầu thành các tác vụ triển khai
3. **Triển Khai**: Phát triển dịch vụ tạo AP Invoice thống nhất
4. **Kiểm Tra**: Tạo các bài kiểm tra dựa trên thuộc tính cho đối soát 3 chiều và tích hợp OCR
5. **Triển Khai**: Triển khai tích hợp OCR với giám sát và kế hoạch quay lại
