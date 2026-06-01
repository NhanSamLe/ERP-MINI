# Hướng dẫn Cài đặt Ollama & Chạy Docker Compose cho Hệ thống Local RAG

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường để chạy hệ thống **Local RAG (Ollama + Qdrant Vector Database)** của dự án ERP Mini một cách nhanh chóng nhất.

---

## 1. Khởi chạy Qdrant Database (Docker)

Hệ thống sử dụng **Qdrant** làm cơ sở dữ liệu Vector để tìm kiếm ngữ cảnh thời gian thực. Cấu hình Docker Compose đã được tích hợp sẵn ở thư mục gốc của dự án.

### Các bước khởi chạy:
1. Đảm bảo máy tính của bạn đã được cài đặt và đang chạy **Docker Desktop**.
2. Mở terminal tại thư mục gốc của dự án (nơi chứa file `docker-compose.yml`).
3. Chạy lệnh sau để khởi động container ở chế độ chạy ngầm (detached):
   ```bash
   docker compose up -d
   ```
4. Kiểm tra xem container đã hoạt động thành công hay chưa bằng cách truy cập Bảng quản trị Qdrant (Qdrant Web UI) tại địa chỉ:
   * **Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 2. Cài đặt và Thiết lập Ollama

**Ollama** là công cụ giúp chạy các mô hình ngôn ngữ lớn (LLMs) trực tiếp trên máy cục bộ của bạn một cách tối ưu nhất.

### Bước 1: Tải và cài đặt
* Truy cập trang chủ chính thức [Ollama.com](https://ollama.com/) và tải bản cài đặt tương ứng với hệ điều hành của bạn (Windows, macOS hoặc Linux).
* Tiến hành cài đặt theo hướng dẫn trên màn hình.

### Bước 2: Bật Quyền Truy cập CORS (Bắt buộc cho Windows/macOS)
Để backend và frontend trong Docker hoặc môi trường phát triển có thể gọi đến Ollama mà không bị chặn lỗi bảo mật, bạn cần cấp quyền CORS cho Ollama.

#### Trên Windows:
1. Thoát hoàn toàn ứng dụng Ollama (Click chuột phải vào icon Ollama dưới thanh Taskbar -> Chọn **Quit Ollama**).
2. Mở cửa sổ **Environment Variables** (Biến môi trường) trên Windows bằng cách gõ `env` vào thanh tìm kiếm.
3. Thêm một biến môi trường hệ thống mới (System Variable):
   * **Variable Name**: `OLLAMA_ORIGINS`
   * **Variable Value**: `*`
4. Khởi động lại ứng dụng Ollama.

#### Trên macOS/Linux:
Chạy lệnh sau trong Terminal trước khi khởi chạy Ollama:
```bash
export OLLAMA_ORIGINS="*"
```

### Bước 3: Tải mô hình LLM và Embedding
Mở terminal trên máy tính của bạn và thực hiện kéo (pull) hai mô hình cần thiết cho dự án về:

1. **Mô hình Ngôn ngữ lớn (LLM)**:
   ```bash
   ollama pull qwen2.5:7b
   ```
2. **Mô hình Trích xuất đặc trưng (Embedding model)**:
   ```bash
   ollama pull bge-m3
   ```

*(Lưu ý: Thời gian tải phụ thuộc vào tốc độ mạng của bạn).*

---

## 3. Cấu hình Biến Môi trường Backend

Tru cập thư mục `erp-backend` và đảm bảo file `.env` đã có các thiết lập chính xác cho RAG:

```env
# Nhà cung cấp RAG: chọn 'ollama' để chạy hoàn toàn offline hoặc 'openai' nếu dùng cloud
RAG_PROVIDER=ollama

# Cấu hình kết nối Vector Database
QDRANT_URL=http://localhost:6333

# Cấu hình địa chỉ và mô hình Ollama
OLLAMA_HOST=http://localhost:11434
RAG_LLM_MODEL=qwen2.5:7b
RAG_EMBED_MODEL=bge-m3
```

---

## 4. Đồng bộ hóa Cơ sở dữ liệu lên Vector DB (Re-Index)

Sau khi cài đặt xong Ollama, Docker Qdrant và cấu hình `.env`, bạn cần đồng bộ hóa toàn bộ dữ liệu từ MySQL sang Qdrant để tạo các vector tìm kiếm.

Mở terminal tại thư mục `erp-backend` và chạy lệnh đồng bộ:

```bash
# Thực hiện chạy script đồng bộ dữ liệu ngầm lên Qdrant
npx ts-node -T src/scratch_run_sync.ts
```

Hoặc bạn có thể gửi yêu cầu `POST` trực tiếp thông qua API Tool:
* **API Endpoint**: `POST http://localhost:8888/api/ai/sync`
* **Authorization**: Gửi kèm `Bearer Token` của tài khoản Admin.

---

## 5. Bắt đầu Trò chuyện

Khởi chạy cả backend và frontend:
* **Backend**: `npm run dev` bên trong thư mục `erp-backend`
* **Frontend**: `npm run dev` bên trong thư mục `erp-frontend`

Mở giao diện ERP, click vào biểu tượng **Local RAG (Ollama)** ở góc dưới màn hình và trải nghiệm trò chuyện tra cứu thông tin thời gian thực cực kỳ bảo mật và an toàn.
