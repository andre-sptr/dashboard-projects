import { NextRequest } from 'next/server';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { Project } from '@/lib/db';
import { downloadAndParseExcel } from '@/lib/parseExcel';
import { HistoryEntry } from '@/utils/duration';
import { successResponse, errorResponse } from '@/lib/response';
import { parseJsonArray } from '@/utils/json';
import { normalizeWhitespace } from '@/utils/validation';

function normalizeStatus(value: string): string {
  return normalizeWhitespace(
    value.replace(/[\u00A0\u200B\u200C\u200D\uFEFF\r\n\t]/g, ' ')
  );
}

export async function POST(request: NextRequest) {
  try {
    const rows = await downloadAndParseExcel();

    if (!rows || rows.length === 0) {
      return errorResponse('Tidak ada data valid yang ditemukan.', 400);
    }

    let processed = 0;

    for (const row of rows) {
      const existing = ProjectRepository.findByUid(row.uid);
      let history: HistoryEntry[] = [];

      if (existing) {
        const prevStatus = normalizeStatus(existing.status);
        const prevSubStatus = normalizeStatus(existing.sub_status);
        const newStatus = normalizeStatus(row.status);
        const newSubStatus = normalizeStatus(row.sub_status);

        let dateStr = existing.last_changed_at;
        if (!dateStr.includes('T')) dateStr = dateStr.replace(' ', 'T') + 'Z';
        else if (!dateStr.endsWith('Z')) dateStr = dateStr + 'Z';

        const prevChangedAt = new Date(dateStr);
        const now = new Date();
        const durationMinutes = Math.max(0, Math.round((now.getTime() - prevChangedAt.getTime()) / 60000));

        history = parseJsonArray<HistoryEntry>(existing.history || '[]', []);

        if (prevStatus !== newStatus || prevSubStatus !== newSubStatus) {
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
      }

      ProjectRepository.upsert({
        uid: row.uid,
        id_ihld: row.id_ihld,
        batch_program: row.batch_program,
        nama_lop: row.nama_lop,
        region: row.region,
        status: row.status,
        sub_status: row.sub_status,
        full_data: row.full_data,
        history: JSON.stringify(history)
      });
      processed++;
    }

    return successResponse({ processed, total: rows.length }, 'Sync project berhasil');
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse((error as Error).message);
  }
}
