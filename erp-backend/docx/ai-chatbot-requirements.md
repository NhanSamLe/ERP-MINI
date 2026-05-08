# Tài liệu Yêu cầu — AI Chatbot ERP

## Giới thiệu

Tính năng AI Chatbot cho phép người dùng ERP đặt câu hỏi bằng ngôn ngữ tự nhiên (tiếng Việt hoặc tiếng Anh) và nhận câu trả lời dựa trên dữ liệu thực tế trong hệ thống. Chatbot sử dụng LLM (OpenAI/Gemini) kết hợp function calling để gọi các API nội bộ của ERP, sau đó tổng hợp kết quả thành câu trả lời tự nhiên.

Tính năng bao gồm:

- Giao diện chat trên frontend (floating button)
- Backend xử lý hội thoại và function calling
- Bộ công cụ (tools) ánh xạ tới các module: Inventory, Sales, Purchase, CRM, HRM, Finance

---

## Bảng thuật ngữ

| Thuật ngữ            | Giải thích                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| **Chatbot**          | Thành phần AI xử lý câu hỏi ngôn ngữ tự nhiên và trả lời dựa trên dữ liệu ERP |
| **LLM**              | Mô hình ngôn ngữ lớn (OpenAI GPT hoặc Google Gemini)                          |
| **Function Calling** | Cơ chế LLM yêu cầu gọi một hàm cụ thể với tham số trích xuất từ câu hỏi       |
| **Tool**             | Một hàm được đăng ký với LLM, ánh xạ tới API endpoint của ERP                 |
| **Conversation**     | Một phiên hội thoại gồm nhiều lượt hỏi-đáp                                    |
| **Message**          | Một lượt hỏi hoặc đáp trong Conversation                                      |
| **Chat UI**          | Giao diện chat trên frontend React/TypeScript                                 |
| **Chatbot Service**  | Backend service Node.js/Express xử lý logic hội thoại                         |
| **Tool Registry**    | Danh sách các Tool được đăng ký, mỗi Tool có schema mô tả tham số             |
| **Context Window**   | Số lượng Message tối đa gửi kèm mỗi lần gọi LLM để duy trì ngữ cảnh           |

---

## Yêu cầu

### Yêu cầu 1: Giao diện Chat

**User Story:** Là người dùng, tôi muốn có giao diện chat có thể truy cập từ bất kỳ trang nào trong ERP, để tôi có thể đặt câu hỏi về dữ liệu mà không cần rời khỏi trang hiện tại.

#### Tiêu chí chấp nhận

1. Chat UI phải hiển thị một nút chat cố định ở góc dưới bên phải của mọi trang trong ứng dụng ERP.
2. Khi người dùng nhấn nút chat, Chat UI phải mở một panel hiển thị lịch sử hội thoại và ô nhập liệu.
3. Khi người dùng nhấn ra ngoài panel hoặc nhấn nút đóng, Chat UI phải đóng panel mà không mất lịch sử hội thoại.
4. Chat UI phải hiển thị mỗi Message với sự phân biệt trực quan giữa tin nhắn của người dùng và tin nhắn của Chatbot.
5. Khi Chatbot đang tạo phản hồi, Chat UI phải hiển thị chỉ báo loading cho đến khi nhận được phản hồi đầy đủ.
6. Khi người dùng gửi tin nhắn, Chat UI phải vô hiệu hóa ô nhập liệu cho đến khi nhận được phản hồi từ Chatbot.
7. Chat UI phải hỗ trợ nhập tối thiểu 1000 ký tự mỗi tin nhắn.
8. Khi lịch sử hội thoại vượt quá vùng hiển thị, Chat UI phải tự động cuộn xuống tin nhắn mới nhất.

---

### Yêu cầu 2: Gửi và nhận tin nhắn

**User Story:** Là người dùng, tôi muốn gửi câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời bằng cùng ngôn ngữ đó, để tôi có thể khai thác dữ liệu ERP mà không cần biết SQL hay điều hướng menu.

