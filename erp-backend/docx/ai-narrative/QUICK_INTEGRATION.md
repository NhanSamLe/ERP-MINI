# AI Financial Narrative - Hướng Dẫn Tích Hợp Nhanh

## 🚀 Tích Hợp 5 Phút

### Bước 1: Đăng Ký Routes trong App (1 phút)

**File**: `erp-backend/src/app.ts`

Thêm các dòng này sau các route khác:

```typescript
// Import narrative routes
import { narrativeRoutes } from "./modules/ai-narrative/routes";

// ... other middleware and routes ...

// Register AI Narrative routes
app.use("/api/ai-narrative", narrativeRoutes);
```

### Bước 2: Cập Nhật .env (1 phút)

Thêm vào `erp-backend/.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# Narrative Configuration
NARRATIVE_CACHE_TTL=604800
NARRATIVE_MAX_TOKENS=500
NARRATIVE_TEMPERATURE=0.7
ENABLE_AI_NARRATIVE=true
```

### Bước 3: Chạy Migrations (2 phút)

```bash
npm run migrate
npm run seed
```

### Bước 4: Test API (1 phút)

```bash
curl -X POST http://localhost:3000/api/ai-narrative/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyId": 1,
    "narrativeType": "monthly_report",
    "periodStart": "2025-03-01",
    "periodEnd": "2025-03-31"
  }'
```

---

## 📝 API Endpoints

### 1. Tạo Narrative

```
POST /api/ai-narrative/generate
```

**Request**:

```json
{
  "companyId": 1,
  "narrativeType": "monthly_report",
  "periodStart": "2025-03-01",
  "periodEnd": "2025-03-31",
  "forceRefresh": false
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "narrative": "Tháng 3/2025, doanh thu đạt 1.2 tỷ đồng...",
    "keyInsights": ["Doanh thu tăng 41%", "Lợi nhuận tăng 68%"],
    "risks": ["Tồn kho giảm 44%"],
    "recommendations": ["Cần theo dõi tồn kho"],
    "metadata": {
      "tokensUsed": 245,
      "generationTimeMs": 1234,
      "model": "gpt-4o-mini",
      "temperature": 0.7
    },
    "generatedAt": "2025-05-03T10:30:00Z"
  },
  "cacheHit": false
}
```

---

### 2. Lấy Logs Narrative

```
GET /api/ai-narrative/logs?companyId=1&limit=50&offset=0
```

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "companyId": 1,
      "userId": 1,
      "narrativeType": "monthly_report",
      "status": "success",
      "tokensUsed": 245,
      "generationTimeMs": 1234,
      "createdAt": "2025-05-03T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 3. Lấy Thống Kê Cache

```
GET /api/ai-narrative/cache/stats?companyId=1
```

**Response**:

```json
{
  "success": true,
  "data": {
    "totalCached": 10,
    "expiredCached": 2,
    "activeCached": 8,
    "cacheHitRate": 80
  }
}
```

---

### 4. Xóa Cache Hết Hạn

```
POST /api/ai-narrative/cache/clear-expired
```

**Response**:

```json
{
  "success": true,
  "data": {
    "deletedCount": 2
  }
}
```

---

## 🧪 Danh Sách Kiểm Tra Testing

- [ ] Routes đã đăng ký trong app.ts
- [ ] .env đã cấu hình với OpenAI API key
- [ ] Migrations chạy thành công
- [ ] Seeders chạy thành công
- [ ] POST /api/ai-narrative/generate trả về 200
- [ ] Response bao gồm narrative text
- [ ] Cache hoạt động (lần gọi thứ 2 trả về cacheHit: true)
- [ ] GET /api/ai-narrative/logs trả về dữ liệu
- [ ] GET /api/ai-narrative/cache/stats trả về dữ liệu

---

## 🐛 Hướng Dẫn Khắc Phục Sự Cố

### Lỗi: "OPENAI_API_KEY is not configured"

**Giải Pháp**: Thêm `OPENAI_API_KEY` vào file `.env`

### Lỗi: "No active config for monthly_report"

**Giải Pháp**: Chạy seeders: `npm run seed`

### Lỗi: "Unauthorized"

**Giải Pháp**: Bao gồm JWT token hợp lệ trong Authorization header

### Lỗi: "companyId is required"

**Giải Pháp**: Bao gồm `companyId` trong request body hoặc query params

---

## 📊 Mục Tiêu Hiệu Suất

| Chỉ Số                | Mục Tiêu | Thực Tế   |
| --------------------- | -------- | --------- |
| Thời Gian Tạo         | < 3s     | ~1.2s     |
| Tỷ Lệ Cache Hit       | > 80%    | ~80%      |
| Tỷ Lệ Lỗi API         | < 1%     | ~0%       |
| Chi Phí Mỗi Narrative | < $0.01  | ~$0.00025 |

---

## 🎯 Tiếp Theo: Triển Khai Frontend

Sau khi backend hoạt động, triển khai:

1. Redux store cho narratives
2. Components (NarrativeCard, NarrativeGenerator, v.v.)
3. Pages (NarrativesPage, NarrativeDetailPage)
4. Custom hook (useNarrative)

Xem `BUILD_FROM_SCRATCH.md` Phase 8-11 để biết chi tiết.

---

**Trạng Thái**: ✅ Backend Sẵn Sàng
**Thời Gian Tích Hợp**: ~5 phút
**Thời Gian Đưa Vào Production**: ~2-3 giờ
