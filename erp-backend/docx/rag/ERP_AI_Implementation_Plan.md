# ERP Mini — AI Chatbot Implementation Plan
> Stack: Node.js + Express + TypeScript · React + Vite + TypeScript · MySQL (Sequelize) · Ollama · Qdrant

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│   React + Vite + TypeScript                                 │
│   ChatWidget component · Redux state · Socket.io-client     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                       API LAYER                             │
│   Express + TypeScript                                      │
│   /api/ai/chat · /api/ai/sync · Socket.io server           │
└──────┬─────────────────┬───────────────────────────────────-┘
       │                 │
┌──────▼──────┐   ┌──────▼──────────────────────────────────┐
│   MySQL     │   │         AI SERVICE LAYER                │
│  Sequelize  │   │  EmbeddingService · RAGService          │
│  ERP Data   │   │  SyncService · ChatService              │
└─────────────┘   └──────┬──────────────┬────────────────────┘
                         │              │
                  ┌──────▼──────┐ ┌─────▼──────┐
                  │   Ollama    │ │   Qdrant   │
                  │  bge-m3     │ │  Vector DB │
                  │  qwen2.5:7b │ │  port 6333 │
                  └─────────────┘ └────────────┘
```

---

## PHASE 1 — Infrastructure Setup (Ngày 1)

### 1.1 Cài Ollama

```bash
# Linux / macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows: tải installer tại https://ollama.com/download

# Verify
ollama --version

# Pull models (chạy song song 2 terminal)
ollama pull bge-m3        # embedding — ~570MB — tiếng Việt tốt nhất
ollama pull qwen2.5:7b    # LLM chat   — ~4.7GB

# Test embedding
curl http://localhost:11434/api/embeddings -d '{
  "model": "bge-m3",
  "prompt": "test tiếng Việt"
}'
# Kết quả mong đợi: {"embedding": [0.023, -0.187, ...]} — mảng 1024 số

# Test chat
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:7b",
  "messages": [{"role":"user","content":"Xin chào"}],
  "stream": false
}'
```

### 1.2 Cài Qdrant bằng Docker

```bash
# Tạo thư mục lưu data
mkdir -p ~/qdrant_storage

# Chạy Qdrant
docker run -d \
  --name qdrant-erp \
  --restart unless-stopped \
  -p 6333:6333 \
  -p 6334:6334 \
  -v ~/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Verify
curl http://localhost:6333/health
# {"title":"qdrant - vector search engine","version":"...","commit":"..."}

# Mở dashboard UI
# http://localhost:6333/dashboard
```

### 1.3 Cài packages vào Backend

```bash
cd erp-backend

# Qdrant client
npm install @qdrant/js-client-rest

# Ollama SDK
npm install ollama

# Type definitions (nếu chưa có)
npm install -D @types/node
```

---

## PHASE 2 — Backend: Cấu trúc thư mục AI Module (Ngày 1-2)

### 2.1 Tạo cấu trúc thư mục

```
src/
└── modules/
    └── ai/
        ├── ai.module.ts          # Export tất cả
        ├── ai.routes.ts          # Express routes
        ├── ai.controller.ts      # Request handlers
        ├── services/
        │   ├── embedding.service.ts   # Gọi Ollama bge-m3
        │   ├── qdrant.service.ts      # CRUD với Qdrant
        │   ├── rag.service.ts         # RAG pipeline
        │   ├── chat.service.ts        # Qwen2.5 chat
        │   └── sync.service.ts        # MySQL → Qdrant sync
        ├── types/
        │   └── ai.types.ts            # Interfaces, enums
        └── templates/
            └── content.templates.ts  # SQL query templates per module
```

### 2.2 `src/modules/ai/types/ai.types.ts`

```typescript
export type ERPModule = 'crm' | 'purchase' | 'sale' | 'inventory' | 'report';

export type EntityType =
  | 'customer' | 'lead' | 'contact'          // CRM
  | 'vendor'   | 'purchase_order'             // Purchase
  | 'sale_order' | 'quotation'                // Sale
  | 'product'  | 'stock_move'                 // Inventory
  | 'invoice'  | 'payment';                   // Accounting

export interface EmbedPayload {
  module:        ERPModule;
  entity_type:   EntityType;
  entity_id:     number;
  content_text:  string;
  content_hash:  string;
  extra?:        Record<string, unknown>;
}

