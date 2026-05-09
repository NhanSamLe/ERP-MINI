# 🚀 QUY TẮC CỐT LÕI CHO AI KHI PHÁT TRIỂN DỰ ÁN ERP-MINI

> **Frontend refactor/design rules** → đọc thêm: [`docs/FRONTEND_REFACTOR_RULES.md`](docs/FRONTEND_REFACTOR_RULES.md)  
> File đó là source-of-truth về màu sắc, component usage, layout patterns, anti-patterns.


**[🔥 QUAN TRỌNG] MÀNH LỆNH CHIA SẺ TRÍ TUỆ NHÂN TẠO**:
Bạn ĐANG LÀM VIỆC TRÊN dự án `ERP-MINI` - Hệ thống phần mềm quản lý doanh nghiệp. Việc của bạn LÀ TUÂN THỦ NGHIÊM NGẶT cấu trúc, coding convention và flow nghiệp vụ của dự án này. 
**TUYỆT ĐỐI KHÔNG SÁNG TẠO RA CÁC KIẾN TRÚC LẠ.** 

---

## 🛑 1. NHỮNG ĐIỀU NGHIÊM CẤM (ABSOLUTELY FORBIDDEN)
1. **Frontend KHÔNG BAO GIỜ DÙNG `fetch`**: Mọi request tới backend **BẮT BUỘC** gọi thông qua `axiosClient` (`erp-frontend/src/api/axiosClient.ts`). Nó đã tự động handle auth token: `Authorization: Bearer undefined`. Tự ý gọi bằng `fetch` là vi phạm mãng cấu trúc Auth.
2. **Backend KHÔNG CODE LOGIC VÀO `Controller` VÀ `Routes`**: `Controller` CHỈ dùng để nhận HTTP req, trích xuất dữ liệu, pass qua `Service` và format HTTP res. Database query (Sequelize) và logic nghiệp vụ phải nằm TRONG `Service`.
3. **Cấm đổi cấu trúc thư mục (Folder structure)**: Khi thêm Model, Route hay Page mới, PHẢI nhét vào đúng quy tắc thư mục module/feature hiện tại. 
4. **Cấm import chéo đệ quy (Circular Import) hoặc dùng Import Tương đối tịnh tiến (`../../../../`)**: Ưu tiên alias path nếu có, hoặc tính toán kỹ đường dẫn tương đối để không sinh lỗi biên dịch.
5. **Typescript: Không dùng kiểu `any` vô tội vạ**. Phải định nghĩa Interfaces hoặc DTO (`.dto.ts`) ở cả FrontEnd và BackEnd.

---

## 🛠 2. KIẾN TRÚC BACKEND (Express + Sequelize)

**A. Chuẩn Cấu trúc Thư mục Module**
Mọi tính năng đều phải chia thành Module tại `erp-backend/src/modules/`:
```text
src/modules/[tên-module]/
 ├── controllers/    # API Logic (req -> res)
 ├── models/         # Sequelize Models, Khai báo schema, associations
 ├── services/       # Core Business Logic, queries DB.
 ├── routes.ts       # Định nghĩa API routes, middlewares.
```
Cấu trúc Thư mục Core (`src/core/`):
Chứa middlewares config bảo mật chung: `authMiddleware`, `permissionMiddleware`.

**B. Quy tắc Dòng chảy Backend (Luồng Request Chuẩn)**
1. **Routing (`routes.ts`)**: 
   - Mọi endpoints cần bảo vệ bắt buộc có `authenticate`. 
   - Endpoint đặc quyền (Sale/CRM/HR) phải gọi `requirePermission('RESOURCE:ACTION')`.
2. **Controller (`*.controller.ts`)**:
   - Validation cơ bản đầu vào (`req.body`, `req.params`).
   - Try-Catch bắt lỗi, trả về theo cấu trúc chuẩn: 
     `res.status(200).json({ success: true, data: ..., message?: string })`.
   - Nếu có lỗi trả về `res.status(500|400).json({ success: false, error: err.message })`.
3. **Service (`*.service.ts`)**:
   - Query DB qua *Sequelize* (vd: `await Lead.findByPk(...)`).
   - Mọi record sinh ra/cập nhật quan trọng (Lead/Sale Order) PHẢI cập nhật Timeline bằng `addTimeline(...)` (từ `timeLine.service`).
   - Nếu có các thay đổi State quan trọng thì phải kết nối với bảng `ScoringRule` hoặc `PipelineStage`.

**C. Database & Models**
- Khai báo file `Model.ts` phải extends chuẩn `Model` từ `sequelize`. Có block `Model.init(...)`. Xóa/Cập nhật phải cấu hình xoá mềm `is_deleted: true`.

