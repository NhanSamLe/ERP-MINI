import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../../config/env';
import { EMBED_DIMENSIONS } from './embedding.service';
import type { EmbedPayload, SearchResult, ERPModule, EntityType } from '../types/ai.types';

const COLLECTION = 'erp_mini';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    const params: { url: string; apiKey?: string } = {
      url: env.qdrant.url,
    };
    if (env.qdrant.apiKey) {
      params.apiKey = env.qdrant.apiKey;
    }
    this.client = new QdrantClient(params);
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
      userRole?:    string | undefined;
    } = {}
  ): Promise<SearchResult[]> {
    const { module, entity_type, top_k = 5, userRole } = opts;

    const must: object[] = [];
    if (module)      must.push({ key: 'module',      match: { value: module } });
    if (entity_type) must.push({ key: 'entity_type', match: { value: entity_type } });
    if (userRole) {
      must.push({ key: 'allowed_roles', match: { value: userRole } });
    }

    const searchParams: any = {
      vector,
      limit:        top_k,
      with_payload: true,
    };
    if (must.length > 0) {
      searchParams.filter = { must };
    }

    const results = await this.client.search(COLLECTION, searchParams);

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
      const firstPoint = points[0];
      if (!firstPoint) return null;
      return (firstPoint.payload?.['content_hash'] as string) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Tạo UUID stable từ composite key
   */
  private makePointId(
    module: string,
    entity_type: string,
    entity_id: number
  ): number {
    let offset = 0;
    if (entity_type === 'customer') offset = 10000000;
    else if (entity_type === 'lead') offset = 20000000;
    else if (entity_type === 'purchase_order') offset = 30000000;
    else if (entity_type === 'vendor') offset = 40000000;
    else if (entity_type === 'sale_order') offset = 50000000;
    else if (entity_type === 'product') offset = 60000000;
    else offset = 70000000;

    return offset + entity_id;
  }
}

export const qdrantService = new QdrantService();