export interface SearchResult {
  score:        number;
  entity_id:    number;
  entity_type:  EntityType;
  module:       ERPModule;
  content_text: string;
  extra?:       Record<string, unknown>;
}

export interface ChatMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message:      string;
  module?:      ERPModule;
  history?:     ChatMessage[];
  top_k?:       number;
}

export interface ChatResponse {
  answer:   string;
  sources:  SearchResult[];
  model:    string;
}

export interface SyncJobResult {
  module:    ERPModule;
  total:     number;
  upserted:  number;
  skipped:   number;
  failed:    number;
  duration_ms: number;
}
```

### 2.3 `src/modules/ai/services/embedding.service.ts`

```typescript
import Ollama from 'ollama';
import crypto from 'crypto';

const ollama = new Ollama.Ollama({ host: 'http://localhost:11434' });

export const EMBED_MODEL = 'bge-m3';
export const EMBED_DIMENSIONS = 1024;

export class EmbeddingService {
  /**
   * Gọi Ollama bge-m3 để tạo vector từ text
   */
  async embed(text: string): Promise<number[]> {
    const response = await ollama.embeddings({
      model: EMBED_MODEL,
      prompt: text,
    });
    return response.embedding;
  }

  /**
   * Batch embed — xử lý nhiều text, có delay tránh quá tải
   */
  async embedBatch(
    texts: string[],
    delayMs = 50
  ): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    }
    return results;
  }

  /**
   * Hash nội dung để check thay đổi — tránh re-embed không cần thiết
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

export const embeddingService = new EmbeddingService();
```

### 2.4 `src/modules/ai/services/qdrant.service.ts`

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import { EMBED_DIMENSIONS } from './embedding.service';
import type { EmbedPayload, SearchResult, ERPModule, EntityType } from '../types/ai.types';

const COLLECTION = 'erp_mini';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ host: 'localhost', port: 6333 });
  }

  /**
   * Khởi tạo collection — chạy 1 lần khi server start
   */
  async initCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION);

    if (!exists) {
      await this.client.createCollection(COLLECTION, {
        vectors: {
          size:     EMBED_DIMENSIONS,
          distance: 'Cosine',
        },
      });

      // Tạo payload indexes để filter nhanh
      await this.client.createPayloadIndex(COLLECTION, {
        field_name: 'module',
        field_schema: 'keyword',
      });
      await this.client.createPayloadIndex(COLLECTION, {
        field_name: 'entity_type',
        field_schema: 'keyword',
      });
      await this.client.createPayloadIndex(COLLECTION, {
        field_name: 'entity_id',
        field_schema: 'integer',
      });

      console.log(`[Qdrant] Collection '${COLLECTION}' created — ${EMBED_DIMENSIONS}d`);
    } else {
      console.log(`[Qdrant] Collection '${COLLECTION}' already exists`);
    }
  }

  /**
   * Upsert 1 record vào Qdrant
   */
  async upsert(payload: EmbedPayload, vector: number[]): Promise<void> {
    // Tạo unique ID từ module + entity_type + entity_id
    const pointId = this.makePointId(
      payload.module,
      payload.entity_type,
      payload.entity_id
    );

    await this.client.upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id:      pointId,
          vector,
          payload: {
            module:       payload.module,
            entity_type:  payload.entity_type,
            entity_id:    payload.entity_id,
            content_text: payload.content_text,
            content_hash: payload.content_hash,
            ...(payload.extra ?? {}),
          },
        },
      ],
    });
  }

  /**
   * Batch upsert — hiệu quả hơn khi sync nhiều records
   */
  async upsertBatch(
    items: Array<{ payload: EmbedPayload; vector: number[] }>
  ): Promise<void> {
    const points = items.map(({ payload, vector }) => ({
      id:      this.makePointId(payload.module, payload.entity_type, payload.entity_id),
      vector,
      payload: {
        module:       payload.module,
        entity_type:  payload.entity_type,
        entity_id:    payload.entity_id,
        content_text: payload.content_text,
        content_hash: payload.content_hash,
        ...(payload.extra ?? {}),
      },
    }));

    await this.client.upsert(COLLECTION, { wait: true, points });
  }

  /**
   * Tìm kiếm semantic với optional filter
   */
  async search(
    vector: number[],
    opts: {
      module?:      ERPModule;
      entity_type?: EntityType;
      top_k?:       number;
    } = {}
  ): Promise<SearchResult[]> {
    const { module, entity_type, top_k = 5 } = opts;

    const must: object[] = [];
    if (module)      must.push({ key: 'module',      match: { value: module } });
    if (entity_type) must.push({ key: 'entity_type', match: { value: entity_type } });

    const results = await this.client.search(COLLECTION, {
      vector,
      limit:        top_k,
      with_payload: true,
      filter:       must.length ? { must } : undefined,
    });

    return results.map(r => ({
      score:        r.score,
      entity_id:    r.payload!['entity_id']    as number,
      entity_type:  r.payload!['entity_type']  as EntityType,
      module:       r.payload!['module']        as ERPModule,
      content_text: r.payload!['content_text']  as string,
    }));
  }

  /**
   * Lấy content_hash hiện tại để check có cần re-embed không
   */
  async getContentHash(
    module: ERPModule,
    entity_type: EntityType,
    entity_id: number
  ): Promise<string | null> {
    const pointId = this.makePointId(module, entity_type, entity_id);
    try {
      const points = await this.client.retrieve(COLLECTION, {
        ids:          [pointId],
        with_payload: true,
      });
      if (points.length === 0) return null;
      return (points[0].payload?.['content_hash'] as string) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Tạo UUID stable từ composite key
   * Đảm bảo customer:1 và product:1 không bị trùng ID
   */
  private makePointId(
    module: string,
    entity_type: string,
    entity_id: number
  ): string {
    // Dùng số hash thuần để Qdrant không cần UUID
    // Format: module_hash (3 digit) + entity_type_hash (3 digit) + entity_id (padded)
    const key = `${module}:${entity_type}:${entity_id}`;
    const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `${hash % 1000}${entity_id}`;
    // Hoặc dùng UUID v5 nếu muốn an toàn hơn:
    // import { v5 as uuidv5 } from 'uuid';
    // return uuidv5(key, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  }
}

export const qdrantService = new QdrantService();
```

### 2.5 `src/modules/ai/templates/content.templates.ts`

```typescript
/**
 * SQL query để build content_text cho từng module
 * Thay tên bảng cho đúng với schema thực tế của bạn
 */
export const contentTemplates = {
  crm: {
    customer: `
      SELECT
        c.id,
        CONCAT_WS(' | ',
          CONCAT('Khách hàng: ', c.name),
          CONCAT('Mã KH: ',      c.code),
          CONCAT('Loại: ',       IFNULL(c.customer_type, 'Chưa phân loại')),
          CONCAT('Ngành: ',      IFNULL(c.industry,      'N/A')),
          CONCAT('Thành phố: ',  IFNULL(c.city,          'N/A')),
          CONCAT('Điện thoại: ', IFNULL(c.phone,         'N/A')),
          CONCAT('Email: ',      IFNULL(c.email,         'N/A')),
          CONCAT('Hạn mức: ',    IFNULL(c.credit_limit,  0)),
          CONCAT('Dư nợ: ',      IFNULL(c.outstanding_balance, 0)),
          CONCAT('Ghi chú: ',    IFNULL(c.notes, ''))
        ) AS content_text
      FROM customers c
      WHERE c.deleted_at IS NULL
    `,

    lead: `
      SELECT
        l.id,
        CONCAT_WS(' | ',
          CONCAT('Lead: ',          l.title),
          CONCAT('Khách hàng: ',    IFNULL(c.name, 'Chưa có')),
          CONCAT('Giai đoạn: ',     l.stage),
          CONCAT('Giá trị dự kiến: ', IFNULL(l.expected_value, 0)),
          CONCAT('Xác suất: ',      IFNULL(l.probability, 0), '%'),
          CONCAT('Người phụ trách: ', IFNULL(u.full_name, 'N/A')),
          CONCAT('Mô tả: ',         IFNULL(l.description, ''))
        ) AS content_text
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u     ON l.assigned_to = u.id
      WHERE l.deleted_at IS NULL
    `,
  },

  purchase: {
    purchase_order: `
      SELECT
        po.id,
        CONCAT(
          'Purchase Order: ', po.po_number, '\n',
          'Nhà cung cấp: ',   v.name,       '\n',
          'Ngày đặt: ',       DATE_FORMAT(po.order_date, '%d/%m/%Y'), '\n',
          'Ngày giao dự kiến: ', IFNULL(DATE_FORMAT(po.expected_date, '%d/%m/%Y'), 'N/A'), '\n',
          'Trạng thái: ',     po.status,    '\n',
          'Tổng tiền: ',      FORMAT(po.total_amount, 0), ' VND\n',
          'Hàng hóa: ',
          GROUP_CONCAT(
            CONCAT(pol.qty, ' ', p.name, ' x ', FORMAT(pol.unit_price, 0))
            ORDER BY pol.id
            SEPARATOR ', '
          )
        ) AS content_text
      FROM purchase_orders po
      JOIN vendors v               ON po.vendor_id = v.id
      JOIN purchase_order_lines pol ON pol.po_id    = po.id
      JOIN products p               ON pol.product_id = p.id
      WHERE po.deleted_at IS NULL
      GROUP BY po.id, po.po_number, v.name, po.order_date,
               po.expected_date, po.status, po.total_amount
    `,

    vendor: `
      SELECT
        v.id,
        CONCAT_WS(' | ',
          CONCAT('Nhà cung cấp: ', v.name),
          CONCAT('Mã NCC: ',       v.code),
          CONCAT('Loại: ',         IFNULL(v.vendor_type, 'N/A')),
          CONCAT('Điện thoại: ',   IFNULL(v.phone, 'N/A')),
          CONCAT('Email: ',        IFNULL(v.email, 'N/A')),
          CONCAT('Địa chỉ: ',      IFNULL(v.address, 'N/A')),
          CONCAT('Điều khoản TT: ', IFNULL(v.payment_terms, 'N/A')),
          CONCAT('Ghi chú: ',      IFNULL(v.notes, ''))
        ) AS content_text
      FROM vendors v
      WHERE v.deleted_at IS NULL
    `,
  },

  sale: {
    sale_order: `
      SELECT
        so.id,
        CONCAT(
          'Sale Order: ',   so.so_number,  '\n',
          'Khách hàng: ',   c.name,        '\n',
          'Ngày đặt: ',     DATE_FORMAT(so.order_date, '%d/%m/%Y'), '\n',
          'Trạng thái: ',   so.status,     '\n',
          'Tổng tiền: ',    FORMAT(so.total_amount, 0), ' VND\n',
          'Hàng hóa: ',
          GROUP_CONCAT(
            CONCAT(sol.qty, ' ', p.name, ' x ', FORMAT(sol.unit_price, 0))
            ORDER BY sol.id
            SEPARATOR ', '
          )
        ) AS content_text
      FROM sale_orders so
      JOIN customers c         ON so.customer_id = c.id
      JOIN sale_order_lines sol ON sol.so_id      = so.id
      JOIN products p           ON sol.product_id = p.id
      WHERE so.deleted_at IS NULL
      GROUP BY so.id, so.so_number, c.name, so.order_date,
               so.status, so.total_amount
    `,
  },

  inventory: {
    product: `
      SELECT
        p.id,
        CONCAT_WS(' | ',
          CONCAT('Sản phẩm: ',    p.name),
          CONCAT('SKU: ',          p.sku),
          CONCAT('Danh mục: ',     IFNULL(p.category, 'N/A')),
          CONCAT('ĐVT: ',          IFNULL(p.uom, 'cái')),
          CONCAT('Tồn kho: ',      IFNULL(SUM(sq.qty_on_hand), 0)),
          CONCAT('Giá bán: ',      FORMAT(IFNULL(p.sale_price, 0), 0)),
          CONCAT('Giá nhập TB: ',  FORMAT(IFNULL(p.avg_cost, 0), 0)),
          CONCAT('Mức tái đặt: ',  IFNULL(p.reorder_point, 0)),
          CONCAT('Mô tả: ',        IFNULL(p.description, ''))
        ) AS content_text
      FROM products p
      LEFT JOIN stock_quants sq ON sq.product_id = p.id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.sku, p.category, p.uom,
               p.sale_price, p.avg_cost, p.reorder_point, p.description
    `,
  },
};
```

### 2.6 `src/modules/ai/services/sync.service.ts`

```typescript
import { Sequelize, QueryTypes } from 'sequelize';
import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import { contentTemplates } from '../templates/content.templates';
import type { ERPModule, EntityType, SyncJobResult } from '../types/ai.types';

export class SyncService {
  constructor(private db: Sequelize) {}

  /**
   * Sync 1 entity type cụ thể
   */
  async syncEntity(
    module: ERPModule,
    entityType: EntityType,
    sql: string
  ): Promise<SyncJobResult> {
    const startTime = Date.now();
    const result: SyncJobResult = {
      module,
      total:    0,
      upserted: 0,
      skipped:  0,
      failed:   0,
      duration_ms: 0,
    };

    // Lấy records từ MySQL
    const rows = await this.db.query<{ id: number; content_text: string }>(
      sql,
      { type: QueryTypes.SELECT }
    );

    result.total = rows.length;
    console.log(`[Sync] ${module}/${entityType}: ${rows.length} records`);

    // Xử lý theo batch 10 records
    const BATCH_SIZE = 10;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (row) => {
          try {
            const newHash = embeddingService.hash(row.content_text);

            // Check hash — skip nếu content không đổi
            const existingHash = await qdrantService.getContentHash(
              module, entityType, row.id
            );
            if (existingHash === newHash) {
              result.skipped++;
              return;
            }

            // Embed + upsert
            const vector = await embeddingService.embed(row.content_text);
            await qdrantService.upsert(
              {
                module,
                entity_type:  entityType,
                entity_id:    row.id,
                content_text: row.content_text,
                content_hash: newHash,
              },
              vector
            );
            result.upserted++;
          } catch (err) {
            result.failed++;
            console.error(
              `[Sync] Failed ${module}/${entityType} id=${row.id}:`,
              err
            );
          }
        })
      );

      // Log tiến độ
      console.log(
        `[Sync] ${module}/${entityType}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`
      );
    }

    result.duration_ms = Date.now() - startTime;
    return result;
  }

  /**
   * Full sync toàn bộ ERP — chạy lần đầu hoặc re-index
   */
  async fullSync(): Promise<SyncJobResult[]> {
    const jobs: Array<{ module: ERPModule; entityType: EntityType; sql: string }> = [
      { module: 'crm',       entityType: 'customer',       sql: contentTemplates.crm.customer },
      { module: 'crm',       entityType: 'lead',           sql: contentTemplates.crm.lead },
      { module: 'purchase',  entityType: 'purchase_order', sql: contentTemplates.purchase.purchase_order },
      { module: 'purchase',  entityType: 'vendor',         sql: contentTemplates.purchase.vendor },
      { module: 'sale',      entityType: 'sale_order',     sql: contentTemplates.sale.sale_order },
      { module: 'inventory', entityType: 'product',        sql: contentTemplates.inventory.product },
    ];

    const results: SyncJobResult[] = [];
    for (const job of jobs) {
      const result = await this.syncEntity(job.module, job.entityType, job.sql);
      results.push(result);
      console.log(`[Sync] Done: ${job.module}/${job.entityType}`, result);
    }
    return results;
  }

  /**
   * Sync 1 record cụ thể — gọi sau INSERT/UPDATE trong các service khác
   * Ví dụ: sau khi tạo customer mới → gọi syncOne('crm', 'customer', newId)
   */
  async syncOne(
    module: ERPModule,
    entityType: EntityType,
    entityId: number
  ): Promise<void> {
    const templateKey = entityType as keyof (typeof contentTemplates)[typeof module];
    const baseSql = (contentTemplates[module] as Record<string, string>)[entityType];
    if (!baseSql) {
      console.warn(`[Sync] No template for ${module}/${entityType}`);
      return;
    }

    // Thêm WHERE clause filter theo ID
    const sql = `${baseSql} HAVING id = :entityId`
      .replace('WHERE', `WHERE c.id = :entityId AND`); // adjust per entity

    // Đơn giản hơn: build SQL có sẵn WHERE id
    const rows = await this.db.query<{ id: number; content_text: string }>(
      `${baseSql} AND id = :entityId`,  // nếu template đã có WHERE
      {
        type:        QueryTypes.SELECT,
        replacements: { entityId },
      }
    );

    if (rows.length === 0) return;

    const row = rows[0];
    const newHash = embeddingService.hash(row.content_text);
    const existingHash = await qdrantService.getContentHash(module, entityType, entityId);

    if (existingHash === newHash) return; // no change

    const vector = await embeddingService.embed(row.content_text);
    await qdrantService.upsert(
      {
        module,
        entity_type:  entityType,
        entity_id:    entityId,
        content_text: row.content_text,
        content_hash: newHash,
      },
      vector
    );
    console.log(`[Sync] syncOne done: ${module}/${entityType} id=${entityId}`);
  }
}
```

### 2.7 `src/modules/ai/services/chat.service.ts`

```typescript
import Ollama from 'ollama';
import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import type { ChatRequest, ChatResponse, ChatMessage } from '../types/ai.types';

