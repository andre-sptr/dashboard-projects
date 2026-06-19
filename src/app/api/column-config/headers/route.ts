import { GoogleSheetsClient } from '@/lib/google-sheets';
import { getProjectSheetId } from '@/lib/env';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import { normalizeHeader } from '@/lib/sheet-columns';
import { successResponse, errorResponse } from '@/lib/response';
import { getProjectConfig } from '@/lib/project-config';
import { parseProjectType } from '@/lib/project-types';

// Returns the spreadsheet header row (row 2) plus an auto-detected col_index per
// field, matching each field's header_text against the live header cells.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectType = parseProjectType(searchParams.get('projectType'));
    const projectConfig = getProjectConfig(projectType);
    const gid = getProjectSheetId(projectType);
    const rows = await GoogleSheetsClient.getRowsFromGid(gid, `${projectConfig.dataStartRow}:${projectConfig.dataStartRow}`);
    const headerRow = (rows[0] ?? []).map((v) => (v === undefined || v === null ? '' : String(v)));

    const config = ColumnConfigRepository.getAll(projectType);
    const normalizedHeaders = headerRow.map((h) => normalizeHeader(h));

    const detected = config.map((field) => {
      const target = normalizeHeader(field.header_text);
      let matchIndex = -1;
      if (target) {
        matchIndex = normalizedHeaders.findIndex((h) => h === target);
        if (matchIndex === -1) {
          // Fall back to substring match for minor header wording differences.
          matchIndex = normalizedHeaders.findIndex(
            (h) => h.length > 0 && (h.includes(target) || target.includes(h))
          );
        }
      }
      return {
        field_key: field.field_key,
        detected_index: matchIndex,
        matched_header: matchIndex >= 0 ? headerRow[matchIndex] : null,
      };
    });

    return successResponse({ headers: headerRow, detected });
  } catch (error) {
    console.error('Detect headers error:', error);
    return errorResponse((error as Error).message);
  }
}
