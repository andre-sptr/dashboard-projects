import { db } from '../lib/db';
import {
  COLUMN_FIELDS,
  DEFAULT_COLUMN_MAP,
  type ColKey,
  type ColumnConfigEntry,
  type ColumnMap,
} from '@/lib/sheet-columns';

export type ColumnConfigRow = ColumnConfigEntry;

const VALID_KEYS = new Set<string>(COLUMN_FIELDS.map((f) => f.key));

// Repository for runtime spreadsheet column mapping (column_config table).
export class ColumnConfigRepository {
  // All config rows ordered for display.
  static getAll(): ColumnConfigRow[] {
    return db
      .prepare('SELECT field_key, label, header_text, col_index, sort_order FROM column_config ORDER BY sort_order ASC')
      .all() as ColumnConfigRow[];
  }

  // Resolved field_key → col_index map. Falls back to defaults for any missing key
  // so consumers always receive a complete map.
  static getMap(): ColumnMap {
    const map: ColumnMap = { ...DEFAULT_COLUMN_MAP };
    const rows = db
      .prepare('SELECT field_key, col_index FROM column_config')
      .all() as { field_key: string; col_index: number }[];
    for (const row of rows) {
      if (VALID_KEYS.has(row.field_key) && Number.isInteger(row.col_index) && row.col_index >= 0) {
        map[row.field_key as ColKey] = row.col_index;
      }
    }
    return map;
  }

  // Update col_index (and optionally header_text) for a set of fields.
  static updateMany(entries: { field_key: string; col_index: number; header_text?: string }[]): void {
    const updIndex = db.prepare('UPDATE column_config SET col_index = ? WHERE field_key = ?');
    const updBoth = db.prepare('UPDATE column_config SET col_index = ?, header_text = ? WHERE field_key = ?');
    const tx = db.transaction((items: typeof entries) => {
      for (const item of items) {
        if (!VALID_KEYS.has(item.field_key)) continue;
        if (!Number.isInteger(item.col_index) || item.col_index < 0) continue;
        if (typeof item.header_text === 'string') {
          updBoth.run(item.col_index, item.header_text, item.field_key);
        } else {
          updIndex.run(item.col_index, item.field_key);
        }
      }
    });
    tx(entries);
  }

  // Restore every field to its default index and header text.
  static resetDefaults(): void {
    const upd = db.prepare('UPDATE column_config SET col_index = ?, header_text = ? WHERE field_key = ?');
    const tx = db.transaction(() => {
      for (const field of COLUMN_FIELDS) {
        upd.run(field.defaultIndex, field.headerText, field.key);
      }
    });
    tx();
  }
}