#### Tiêu chí chấp nhận

1. Khi người dùng gửi tin nhắn, Chatbot Service phải gửi tin nhắn cùng với lịch sử Conversation hiện tại đến LLM.
2. Chatbot Service phải duy trì Context Window gồm 20 Message gần nhất mỗi Conversation để cung cấp ngữ cảnh cho LLM.
3. Khi LLM trả về phản hồi văn bản (không có Function Calling), Chatbot Service phải trả phản hồi đó trực tiếp về Chat UI.
4. Khi LLM yêu cầu Function Calling, Chatbot Service phải thực thi Tool tương ứng và trả kết quả về LLM để tạo câu trả lời cuối cùng.
5. Chatbot Service phải phản hồi mỗi tin nhắn người dùng trong vòng 30 giây.
6. Nếu dịch vụ LLM không khả dụng, Chatbot Service phải trả về thông báo lỗi cho người dùng.
7. Nếu việc thực thi Tool thất bại, Chatbot Service phải trả chi tiết lỗi về LLM để LLM thông báo cho người dùng bằng ngôn ngữ tự nhiên.
8. Chatbot Service phải hỗ trợ cả tiếng Việt và tiếng Anh, và phản hồi bằng cùng ngôn ngữ với câu hỏi của người dùng.

---

### Yêu cầu 3: Quản lý lịch sử hội thoại

**User Story:** Là người dùng, tôi muốn lịch sử hội thoại được lưu lại, để tôi có thể xem lại các câu hỏi và câu trả lời trước đó.

#### Tiêu chí chấp nhận

1. Chatbot Service phải lưu mỗi Conversation và các Message của nó vào cơ sở dữ liệu.
2. Khi người dùng mở Chat UI lần đầu trong một phiên, Chatbot Service phải tạo một Conversation mới gắn với người dùng đó.
3. Chat UI phải hiển thị danh sách các Conversation cũ, mỗi Conversation được nhận dạng bằng tin nhắn đầu tiên hoặc tiêu đề được tạo tự động.
4. Khi người dùng chọn một Conversation cũ, Chat UI phải tải và hiển thị tất cả Message của Conversation đó.
5. Khi người dùng nhấn "Cuộc trò chuyện mới", Chatbot Service phải tạo Conversation mới và Chat UI phải xóa màn hình hiển thị hiện tại.
6. Chatbot Service phải gắn mỗi Conversation với ID người dùng và ID chi nhánh đã xác thực.
7. Khi người dùng yêu cầu danh sách Conversation, Chatbot Service chỉ được trả về các Conversation thuộc về người dùng đó.

---

### Yêu cầu 4: Tool — Truy vấn tồn kho (Inventory)

**User Story:** Là người dùng, tôi muốn hỏi về mức tồn kho, lô hàng sắp hết hạn và lịch sử dịch chuyển kho, để tôi có thể đưa ra quyết định kho hàng nhanh chóng.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_stock_balance` nhận tham số: `product_name` (chuỗi), `warehouse_name` (chuỗi, tùy chọn), `location_name` (chuỗi, tùy chọn).
2. Khi tool `get_stock_balance` được gọi, Chatbot Service phải truy vấn dữ liệu tồn kho và trả về số lượng, đơn vị, kho, và vị trí.
3. Tool Registry phải có tool `get_expiring_lots` nhận tham số: `days` (số nguyên, mặc định 14).
4. Khi tool `get_expiring_lots` được gọi, Chatbot Service phải trả về số lô, tên sản phẩm, ngày hết hạn và số lượng còn lại.
5. Tool Registry phải có tool `get_stock_movement` nhận tham số: `product_name` (tùy chọn), `warehouse_name` (tùy chọn), `from_date` (tùy chọn), `to_date` (tùy chọn).
6. Khi tool `get_stock_movement` được gọi, Chatbot Service phải trả về loại phiếu, số lượng, ngày và thông tin kho.

---

### Yêu cầu 5: Tool — Truy vấn doanh thu và bán hàng (Sales)

**User Story:** Là người dùng, tôi muốn hỏi về doanh thu, khách hàng mua nhiều nhất và trạng thái đơn hàng, để tôi có thể theo dõi hiệu suất bán hàng một cách tự nhiên.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_sales_revenue` nhận tham số: `period` (chuỗi: "this_month", "last_month", "this_quarter", "this_year"), `from_date` (tùy chọn), `to_date` (tùy chọn).
2. Khi tool `get_sales_revenue` được gọi, Chatbot Service phải trả về tổng doanh thu, số lượng hóa đơn và nhãn kỳ.
3. Tool Registry phải có tool `get_top_customers` nhận tham số: `period` (chuỗi), `limit` (số nguyên, mặc định 10).
4. Khi tool `get_top_customers` được gọi, Chatbot Service phải trả về tên khách hàng, tổng giá trị mua và số đơn hàng.
5. Tool Registry phải có tool `get_sale_orders` nhận tham số: `status` (tùy chọn), `customer_name` (tùy chọn), `from_date` (tùy chọn), `to_date` (tùy chọn).
6. Khi tool `get_sale_orders` được gọi, Chatbot Service phải trả về số đơn, khách hàng, tổng tiền, trạng thái và ngày.