const ollama = new Ollama.Ollama({ host: 'http://localhost:11434' });
const CHAT_MODEL = 'qwen2.5:7b';

export class ChatService {
  /**
   * RAG pipeline hoàn chỉnh — non-streaming
   */
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { message, module, history = [], top_k = 5 } = req;

    // 1. Tìm context từ Qdrant
    const queryVector = await embeddingService.embed(message);
    const sources = await qdrantService.search(queryVector, { module, top_k });

    // 2. Build context string
    const contextText = sources.length > 0
      ? sources
          .map(s => `[${s.entity_type.toUpperCase()} | score: ${s.score.toFixed(2)}]\n${s.content_text}`)
          .join('\n\n')
      : 'Không tìm thấy dữ liệu liên quan trong hệ thống.';

    // 3. Build messages
    const systemPrompt = `Bạn là AI assistant của hệ thống ERP Mini. 
Nhiệm vụ: trả lời câu hỏi của người dùng dựa trên dữ liệu thực tế bên dưới.

Quy tắc bắt buộc:
- CHỈ dùng thông tin trong phần DỮ LIỆU ERP
- Nếu không có thông tin, trả lời: "Không tìm thấy dữ liệu phù hợp trong hệ thống"
- Trả lời ngắn gọn, chính xác bằng tiếng Việt
- Với số tiền: định dạng có dấu phân cách (1,000,000 VND)
- Với ngày tháng: định dạng dd/mm/yyyy

DỮ LIỆU ERP:
${contextText}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6), // Giữ 6 turns gần nhất
      { role: 'user', content: message },
    ];

    // 4. Gọi Qwen2.5
    const response = await ollama.chat({
      model:    CHAT_MODEL,
      messages: messages as Ollama.Message[],
      stream:   false,
    });

    return {
      answer:  response.message.content,
      sources,
      model:   CHAT_MODEL,
    };
  }

  /**
   * RAG pipeline với streaming — dùng cho Socket.io
   */
  async *chatStream(req: ChatRequest): AsyncGenerator<string> {
    const { message, module, history = [], top_k = 5 } = req;

    const queryVector = await embeddingService.embed(message);
    const sources = await qdrantService.search(queryVector, { module, top_k });

    const contextText = sources.length > 0
      ? sources.map(s => `[${s.entity_type.toUpperCase()}] ${s.content_text}`).join('\n\n')
      : 'Không tìm thấy dữ liệu liên quan.';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Bạn là AI assistant ERP Mini. Trả lời dựa trên dữ liệu sau:\n\n${contextText}`,
      },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const stream = await ollama.chat({
      model:    CHAT_MODEL,
      messages: messages as Ollama.Message[],
      stream:   true,
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        yield chunk.message.content;
      }
    }
  }
}

