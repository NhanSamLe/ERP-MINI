# Kế Hoạch Trình Bày Slide Đồ Án Tốt Nghiệp (ERP Mini & OCR Intelligence)
**Thời lượng tối ưu:** 5 - 7 phút | **Mục tiêu:** Cho hội đồng thấy chiều rộng (quy mô hệ thống ERP) và chiều sâu (công nghệ AI OCR & Anomaly Detection).

---

## 1. Phân Bổ Thời Gian Chi Tiết (Timeline)

* **Phần 1 (1 phút):** Phương pháp thực hiện & Quy trình phát triển (Slide 6)
* **Phần 2 (1.5 phút):** Kiến trúc hệ thống 3 lớp & Vị trí của AI Engine (Slide 7)
* **Phần 3 (1.5 phút):** Các phân hệ ERP cốt lõi & Kết quả đạt được (Slide 8 & 9)
* **Phần 4 (2 phút):** Điểm nhấn Công nghệ: AI Document Intelligence & 3-Way Matching (Bán điểm đắt giá)
* **Phần 5 (0.5 phút):** Tổng kết ngắn gọn.

---

## 2. Kịch Bản Chi Tiết Từng Slide (Speaking Script)

### Slide 6: Phương Pháp Thực Hiện (Thời gian: 1 phút)
* **Nội dung slide:** Quy trình phát triển 7 bước (Khảo sát ERPNext/Ecount, Phân tích yêu cầu, Thiết kế DB, Xây dựng Backend/Frontend, Test).
* **Nội dung cần nói:**
  > "Kính thưa Hội đồng, để xây dựng hệ thống ERP Mini này, nhóm đã thực hiện quy trình phát triển bài bản gồm 7 bước. 
  > Chúng em bắt đầu bằng việc **khảo sát thực tế hai hệ thống ERP lớn là ERPNext và ECOUNT ERP** nhằm chắt lọc luồng nghiệp vụ tinh gọn, phù hợp với doanh nghiệp SME tại Việt Nam. 
  > Từ đó, nhóm tiến hành thiết kế hệ thống cơ sở dữ liệu tối ưu và phát triển song song cả hai phía Frontend và Backend, đảm bảo mọi tính năng đều được kiểm thử nghiêm ngặt trước khi vận hành."
* **Mẹo trình bày:** Nói lướt nhanh phần này, không đọc từng dòng chữ trên slide. Nhấn mạnh vào việc *học hỏi/khảo sát ERPNext/Ecount* để tạo uy tín cho nghiệp vụ của đồ án.

---

### Slide 7: Kiến Trúc Hệ Thống (Thời gian: 1.5 phút)
* **Nội dung slide:** Mô hình 3 lớp (ReactJS - NodeJS - MySQL).
* **Nội dung cần nói:**
  > "Về mặt kiến trúc, hệ thống được xây dựng theo **mô hình 3 lớp chuẩn hóa** nhằm đảm bảo tính mở rộng và bảo mật:
  > - **Frontend**: Sử dụng ReactJS giúp giao diện phản hồi mượt mà, tối ưu trải nghiệm người dùng.
  > - **Backend**: NodeJS Express làm nhiệm vụ xử lý logic nghiệp vụ và cung cấp các RESTful API bảo mật.
  > - **Database**: Cơ sở dữ liệu MySQL đi kèm Sequelize ORM để quản lý dữ liệu toàn vẹn.
  > **Điểm đặc biệt ở đây**: Để xử lý các tác vụ nặng như trích xuất dữ liệu hóa đơn OCR bằng AI, nhóm đã thiết kế **kiến trúc chạy tác vụ ngầm (Asynchronous Background Job)**. Khi người dùng tải hóa đơn lên, hệ thống sẽ phản hồi ngay lập tức để giải phóng UI, trong khi luồng AI Engine sẽ chạy độc lập dưới nền để phân tích dữ liệu, giúp tối ưu hóa hiệu năng hệ thống."
