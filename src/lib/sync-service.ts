import { ProjectRepository } from '@/repositories/ProjectRepository';
import { SyncLogRepository } from '@/repositories/SyncLogRepository';
import { AuditLogger } from './audit-logger';
import { GoogleSheetsClient } from './google-sheets';
import { getProjectSheetId } from './env';
import { HistoryEntry } from '@/utils/duration';
import { parseJsonArray } from '@/utils/json';
import { normalizeWhitespace } from '@/utils/validation';
import { WebSocketServer } from './websocket';
import { indexToLetter } from './sheet-columns';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import { db } from './db';
import { getAllProjectConfigs, type ProjectConfig } from './project-config';
import { mapSheetRowToProjectData } from './project-row-mapper';

function normalizeStatus(value: string): string {
  return normalizeWhitespace(
    (value || '').replace(/[\u00A0\u200B\u200C\u200D\uFEFF\r\n\t]/g, ' ')
  );
}

export class SyncService {
  static async syncProjects() {
    const startedAt = new Date().toISOString();
    const syncLogId = SyncLogRepository.create({
      sync_type: 'PROJECTS',
      status: 'IN_PROGRESS',
      started_at: startedAt,
    });

    try {
      const sourceConfigs: ProjectConfig[] = getAllProjectConfigs().map((config) => ({
        ...config,
        gid: getProjectSheetId(config.type),
        fieldMap: config.type === 'JPP' ? ColumnConfigRepository.getMap() : config.fieldMap,
      }));

      const sourceRows = await Promise.all(sourceConfigs.map(async (config) => {
        const maxIndex = Math.max(...Object.values(config.fieldMap));
        const endLetter = indexToLetter(maxIndex);
        const rows = await GoogleSheetsClient.getRowsFromGid(
          config.gid,
          `A${config.dataStartRow}:${endLetter}`
        );
        return { config, rows };
      }));

      const totalRows = sourceRows.reduce((sum, source) => sum + source.rows.length, 0);
      if (totalRows === 0) {
        const errorMsg = 'Tidak ada data valid yang ditemukan.';
        SyncLogRepository.update(syncLogId, {
          status: 'FAILED',
          completed_at: new Date().toISOString(),
          error_message: errorMsg,
        });
        
        WebSocketServer.emit('sync.completed', { success: false, message: errorMsg });
        
        return { success: false, message: errorMsg };
      }

      let processed = 0;
      let created = 0;
      let updated = 0;
      let failed = 0;
      const byProject: Record<string, { total: number; processed: number; created: number; updated: number; failed: number }> = {};

      // Wrap whole loop in single transaction for significant performance boost
      const syncTransaction = db.transaction(() => {
        for (const { config, rows } of sourceRows) {
          const projectStats = byProject[config.type] ?? {
            total: rows.length,
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0,
          };
          byProject[config.type] = projectStats;

          for (const row of rows) {
            try {
              const mapped = mapSheetRowToProjectData(row, config);
              if (!mapped) continue;

              const existing = ProjectRepository.findByUid(mapped.uid);
              let history: HistoryEntry[] = [];
              const newStatus = mapped.status;
              const newSubStatus = mapped.sub_status;

              if (existing) {
                updated++;
                projectStats.updated++;
                const prevStatus = normalizeStatus(existing.status);
                const prevSubStatus = normalizeStatus(existing.sub_status);

                let dateStr = existing.last_changed_at;
                if (!dateStr.includes('T')) dateStr = dateStr.replace(' ', 'T') + 'Z';
                else if (!dateStr.endsWith('Z')) dateStr = dateStr + 'Z';

                const prevChangedAt = new Date(dateStr);
                const now = new Date();
                const durationMinutes = Math.max(0, Math.round((now.getTime() - prevChangedAt.getTime()) / 60000));

                history = parseJsonArray<HistoryEntry>(existing.history || '[]', []);

                if (prevStatus !== normalizeStatus(newStatus) || prevSubStatus !== normalizeStatus(newSubStatus)) {
                  const lastEntry = history[history.length - 1];
                  const isDuplicate = lastEntry &&
                    normalizeStatus(lastEntry.status) === prevStatus &&
                    normalizeStatus(lastEntry.sub_status) === prevSubStatus;

                  if (!isDuplicate) {
                    history.push({
                      status: existing.status,
                      sub_status: existing.sub_status,
                      duration_minutes: durationMinutes,
                      ended_at: now.toISOString()
                    });
                  }
                }
              } else {
                created++;
                projectStats.created++;
              }

              let goliveTargetViolated = 0;
              let finalGoliveTarget = mapped.golive_target || '';
              const fullData = parseJsonArray<unknown>(mapped.full_data, []);

              if (existing && config.enforceGoliveDeadline) {
                const newGoliveTarget = finalGoliveTarget;
                const oldGoliveTarget = existing.golive_target || '';

                if (newGoliveTarget !== oldGoliveTarget && oldGoliveTarget !== '') {
                  const currentDay = new Date().getDate();
                  const deadlineDay = Number(process.env.GOLIVE_TARGET_DEADLINE_DAY) || 10;
                  if (currentDay > deadlineDay) {
                    finalGoliveTarget = oldGoliveTarget;
                    goliveTargetViolated = 1;
                    fullData[config.fieldMap.KOMITMEN_GOLIVE] = oldGoliveTarget;
                  } else {
                    goliveTargetViolated = 0;
                  }
                } else {
                  goliveTargetViolated = existing.golive_target_violated || 0;
                }
              }

              ProjectRepository.upsert({
                ...mapped,
                full_data: JSON.stringify(fullData),
                history: JSON.stringify(history),
                golive_target: finalGoliveTarget || null,
                golive_target_violated: goliveTargetViolated,
              });
              processed++;
              projectStats.processed++;
            } catch (err) {
              console.error(`Error processing ${config.type} row:`, err);
              failed++;
              projectStats.failed++;
            }
          }
        }
      });

      // Run transaction batch
      syncTransaction();

      const completedAt = new Date().toISOString();
      SyncLogRepository.update(syncLogId, {
        status: 'SUCCESS',
        completed_at: completedAt,
        records_processed: processed,
        records_created: created,
        records_updated: updated,
        records_failed: failed,
      });

      const result = { 
        success: true, 
        processed, 
        created, 
        updated, 
        failed,
        total: totalRows,
        byProject,
        completed_at: completedAt
      };

      await AuditLogger.log('system', 'SYNC', 'PROJECTS', syncLogId, {}, result);

      WebSocketServer.emit('sync.completed', result);

      return result;
    } catch (error) {
      console.error('Sync service error:', error);
      const errorMsg = (error as Error).message;
      SyncLogRepository.update(syncLogId, {
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error_message: errorMsg,
      });
      
      WebSocketServer.emit('sync.completed', { success: false, message: errorMsg });
      
      throw error;
    }
  }
}