export const chatService = new ChatService();
```

### 2.8 `src/modules/ai/ai.controller.ts`

```typescript
import { Request, Response } from 'express';
import { chatService } from './services/chat.service';
import { syncService } from './services/sync.service';  // inject db
import type { ChatRequest, ERPModule } from './types/ai.types';

export class AIController {
  /**
   * POST /api/ai/chat
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as ChatRequest;

      if (!body.message?.trim()) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const result = await chatService.chat(body);
      res.json(result);
    } catch (err) {
      console.error('[AI] chat error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/ai/sync
   * Body: { module?: ERPModule } — nếu không có module thì sync tất cả
   */
  async sync(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.body as { module?: ERPModule };
      // fullSync hoặc sync từng module — tuỳ implement
      const results = await syncService.fullSync();
      res.json({ success: true, results });
    } catch (err) {
      console.error('[AI] sync error:', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  }

  /**
   * GET /api/ai/health
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.json({
      status:  'ok',
      ollama:  'http://localhost:11434',
      qdrant:  'http://localhost:6333',
      model:   'qwen2.5:7b',
      embed:   'bge-m3',
    });
  }
}

export const aiController = new AIController();
```

### 2.9 `src/modules/ai/ai.routes.ts`

```typescript
import { Router } from 'express';
import { aiController } from './ai.controller';
// import { authMiddleware } from '../auth/auth.middleware'; // bật nếu cần auth

const router = Router();

router.get(  '/health', aiController.health.bind(aiController));
router.post( '/chat',   aiController.chat.bind(aiController));
router.post( '/sync',   aiController.sync.bind(aiController));

export default router;
```

### 2.10 Đăng ký vào `src/server.ts`

```typescript
// Thêm vào server.ts hiện tại

import aiRoutes from './modules/ai/ai.routes';
import { qdrantService } from './modules/ai/services/qdrant.service';

// Sau khi connect DB, trước khi start server:
async function bootstrap() {
  // ... existing code ...

  // Init Qdrant collection
  await qdrantService.initCollection();

  // Register AI routes
  app.use('/api/ai', aiRoutes);

  // ... start server ...
}
```

### 2.11 Socket.io — Streaming chat realtime

```typescript
// Thêm vào socket handler hiện tại của bạn

import { chatService } from './modules/ai/services/chat.service';
import type { ChatRequest } from './modules/ai/types/ai.types';

io.on('connection', (socket) => {
  // ... existing handlers ...

  socket.on('ai:chat', async (req: ChatRequest) => {
    try {
      // Emit sources trước
      const queryVector = await embeddingService.embed(req.message);
      const sources = await qdrantService.search(queryVector, {
        module: req.module,
        top_k:  req.top_k ?? 5,
      });
      socket.emit('ai:sources', sources);

      // Stream từng chunk
      for await (const chunk of chatService.chatStream(req)) {
        socket.emit('ai:chunk', chunk);
      }

      socket.emit('ai:done');
    } catch (err) {
      socket.emit('ai:error', { message: 'Chat failed' });
    }
  });
});
```

---

## PHASE 3 — Frontend: Chat Widget (Ngày 3-4)

### 3.1 Cài packages Frontend

```bash
cd erp-frontend

# Không cần cài thêm gì — socket.io-client và axios đã có sẵn!
```

### 3.2 Redux slice — `src/store/aiSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { ChatMessage, SearchResult, ERPModule } from '../types/ai.types';

// Copy types từ backend hoặc tạo shared types package
interface AIState {
  messages:  Array<{ role: 'user' | 'assistant'; content: string; sources?: SearchResult[] }>;
  isLoading: boolean;
  error:     string | null;
  module:    ERPModule | null;
}

const initialState: AIState = {
  messages:  [],
  isLoading: false,
  error:     null,
  module:    null,
};

export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (payload: { message: string; module?: ERPModule; history: ChatMessage[] }) => {
    const res = await axios.post('/api/ai/chat', payload);
    return res.data as { answer: string; sources: SearchResult[] };
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setModule: (state, action: PayloadAction<ERPModule | null>) => {
      state.module = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
    },
    appendChunk: (state, action: PayloadAction<string>) => {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === 'assistant') {
        last.content += action.payload;
      } else {
        state.messages.push({ role: 'assistant', content: action.payload });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.isLoading = true;
        state.error     = null;
        state.messages.push({ role: 'user', content: action.meta.arg.message });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push({
          role:    'assistant',
          content: action.payload.answer,
          sources: action.payload.sources,
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.error.message ?? 'Lỗi không xác định';
      });
  },
});

export const { setModule, clearChat, appendChunk } = aiSlice.actions;
export default aiSlice.reducer;
```

### 3.3 Chat Widget Component — `src/components/ai/ChatWidget.tsx`

```tsx
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, clearChat, setModule } from '../../store/aiSlice';
import type { AppDispatch, RootState } from '../../store';
import type { ERPModule } from '../../types/ai.types';

const MODULE_OPTIONS: { value: ERPModule | null; label: string }[] = [
  { value: null,        label: 'Tất cả' },
  { value: 'crm',       label: 'CRM' },
  { value: 'purchase',  label: 'Mua hàng' },
  { value: 'sale',      label: 'Bán hàng' },
  { value: 'inventory', label: 'Kho hàng' },
];

export default function ChatWidget() {
  const dispatch   = useDispatch<AppDispatch>();
  const { messages, isLoading, module } = useSelector((s: RootState) => s.ai);

  const [input,     setInput]     = useState('');
  const [isOpen,    setIsOpen]    = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    dispatch(sendMessage({ message: input, module: module ?? undefined, history }));
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700
                   text-white rounded-full shadow-lg flex items-center justify-center
                   transition-all z-50"
      >
        {/* Bot icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl
                    shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-medium">ERP AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch(clearChat())}
            className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded">
            Xóa chat
          </button>
          <button onClick={() => setIsOpen(false)}
            className="text-blue-200 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Module filter */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        {MODULE_OPTIONS.map(opt => (
          <button
            key={String(opt.value)}
            onClick={() => dispatch(setModule(opt.value))}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              module === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <p className="mb-2 text-2xl">🤖</p>
            <p>Xin chào! Tôi có thể giúp bạn tra cứu</p>
            <p>thông tin trong hệ thống ERP.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    {msg.sources.length} nguồn tham chiếu
                  </summary>
                  <div className="mt-1 space-y-1">
                    {msg.sources.map((s, i) => (
                      <div key={i} className="text-xs bg-white rounded p-1.5 border border-gray-200">
                        <span className="font-medium text-blue-600">{s.entity_type}</span>
                        <span className="text-gray-400 ml-1">({(s.score * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về khách hàng, đơn hàng, kho..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2
                       text-sm focus:outline-none focus:border-blue-400 max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium
                       disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            Gửi
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  );
}
```

### 3.4 Đăng ký vào App

```tsx
// src/App.tsx — thêm ChatWidget vào cuối
import ChatWidget from './components/ai/ChatWidget';

function App() {
  return (
    <>
      {/* ... existing routes ... */}
      <ChatWidget />   {/* Float button ở mọi trang */}
    </>
  );
}
```

---

## PHASE 4 — Incremental Sync (Ngày 5)

Sau full sync lần đầu, cần auto-sync khi data thay đổi. Thêm vào các service hiện tại:

```typescript
// Ví dụ trong customer.service.ts — sau khi tạo/cập nhật
import { syncService } from '../ai/services/sync.service';

async createCustomer(data: CreateCustomerDto) {
  const customer = await Customer.create(data);

  // Sync sang Qdrant bất đồng bộ — không block response
  syncService.syncOne('crm', 'customer', customer.id).catch(err =>
    console.error('[Sync] background sync failed:', err)
  );

  return customer;
}

async updateCustomer(id: number, data: UpdateCustomerDto) {
  await Customer.update(data, { where: { id } });

  // Re-embed record vừa cập nhật
  syncService.syncOne('crm', 'customer', id).catch(console.error);

  return Customer.findByPk(id);
}
```

---

## PHASE 5 — Kiểm tra toàn bộ pipeline

### Checklist cuối cùng

```bash
# 1. Ollama đang chạy?
curl http://localhost:11434/api/tags

# 2. Qdrant đang chạy?
curl http://localhost:6333/collections

# 3. Backend health check
curl http://localhost:3000/api/ai/health

# 4. Chạy full sync lần đầu
curl -X POST http://localhost:3000/api/ai/sync

# 5. Test chat
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Khách hàng nào có dư nợ cao nhất?", "module": "crm"}'

# 6. Kiểm tra Qdrant dashboard
# http://localhost:6333/dashboard → Collections → erp_mini → xem vectors
```

---

## Tóm tắt thứ tự thực hiện

| Ngày | Việc làm | Kết quả |
|------|----------|---------|
| 1 sáng | Cài Ollama, pull bge-m3 + qwen2.5:7b | Ollama chạy OK |
| 1 chiều | Chạy Qdrant Docker, npm install | Qdrant chạy OK |
| 2 sáng | Tạo types, EmbeddingService, QdrantService | Unit test 2 service |
| 2 chiều | ContentTemplates, SyncService, fullSync | Data vào Qdrant |
| 3 sáng | ChatService RAG pipeline | Test chat qua curl |
| 3 chiều | Controller + Routes + Socket.io stream | API hoạt động |
| 4 sáng | Redux slice + ChatWidget React | UI hiện thị |
| 4 chiều | Tích hợp vào App, test end-to-end | Demo được |
| 5 | Incremental sync hook vào các service | Auto-sync khi data thay đổi |