* **Mẹo trình bày:** Chỉ vào hình vẽ để giải thích luồng đi của API (React -> HTTP Axios -> Express Router -> ORM -> MySQL) và nhấn mạnh vào cơ chế **Chạy ngầm (Async)** để chứng tỏ chiều sâu về tư duy tối ưu hiệu năng phần mềm.

---

### Slide 8 & 9: Kết Quả Đạt Được - Các Phân Hệ Cốt Lõi (Thời gian: 1.5 phút)
* **Nội dung slide:** Các module Auth, CRM, Sales, Purchase, Inventory, Accounting, HRM, Báo cáo.
* **Nội dung cần nói:**
  > "Nhờ kiến trúc vững chắc đó, chúng em đã hoàn thiện trọn vẹn **8 phân hệ cốt lõi** phục vụ cho vận hành doanh nghiệp:
  > - **Vận hành thương mại**: Gồm phân hệ CRM quản lý khách hàng tiềm năng, phân hệ Bán hàng (Sales) và Mua hàng (Purchase) quản lý chặt chẽ công nợ hai đầu.
  > - **Vận hành nội bộ**: Phân hệ Kho (Inventory) quản lý xuất nhập tồn đa chi nhánh; phân hệ Kế toán (Accounting) theo dõi dòng tiền thu/chi; phân hệ Nhân sự (HRM) tính lương tự động; và hệ thống Báo cáo trực quan bằng biểu đồ.
  > Tất cả các phân hệ này được bảo mật và phân quyền chặt chẽ bằng cơ chế **JWT với hơn 12 vai trò cụ thể** trong doanh nghiệp."
* **Mẹo trình bày:** Nói tổng quan để chứng minh **độ rộng** của đồ án (đầy đủ các phân hệ của một ERP thực tế). Tránh đọc liệt kê chi tiết từng bảng chức năng.

---

### Slide 10: Điểm Nhấn Công Nghệ: AI Document Intelligence & 3-Way Matching (Thời gian: 2 phút - Cực kỳ quan trọng)
* **Nội dung cần nói (Nói vo hoặc chiếu slide sơ đồ luồng):**
  > "Tuy nhiên, điểm đắt giá nhất của hệ thống chính là phân hệ **AI Document Intelligence** giúp giải quyết bài toán nhập liệu hóa đơn tự động và chống gian lận tài chính. Quy trình gồm 3 chốt chặn:
  > 
  > 1. **Trích xuất thông tin bằng AI OCR**: Hệ thống tự động nhận diện định dạng file. Đối với PDF chữ, hệ thống bóc tách text trực tiếp để tiết kiệm chi phí; đối với PDF quét ảnh, hệ thống tự động nhờ Cloudinary render trang đầu làm ảnh tạm thời để gửi sang OpenAI Vision API.
  > 
  > 2. **Lớp phòng vệ Anomaly Detection Pipeline**: Trước khi lưu vào sổ sách, dữ liệu đi qua 5 bộ kiểm tra độc lập chỉ trong vòng 2 giây:
  >    - *Math Checker*: Kiểm tra tính toán số học trên hóa đơn (lệch giá từng dòng, subtotal, total).
  >    - *Statistical Analyzer*: Dùng thuật toán **Z-Score và IQR** so sánh giá hóa đơn với lịch sử giá mua của sản phẩm để phát hiện giá mua đắt bất thường.
  >    - *Fraud & Behavior Detector*: Phát hiện MST sai cấu trúc, hóa đơn mẫu (Draft/Void), hóa đơn trùng lặp và tải lên ngoài giờ hành chính.
  >    - *Isolation Forest*: Mô hình học máy phát hiện bất thường đa biến.
  >    - Toàn bộ lỗi được chấm điểm rủi ro (**Risk Score** từ 0.0 đến 1.0). Nếu rủi ro cao, hệ thống khóa tự động duyệt và bắt buộc ghi vết duyệt ghi đè (**Audit Trail Override**) phục vụ kiểm toán sau này.
  > 
  > 3. **So khớp 3 bên (3-Way Matching)**: Đối chiếu tự động **Đơn giá trên hóa đơn** với **Đơn giá trên PO** và **Số lượng hóa đơn** với **Số lượng thực tế nhập kho (GRN)**. Nếu khớp hoàn toàn, hóa đơn tự động được duyệt chi."
