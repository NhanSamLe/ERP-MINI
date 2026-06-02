# AI Marketing & Product Blog Feature

Hệ thống AI Marketing & Product Blog hỗ trợ các phòng ban Sales/Marketing trong doanh nghiệp dễ dàng tạo ra các bài viết quảng bá sản phẩm, bài tin tức chuẩn SEO hoặc bài viết chia sẻ kiến thức dựa trên dữ liệu sản phẩm có sẵn trong ERP và sức mạnh AI (OpenAI API).

---

## User Review Required

> [!IMPORTANT]
> **Quyền truy cập và xuất bản (Permissions & Roles)**
> - Mặc định, AI Blog sẽ được truy cập bởi các role: `CEO`, `ADMIN`, `SALESMANAGER`, `SALES` (hoặc Marketing nếu có). Các role nhân viên kho (`WHSTAFF`) hay kế toán (`ACCOUNT`) sẽ không nhìn thấy tính năng này trong Sidebar.
> - Bạn có muốn cấu hình thêm quyền chỉ cho phép `SALESMANAGER` hoặc `ADMIN` duyệt xuất bản (`Publish`), còn `SALES` chỉ được phép soạn thảo nháp (`Draft`) không?

---

## Open Questions

> [!NOTE]
> **1. Phương thức sinh bài viết AI (Streaming vs Single Response)**
> - Backend đang hỗ trợ cả cơ chế Stream (Server-Sent Events) và cơ chế phản hồi đơn (Single response). Để có trải nghiệm mượt mà, chúng tôi đề xuất sử dụng **SSE Streaming** giúp chữ chạy ra trực tiếp trên khung soạn thảo. Bạn có đồng ý với phương án này không?
>
> **2. Trình soạn thảo văn bản (Rich Text Editor)**
> - Để soạn thảo bài viết phong phú, chúng ta có thể sử dụng một Rich Text Editor đơn giản (ví dụ: `react-quill` hoặc Markdown Editor). Chúng tôi đề xuất sử dụng **Markdown Editor** kết hợp với thư viện Preview Markdown để vừa hiển thị đẹp, vừa tương thích tốt với kết quả trả về từ OpenAI (đầu ra của OpenAI thường ở định dạng Markdown).

---

## Proposed Changes

---

### Backend (Express + Sequelize)

Tạo mới module `blog` để quản lý các bài viết và kết nối dịch vụ OpenAI.

#### [NEW] [blogPost.model.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-backend/src/modules/blog/models/blogPost.model.ts)
- Khai báo bảng `blog_posts` trong cơ sở dữ liệu MySQL thông qua Sequelize.
- Các trường chính: `id`, `title`, `slug`, `content`, `summary`, `status` (`draft` / `published`), `author_id`, `product_id` (liên kết khóa ngoại đến bảng `products`), `seo_title`, `seo_meta_desc`, `seo_keywords`, `image_url`, `created_at`, `updated_at`.

#### [NEW] [blog.service.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-backend/src/modules/blog/services/blog.service.ts)
- Xử lý nghiệp vụ chính: CRUD bài viết.
- Tích hợp với dịch vụ OpenAI (`gpt-4o-mini`) để tạo prompt và sinh bài viết PR sản phẩm dựa trên thông tin sản phẩm (`name`, `description`, `origin`, `sale_price`, `notes`).
- Hỗ trợ API SSE Streaming trả về bài viết trực tiếp cho client.

#### [NEW] [blog.controller.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-backend/src/modules/blog/controllers/blog.controller.ts)
- Nhận request từ Client, kiểm tra tính hợp lệ của dữ liệu đầu vào.
- Trích xuất dữ liệu, gọi `BlogService` để xử lý và trả về response JSON chuẩn hoặc EventStream (SSE).

#### [NEW] [blog.route.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-backend/src/modules/blog/routes/blog.route.ts)
- Định nghĩa các endpoint:
  - `GET /api/blog` - Lấy danh sách bài viết.
  - `GET /api/blog/:idOrSlug` - Lấy chi tiết bài viết.
  - `POST /api/blog` - Tạo bài viết mới.
  - `PUT /api/blog/:id` - Cập nhật bài viết.
  - `DELETE /api/blog/:id` - Xóa bài viết.
  - `POST /api/blog/generate` - Yêu cầu AI sinh nội dung PR sản phẩm (Hỗ trợ stream).

#### [MODIFY] [index.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-backend/src/routes/index.ts)
- Đăng ký route mới: `router.use("/blog", blogRoutes)`.

---

