import { Sequelize, QueryTypes } from 'sequelize';
import { sequelize as defaultDb } from '../../../config/db';
import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import { contentTemplates } from '../templates/content.templates';
import type { ERPModule, EntityType, SyncJobResult } from '../types/ai.types';

export class SyncService {
  private db: Sequelize;

  constructor(db?: Sequelize) {
    this.db = db || defaultDb;
  }

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
            const contentText = (row.content_text && row.content_text.trim()) ? row.content_text.trim() : "N/A";
            const newHash = embeddingService.hash(contentText);

            // Check hash — skip nếu content không đổi
            const existingHash = await qdrantService.getContentHash(
              module, entityType, row.id
            );
            if (existingHash === newHash) {
              result.skipped++;
              return;
            }

            // Embed + upsert
            const vector = await embeddingService.embed(contentText);
            await qdrantService.upsert(
              {
                module,
                entity_type:  entityType,
                entity_id:    row.id,
                content_text: row.content_text,
                content_hash: newHash,
                extra: {
                  allowed_roles: getAllowedRoles(module),
                },
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
      try {
        const result = await this.syncEntity(job.module, job.entityType, job.sql);
        results.push(result);
        console.log(`[Sync] Done: ${job.module}/${job.entityType}`, result);
      } catch (error) {
        console.error(`[Sync] Failed job ${job.module}/${job.entityType}:`, error);
      }
    }
    return results;
  }

  /**
   * Sync 1 record cụ thể — gọi sau INSERT/UPDATE trong các service khác
   */
  async syncOne(
    module: ERPModule,
    entityType: EntityType,
    entityId: number
  ): Promise<void> {
    const templates = contentTemplates as Record<string, Record<string, string> | undefined>;
    const baseSql = templates[module]?.[entityType];
    if (!baseSql) {
      console.warn(`[Sync] No template for ${module}/${entityType}`);
      return;
    }

    const rows = await this.db.query<{ id: number; content_text: string }>(
      `SELECT * FROM (${baseSql}) AS sub WHERE id = :entityId`,
      {
        type:        QueryTypes.SELECT,
        replacements: { entityId },
      }
    );

    if (rows.length === 0) return;

    const row = rows[0];
    if (!row) return;
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
        extra: {
          allowed_roles: getAllowedRoles(module),
        },
      },
      vector
    );
    console.log(`[Sync] syncOne done: ${module}/${entityType} id=${entityId}`);
  }
}

function getAllowedRoles(module: ERPModule): string[] {
  if (module === 'crm') return ['ADMIN', 'SALE'];
  if (module === 'purchase') return ['ADMIN', 'PURCHASE'];
  if (module === 'sale') return ['ADMIN', 'SALE'];
  return ['ADMIN', 'INVENTORY', 'SALE', 'PURCHASE']; // default for inventory / others
}

export const syncService = new SyncService();