* **Mẹo trình bày:** Đây là phần ăn điểm tuyệt đối. Hãy nói tự tin, nhấn mạnh các từ khóa công nghệ: **Z-Score**, **IQR**, **Isolation Forest**, **3-Way Matching**, **Audit Trail**.

---

### Kết luận (Thời gian: 0.5 phút)
* **Nội dung cần nói:**
  > "Tóm lại, đồ án không chỉ giải quyết bài toán quản trị doanh nghiệp diện rộng với 8 phân hệ ERP cơ bản, mà còn đi sâu giải quyết bài toán chuyển đổi số bằng AI, giúp tự động hóa tối đa quy trình kế toán phải trả. 
  > Em xin chân thành cảm ơn quý Thầy Cô trong Hội đồng đã lắng nghe và rất mong nhận được câu hỏi từ quý Thầy Cô."

---

## 3. Các Câu Hỏi Phản Biện Hội Đồng Thường Hỏi & Cách Trả Lời

### Câu hỏi 1: Tại sao OCR của em lại cần Cloudinary cho PDF dạng ảnh?
* **Cách trả lời:** *"Dạ thưa Thầy/Cô, OpenAI Vision API chỉ nhận diện trực tiếp các định dạng ảnh (như JPG, PNG, WebP) chứ không nhận diện trực tiếp file `.pdf`. Do đó, nếu là file PDF dạng ảnh quét (scanned PDF), hệ thống sẽ tận dụng cơ chế render file của Cloudinary bằng cách tải PDF lên và đổi đuôi tệp thành `.jpg` để lấy ảnh trang đầu tiên gửi sang OpenAI Vision. Sau khi xử lý xong, hệ thống có cơ chế tự động xóa tệp tạm này trên Cloudinary sau 2 phút để bảo mật thông tin."*

### Câu hỏi 2: Z-Score và IQR trong Statistical Analyzer khác nhau thế nào và áp dụng khi nào?
* **Cách trả lời:** *"Dạ, Z-Score yêu cầu tập dữ liệu lịch sử đủ lớn và phân phối chuẩn để tính toán giá trị trung bình và độ lệch chuẩn chính xác. Trong trường hợp sản phẩm mới mua vài lần (tập mẫu nhỏ dưới 10 bản ghi) hoặc giá cả biến động không theo phân phối chuẩn, hệ thống sẽ tự động chuyển sang dùng phương pháp IQR (Khoảng tứ phân vị) chia dữ liệu làm 4 phần để tìm ra khoảng biến động chấp nhận được, giúp tránh tình trạng báo động giả (false positive)."*

### Câu hỏi 3: Thế nào là bất thường đa biến (Multivariate Anomaly) trong Isolation Forest?
* **Cách trả lời:** *"Dạ, bất thường đơn biến là khi có 1 thuộc tính bất thường (ví dụ: giá laptop vọt lên 500 triệu). Còn bất thường đa biến là khi từng trường thông tin riêng lẻ nhìn rất bình thường (giá laptop Dell 20 triệu - bình thường, số lượng mua 2 cái - bình thường, nhà cung cấp A - bình thường), nhưng từ trước tới nay nhà cung cấp A chưa bao giờ bán dòng laptop Dell này cho chi nhánh HCM của chúng ta. Sự kết hợp đồng thời của các biến số này là cực kỳ dị biệt trong lịch sử, và mô hình Isolation Forest (học máy không giám sát) sẽ cô lập điểm dữ liệu này và cảnh báo cho kế toán."*