### Frontend (React + Redux Toolkit + TailwindCSS)

Xây dựng module Blog mới tại `erp-frontend/src/features/blog` và tích hợp vào thanh menu điều hướng.

#### [NEW] [blog.dto.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/features/blog/dto/blog.dto.ts)
- Khai báo các TypeScript interfaces cho bài viết Blog, yêu cầu sinh nội dung AI, và danh sách sản phẩm phục vụ dropdown.

#### [NEW] [blog.api.ts](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/features/blog/api/blog.api.ts)
- Triển khai các hàm gọi API đến Backend bằng `axiosClient` cho các chức năng CRUD.
- Xử lý kết nối EventSource/Fetch API đặc biệt cho stream bài viết từ endpoint AI.

#### [NEW] [BlogListPage.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/features/blog/page/BlogListPage.tsx)
- Giao diện danh sách bài viết theo dạng lưới (Grid Card) hiện đại.
- Hiển thị: Feature image, tiêu đề, tóm tắt, thẻ trạng thái (Draft/Published), liên kết sản phẩm, tác giả và ngày tạo.
- Bộ lọc theo trạng thái và tìm kiếm.

#### [NEW] [BlogDetailPage.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/features/blog/page/BlogDetailPage.tsx)
- Trang hiển thị chi tiết bài viết Blog dạng Markdown đẹp mắt, chuẩn SEO, hỗ trợ Responsive đầy đủ.
- Có nút quay lại danh sách và nút Sửa bài viết (dành cho Admin/Sales).

#### [NEW] [BlogEditorPage.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/features/blog/page/BlogEditorPage.tsx)
- Giao diện soạn thảo chia làm 2 cột:
  - **Cột Trái (Form Soạn Thảo)**: Nhập Tiêu đề, Slug, Summary, Nội dung (Markdown Editor có preview trực tiếp), SEO metadata (Title, Desc, Keywords), và tải ảnh đại diện bài viết.
  - **Cột Phải (AI Assistant Panel)**: 
    - Cho phép chọn Sản phẩm từ danh sách dropdown của ERP.
    - Chọn Giọng điệu (Tone): Chuyên nghiệp, Thuyết phục, Hài hước, Khơi gợi tò mò.
    - Chọn Mục tiêu: PR tính năng, Chương trình khuyến mãi, So sánh sản phẩm.
    - Nhập Từ khóa/Ghi chú thêm.
    - Nút **"Sinh bài viết AI"**: Kích hoạt luồng Streaming SSE đổ nội dung Markdown trực tiếp vào Editor.
    - Tính năng **AI SEO Checklist**: Phân tích nhanh tiêu đề và nội dung để kiểm tra các yếu tố SEO cơ bản.

#### [NEW] [blogRoutes.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/routes/blogRoutes.tsx)
- Khai báo danh sách route cho module Blog.

#### [MODIFY] [index.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/routes/index.tsx)
- Tích hợp `blogRoutes` vào luồng router chung của hệ thống ERP.

#### [MODIFY] [Sidebar.tsx](file:///d:/Nam3/KLTN/ERP-MINI/erp-frontend/src/components/layout/Sidebar.tsx)
- Thêm mục menu **"AI Blog"** dưới phần CRM hoặc Sales với icon phù hợp (`FileText` hoặc `PenTool`) và giới hạn quyền truy cập theo yêu cầu.

---

## Verification Plan

### Automated & Manual Verification
1. **Kiểm tra Backend API**:
   - Sử dụng các công cụ HTTP request hoặc unit test để kiểm tra các endpoint CRUD bài viết đảm bảo trả về mã trạng thái HTTP chuẩn và đúng định dạng JSON.
   - Kiểm tra endpoint `/api/blog/generate` đảm bảo SSE stream hoạt động ổn định (trả về từng chunk chữ và đóng connection thành công).
2. **Kiểm tra UI Frontend**:
   - Truy cập trang `/blog` để kiểm tra hiển thị danh sách bài viết.
   - Thử nghiệm chức năng tạo mới: Chọn sản phẩm -> Chọn các tùy chọn giọng điệu -> Bấm "Sinh bài viết AI" -> Kiểm tra việc hiển thị dữ liệu stream chạy ra mượt mà và tự động điền vào Editor.
   - Chỉnh sửa nội dung, tối ưu SEO qua Checklist và lưu lại. Xác nhận bài viết xuất hiện trên danh sách.
   - Kiểm tra hiển thị trang chi tiết bài viết đảm bảo parser Markdown render chuẩn font chữ, headings, tables và code blocks.
