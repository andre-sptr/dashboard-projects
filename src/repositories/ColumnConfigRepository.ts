import { db } from '../lib/db';
import {
  COLUMN_FIELDS,
  type ColKey,
  type ColumnConfigEntry,
  type ColumnMap,
} from '@/lib/sheet-columns';
import type { ProjectType } from '@/types/database';
import { getProjectColumnConfig, getProjectConfig } from '@/lib/project-config';
import { parseProjectType } from '@/lib/project-types';

export type ColumnConfigRow = ColumnConfigEntry;

const VALID_KEYS = new Set<string>(COLUMN_FIELDS.map((f) => f.key));

// Repository for runtime spreadsheet column mapping (column_config table).
export class ColumnConfigRepository {
  // All config rows ordered for display.
  static getAll(projectType: ProjectType = 'JPP'): ColumnConfigRow[] {
    const resolvedType = parseProjectType(projectType);
    const rows = db
      .prepare(`
        SELECT field_key, label, header_text, col_index, sort_order
        FROM column_config
        WHERE project_type = ?
        ORDER BY sort_order ASC
      `)
      .all(resolvedType) as ColumnConfigRow[];

    return rows.length > 0 ? rows : getProjectColumnConfig(resolvedType);
  }

  // Resolved field_key to col_index map. Falls back to defaults for missing keys.
  static getMap(projectType: ProjectType = 'JPP'): ColumnMap {
    const resolvedType = parseProjectType(projectType);
    const map: ColumnMap = { ...getProjectConfig(resolvedType).fieldMap };
    const rows = db
      .prepare('SELECT field_key, col_index FROM column_config WHERE project_type = ?')
      .all(resolvedType) as { field_key: string; col_index: number }[];

    for (const row of rows) {
      if (VALID_KEYS.has(row.field_key) && Number.isInteger(row.col_index) && row.col_index >= 0) {
        map[row.field_key as ColKey] = row.col_index;
      }
    }
    return map;
  }

  // Update col_index and optionally header_text for a set of fields.
  static updateMany(entries: { field_key: string; col_index: number; header_text?: string }[]): void;
  static updateMany(projectType: ProjectType, entries: { field_key: string; col_index: number; header_text?: string }[]): void;
  static updateMany(
    projectTypeOrEntries: ProjectType | { field_key: string; col_index: number; header_text?: string }[],
    maybeEntries?: { field_key: string; col_index: number; header_text?: string }[]
  ): void {
    const projectType = Array.isArray(projectTypeOrEntries) ? 'JPP' : parseProjectType(projectTypeOrEntries);
    const entries = Array.isArray(projectTypeOrEntries) ? projectTypeOrEntries : (maybeEntries ?? []);
    const updIndex = db.prepare('UPDATE column_config SET col_index = ? WHERE project_type = ? AND field_key = ?');
    const updBoth = db.prepare(
      'UPDATE column_config SET col_index = ?, header_text = ? WHERE project_type = ? AND field_key = ?'
    );
    const tx = db.transaction((items: typeof entries) => {
      for (const item of items) {
        if (!VALID_KEYS.has(item.field_key)) continue;
        if (!Number.isInteger(item.col_index) || item.col_index < 0) continue;
        if (typeof item.header_text === 'string') {
          updBoth.run(item.col_index, item.header_text, projectType, item.field_key);
        } else {
          updIndex.run(item.col_index, projectType, item.field_key);
        }
      }
    });
    tx(entries);
  }

  // Restore every field for one project type to its default index, label, and header text.
  static resetDefaults(projectType: ProjectType = 'JPP'): void {
    const resolvedType = parseProjectType(projectType);
    const upd = db.prepare(`
      UPDATE column_config
      SET label = ?, col_index = ?, header_text = ?
      WHERE project_type = ? AND field_key = ?
    `);
    const tx = db.transaction(() => {
      for (const field of getProjectColumnConfig(resolvedType)) {
        upd.run(field.label, field.col_index, field.header_text, resolvedType, field.field_key);
      }
    });
    tx();
  }
}