---

## 🖥 3. KIẾN TRÚC FRONTEND (React + Vite + Redux Toolkit)

**A. Chuẩn Cấu trúc Thư mục Features**
Frontend gom các thành phần theo NGHIỆP VỤ (`features/`), không gom theo kỹ thuật:
```text
src/features/[tên-feature]/
 ├── api/            # Export các func gọi axiosClient (Tránh logic api lan ra page)
 ├── components/     # UI Component CHỈ dùng cho feature này, ex: Kanban Board CRM.
 ├── dto/            # Interfaces: định nghĩa Data Transfer Object (vd: Lead, Opportunity).
 ├── page/           # React Container (Screen Pages). Khai báo các trang chính.
 ├── store/          # Redux Thunks (`*.thunks.ts`), Redux Slice (`*.slice.ts`) cục bộ cho tính năng.
```
**B. Các Cấu trúc Core Frontend (Dùng Chung)**
- `src/components/ui/`: Components hiển thị tái sử dụng: `Button`, `FormInput`, `Alert`, `Card`. AI bắt buộc sử dụng lại các UI này thay vì tự style thẻ `<button>` bằng Tailwind cho các nút chính.
- `src/store/`: `store.ts` tổng, AppDispatch, RootState được export ở đây (`hooks.ts`).
- `lucide-react`: Mặc định sử dụng thư viện icon này, tìm icon sát nghĩa.

**C. Quy tắc Dòng Chảy Dữ Liệu UI (State Management)**
1. **Redux / Thunk (BẮT BUỘC ĐỐI VỚI DỮ LIỆU CẦN CACHE / COMMON STATE)**
   - Các danh sách (Leads list, Opportunity list) phải nằm trong Redux (`useAppSelector`). 
   - Form Submit (Create/Update/Delete) => Cần viết `createAsyncThunk` trong file `store/[tên].thunks.ts`.
   - Page `.tsx` chạy `useEffect` -> `dispatch(thunkFetchAll())`.
   - Bắt trạng thái `loading`, `error`, `success` thông qua `extraReducers` của `Slice.ts`.
2. **Local State (`useState`)**: 
   - CHỈ đùng để kiểm soát Component Form nháp, Toggle Modal Edit, Toggle Tabs, Form Validation (Ví dụ: Biến error text nhỏ dưới input).
3. **Lưu ý Cập Nhật Dữ Liệu Kép**: 
   - Bất cứ khi nào gọi Thunk Sửa / Tạo / Xoá, NẾU thành công (unwrap), PHẢI điều hướng hoặc fetch lại Redux để làm mới danh sách dữ liệu để tránh dữ liệu ảo.

---

## 🎨 4. QUY TẮC HIỂN THỊ UI & CSS STYLING
- **TailwindCSS**: Sử dụng thuần Tailwind class. KHÔNG viết CSS thuần nếu không cần thiết. Tránh inline style bằng object trừ trường hợp biến động.
- **Form Input**: Cần tái sử dụng hook kiểm tra input error. Giao diện Input sử dụng element `FormInput`.
- **Màu sắc & Branding**: Theo màu chủ đạo hiện tại của dự án (`bg-orange-500`, `text-blue-600` tuỳ bộ phận). Tuân thủ code màu đã setup, không sử dụng các màu chói lóa từ tailwind (vd: `fuchsia`, `lime`) lạc quẻ với tính chất app ERP doanh nghiệp.
- **Format Form/Table**: Định dạng Tiền tệ bắt buộc phải dùng `formatVND(value)` (có tại `src/utils/currency.helper.ts`).

---

## 🤖 5. PHƯƠNG CHÂM LÀM VIỆC CỦA AI VỚI DỰ ÁN
1. Trước khi tạo/sửa file: Mở & check các file `.model.ts`, `routes.ts` (Backend) hoặc `.slice.ts`, `api` (Frontend) của feature đó ra xem đang code kiểu gì để copy style/pattern đó.  
2. Nếu không có mẫu: Áp dụng Pattern chặt chẽ đã quy định bên trên.  
3. Luôn đảm bảo dự án Run `npm run dev` không bị sụp (crash) vì các lỗi cú pháp TypeScript ngu ngốc (Import module thiếu, sai đường dẫn, hoặc missing exported fields). Đoán thiếu file thì dùng lệnh search thay vì bịa module.

Đọc kỹ tệp lệnh này. Sự xuất sắc của dự án phụ thuộc vào sự tuân thủ chuẩn mực của bạn.
