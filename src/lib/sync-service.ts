import { ProjectRepository } from '@/repositories/ProjectRepository';
import { SyncLogRepository } from '@/repositories/SyncLogRepository';
import { GoogleSheetsClient } from './google-sheets';
import { getSheetId } from './env';
import { HistoryEntry } from '@/utils/duration';
import { parseJsonArray } from '@/utils/json';
import { normalizeWhitespace } from '@/utils/validation';
import { WebSocketServer } from './websocket';

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
      const gid = getSheetId();
      const rows = await GoogleSheetsClient.getRowsFromGid(gid, 'A4:AF');

      if (!rows || rows.length === 0) {
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

      for (const row of rows) {
        try {
          if (row.length < 16) continue;

          const region = (row[6] ?? '').toString().trim();
          if (region !== 'SUMBAGTENG') continue;

          const id_ihld = (row[1] ?? '').toString().trim();
          const batch_program = (row[8] ?? '').toString().trim();
          
          if (!id_ihld) {
            failed++;
            continue;
          }

          const uid = `${id_ihld}::${batch_program}`;
          const existing = ProjectRepository.findByUid(uid);
          
          let history: HistoryEntry[] = [];
          const newStatus = (row[14] ?? '').toString().trim();
          const newSubStatus = (row[15] ?? '').toString().trim();

          if (existing) {
            updated++;
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
          }

          const fullDataAtoAF = row.slice(0, 32).map(v => v === undefined || v === null ? '' : v);

          ProjectRepository.upsert({
            uid,
            id_ihld,
            batch_program,
            nama_lop: (row[2] ?? '').toString().trim(),
            region,
            status: newStatus,
            sub_status: newSubStatus,
            full_data: JSON.stringify(fullDataAtoAF),
            history: JSON.stringify(history)
          });
          processed++;
        } catch (err) {
          console.error(`Error processing row:`, err);
          failed++;
        }
      }

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
        total: rows.length,
        completed_at: completedAt
      };

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
