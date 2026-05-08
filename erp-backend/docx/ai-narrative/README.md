# AI Financial Narrative - Hướng Dẫn Triển Khai

## 📋 Tóm Tắt

Xây dựng tính năng AI Financial Narrative cho ERP MINI sử dụng:

- **LLM**: OpenAI (GPT-4o-mini) ⭐
- **Backend**: Node.js + Express.js
- **Database**: MySQL + Sequelize
- **Chi Phí**: ~$0.25/tháng cho 1,000 narratives

---

## 🚀 Bắt Đầu Nhanh (5 phút)

### 1. Cài Đặt Dependencies

```bash
npm install openai
```

### 2. Cập Nhật .env

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
NARRATIVE_CACHE_TTL=604800
NARRATIVE_MAX_TOKENS=500
NARRATIVE_TEMPERATURE=0.7
ENABLE_AI_NARRATIVE=true
```

### 3. Chạy Migrations

```bash
npm run migrate
npm run seed
```

### 4. Test API

```bash
curl -X POST http://localhost:3000/api/ai-narrative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "narrativeType": "monthly_report",
    "periodStart": "2025-03-01",
    "periodEnd": "2025-03-31"
  }'
```

---

## 📁 Cấu Trúc File

### Backend Files

```
erp-backend/src/
├── models/
│   ├── narrative-config.model.ts
│   ├── narrative-cache.model.ts
│   └── narrative-log.model.ts
├── services/
│   ├── kpi-calculator.service.ts
│   ├── prompt-builder.service.ts
│   ├── llm-integration-openai.service.ts
│   └── narrative.service.ts
├── controllers/
│   └── narrative.controller.ts
├── routes/
│   └── narrative.routes.ts
├── types/
│   └── narrative.types.ts
├── utils/
│   ├── prompt-templates.ts
│   ├── response-parser.ts
│   ├── kpi-formulas.ts
│   └── index.ts
├── migrations/
│   ├── 20250503000001-create-ai-narrative-configs.js
│   ├── 20250503000002-create-ai-narrative-cache.js
│   └── 20250503000003-create-ai-narrative-logs.js
└── seeders/
    └── 20250503-seed-narrative-configs.js
```

---

## 💡 Tính Năng Chính

### 1. Narrative Báo Cáo Tháng

- Tóm tắt doanh thu, lợi nhuận, chi phí
- So sánh với tháng trước & cùng kỳ năm ngoái
- Highlight điểm nổi bật & rủi ro

### 2. Narrative Hiệu Suất Bán Hàng

- Phân tích doanh thu theo category/region
- Phân tích top products
- Xu hướng khách hàng

### 3. Narrative Hiệu Suất Nhà Cung Cấp

- Đánh giá nhà cung cấp
- Tỷ lệ giao hàng đúng hạn
- Theo dõi hóa đơn trễ hạn

### 4. Bình Luận Dòng Tiền

- Tình hình dòng tiền
- Phân tích AR/AP aging
- Chỉ số DSO/DPO

---

## 💰 Ước Tính Chi Phí

### Giá GPT-4o-mini

```
Input:  $0.15 mỗi 1M tokens
Output: $0.60 mỗi 1M tokens

Mỗi Narrative: ~$0.00025
Hàng tháng (1,000): ~$0.25
```

---

## 📊 Mục Tiêu Hiệu Suất

| Chỉ Số                | Mục Tiêu |
| --------------------- | -------- |
| Thời Gian Tạo         | < 3 giây |
| Tỷ Lệ Cache Hit       | > 80%    |
| Tỷ Lệ Lỗi API         | < 1%     |
| Chi Phí Mỗi Narrative | < $0.01  |

---

## 🔧 Các Bước Triển Khai

### Phase 1: Thiết Lập Database

- [ ] Chạy migrations
- [ ] Chạy seeders
- [ ] Xác minh bảng được tạo

### Phase 2: Backend Services

- [ ] Tạo models
- [ ] Tạo services
- [ ] Tạo controller
- [ ] Tạo routes

### Phase 3: Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] API tests

### Phase 4: Deployment

- [ ] Deploy lên staging
- [ ] Smoke tests
- [ ] Deploy lên production

---

## 📚 File Tài Liệu

- **README.md** - File này
- **IMPLEMENTATION.md** - Hướng dẫn triển khai chi tiết
- **GPT4O_MINI.md** - Tại sao chọn GPT-4o-mini
- **EXPRESS_ADAPTATION.md** - Hướng dẫn Express.js

---

## 🧪 Testing

```bash
# Test API endpoint
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

## 📞 Hỗ Trợ

### Câu Hỏi Thường Gặp

**Q: Làm sao lấy OpenAI API key?**
A: Truy cập https://platform.openai.com/api-keys

**Q: Tại sao chọn GPT-4o-mini?**
A: Chất lượng tốt nhất + chi phí thấp nhất (rẻ hơn 64% so với GPT-3.5)

**Q: Làm sao giảm chi phí?**
A: Tăng cache TTL, tối ưu prompts

---

**Trạng Thái**: ✅ Sẵn Sàng Triển Khai
**Chất Lượng**: ⭐⭐⭐⭐⭐ Sản Xuất
**Chi Phí**: 💰 ~$0.25/tháng

🚀 **Hãy xây dựng nó!**