---

### Yêu cầu 6: Tool — Truy vấn mua hàng (Purchase)

**User Story:** Là người dùng, tôi muốn hỏi về đơn mua hàng và công nợ phải trả, để tôi có thể theo dõi tình trạng mua sắm một cách tự nhiên.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_purchase_orders` nhận tham số: `status` (tùy chọn), `supplier_name` (tùy chọn), `from_date` (tùy chọn), `to_date` (tùy chọn).
2. Khi tool `get_purchase_orders` được gọi, Chatbot Service phải trả về số đơn, nhà cung cấp, tổng tiền, trạng thái và ngày.
3. Tool Registry phải có tool `get_payables` nhận tham số: `supplier_name` (tùy chọn), `overdue_only` (boolean, mặc định false).
4. Khi tool `get_payables` được gọi, Chatbot Service phải trả về tên nhà cung cấp, số hóa đơn, số tiền còn nợ, ngày đến hạn và trạng thái quá hạn.

---

### Yêu cầu 7: Tool — Truy vấn CRM

**User Story:** Là người dùng, tôi muốn hỏi về leads, cơ hội bán hàng và hoạt động sắp tới, để tôi có thể nắm bắt tổng quan CRM nhanh chóng.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_crm_summary` nhận tham số: `period` (chuỗi: "this_month", "last_month", "this_quarter").
2. Khi tool `get_crm_summary` được gọi, Chatbot Service phải trả về tổng số leads, cơ hội, tổng giá trị cơ hội và tỷ lệ chuyển đổi.
3. Tool Registry phải có tool `get_upcoming_activities` nhận tham số: `days` (số nguyên, mặc định 7).
4. Khi tool `get_upcoming_activities` được gọi, Chatbot Service phải trả về loại hoạt động, lead/cơ hội liên quan, người phụ trách và ngày đến hạn.

---

### Yêu cầu 8: Tool — Truy vấn HRM

