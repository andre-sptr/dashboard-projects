import { db } from '../lib/db';

export interface OltOdcRow {
  id: number;
  area: string;
  sto: string;
  olt_name: string;
  odc_name: string;
  port_str: string;
  frame: string;
  slot: number;
  port: number;
}

export class OltOdcRepository {
  static isEmpty(): boolean {
    const row = db.prepare('SELECT 1 FROM olt_odc_map LIMIT 1').get();
    return row === undefined;
  }

  static findAll(): OltOdcRow[] {
    return db.prepare(
      'SELECT id, area, sto, olt_name, odc_name, port_str, frame, slot, port FROM olt_odc_map ORDER BY area, sto, olt_name, slot, port'
    ).all() as OltOdcRow[];
  }

  static bulkInsert(rows: Omit<OltOdcRow, 'id'>[]): void {
    if (rows.length === 0) return;
    const insert = db.prepare(
      'INSERT OR IGNORE INTO olt_odc_map (area, sto, olt_name, odc_name, port_str, frame, slot, port) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    db.transaction(() => {
      for (const row of rows) {
        insert.run(row.area, row.sto, row.olt_name, row.odc_name, row.port_str, row.frame, row.slot, row.port);
      }
    })();
  }
}