**User Story:** Là người dùng, tôi muốn hỏi về chấm công và bảng lương nhân viên, để tôi có thể nắm bắt thông tin HR nhanh chóng.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_attendance_summary` nhận tham số: `period` (chuỗi: "this_month", "last_month"), `employee_name` (tùy chọn).
2. Khi tool `get_attendance_summary` được gọi, Chatbot Service phải trả về tên nhân viên, tổng ngày làm việc, tổng ngày vắng và tổng số lần đi trễ.
3. Tool Registry phải có tool `get_payroll_summary` nhận tham số: `period` (chuỗi: "this_month", "last_month").
4. Khi tool `get_payroll_summary` được gọi, Chatbot Service phải trả về tổng chi phí lương, số nhân viên được trả lương và nhãn kỳ.

---

### Yêu cầu 9: Tool — Truy vấn Finance

**User Story:** Là người dùng, tôi muốn hỏi về số dư tài khoản và bút toán kế toán, để tôi có thể tra cứu dữ liệu tài chính mà không cần mở module Finance.

#### Tiêu chí chấp nhận

1. Tool Registry phải có tool `get_account_balance` nhận tham số: `account_code` (tùy chọn), `account_name` (tùy chọn).
2. Khi tool `get_account_balance` được gọi, Chatbot Service phải trả về mã tài khoản, tên tài khoản, tổng nợ, tổng có và số dư ròng.
3. Tool Registry phải có tool `get_journal_entries` nhận tham số: `from_date` (bắt buộc), `to_date` (bắt buộc), `account_code` (tùy chọn).
4. Khi tool `get_journal_entries` được gọi, Chatbot Service phải trả về ngày bút toán, mô tả, số tiền nợ, số tiền có và thông tin tài khoản.

---

### Yêu cầu 10: Bảo mật và phân quyền

**User Story:** Là quản trị viên hệ thống, tôi muốn Chatbot tuân thủ phân quyền ERP hiện có, để người dùng không thể truy cập dữ liệu mà họ không được phép xem.

#### Tiêu chí chấp nhận

1. Chatbot Service phải yêu cầu JWT token hợp lệ cho tất cả các yêu cầu API, sử dụng cùng middleware xác thực với ERP API hiện có.
2. Khi một Tool được thực thi, Chatbot Service phải gọi ERP API bằng token của người dùng đã xác thực để kiểm soát truy cập theo vai trò được thực thi.
3. Nếu Tool trả về lỗi 403 Forbidden từ ERP API, Chatbot Service phải thông báo cho người dùng rằng họ không có quyền truy cập dữ liệu được yêu cầu.
4. Chatbot Service không được để lộ câu truy vấn DB thô, API key nội bộ hoặc system prompt trong bất kỳ phản hồi nào gửi đến người dùng.
5. Chatbot Service phải lưu LLM API key trong biến môi trường và không được đưa vào code phía client hoặc payload phản hồi.

---

### Yêu cầu 11: Cấu hình LLM Provider

**User Story:** Là quản trị viên hệ thống, tôi muốn cấu hình LLM provider được sử dụng, để tôi có thể chuyển đổi giữa OpenAI và Gemini mà không cần thay đổi code.

#### Tiêu chí chấp nhận

1. Chatbot Service phải đọc loại LLM provider (OpenAI hoặc Gemini), tên model và API key từ biến môi trường khi khởi động.
2. Khi LLM provider được cấu hình là OpenAI, Chatbot Service phải sử dụng OpenAI Chat Completions API với function calling.
3. Khi LLM provider được cấu hình là Gemini, Chatbot Service phải sử dụng Google Gemini API với function calling.
4. Nếu biến môi trường LLM provider không được đặt hoặc chứa giá trị không hợp lệ, Chatbot Service phải ghi log lỗi và từ chối khởi động.

---

### Yêu cầu 12: Logging và Giám sát

**User Story:** Là quản trị viên hệ thống, tôi muốn tất cả các tương tác chatbot được ghi log, để tôi có thể kiểm tra việc sử dụng và gỡ lỗi khi cần.

#### Tiêu chí chấp nhận

1. Chatbot Service phải ghi log mỗi tin nhắn người dùng đến, các Tool call được thực hiện và phản hồi cuối cùng bằng logger ERP hiện có.
2. Chatbot Service phải ghi log tên LLM provider, tên model và lượng token sử dụng cho mỗi lần gọi LLM.
3. Nếu việc thực thi Tool hoặc gọi LLM dẫn đến lỗi, Chatbot Service phải ghi log chi tiết lỗi bao gồm tên tool, tham số và thông báo lỗi.
4. Chatbot Service không được ghi log nội dung tin nhắn người dùng có thể chứa dữ liệu kinh doanh nhạy cảm ra các dịch vụ bên ngoài.
