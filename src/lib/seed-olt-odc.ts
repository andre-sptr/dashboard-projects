import * as fs from 'fs';
import * as XLSX from 'xlsx';
import path from 'path';
import { OltOdcRepository, type OltOdcRow } from '@/repositories/OltOdcRepository';

function parsePort(portStr: string): { frame: string; slot: number; port: number } | null {
  if (!portStr.includes('/')) return null;
  const parts = portStr.split('/');
  if (parts.length < 3) return null;

  const portNum = parseInt(parts[parts.length - 1], 10);
  const slotNum = parseInt(parts[parts.length - 2], 10);
  if (isNaN(portNum) || isNaN(slotNum)) return null;
  if (portNum > 47 || slotNum > 63) return null;

  const frame = parts.slice(0, parts.length - 2).join('/');
  return { frame, slot: slotNum, port: portNum };
}

export function seedOltOdcIfEmpty(): void {
  if (!OltOdcRepository.isEmpty()) return;

  const xlsxPath = path.join(process.cwd(), 'data', 'OLT-ODC.xlsx');

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(xlsxPath);
  } catch (err) {
    console.error(`[seed-olt-odc] Cannot read OLT-ODC.xlsx at ${xlsxPath}:`, err);
    return;
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    console.error(`[seed-olt-odc] Failed to parse OLT-ODC.xlsx:`, err);
    return;
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    range: 1,
  }) as unknown[][];

  // Columns: [0]=AREA [1]=STO [2]=OLT [3]=OLT_ODC_PORT [4]=ODC
  const seen = new Set<string>();
  const unique: Omit<OltOdcRow, 'id'>[] = [];

  for (const row of rows) {
    const olt = String(row[2] || '').trim();
    const portStr = String(row[3] || '').trim();
    const odc = String(row[4] || '').trim();

    if (!olt || !odc || !portStr) continue;

    const parsed = parsePort(portStr);
    if (!parsed) continue;

    const key = `${olt}|${portStr}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        area: String(row[0] || '').trim(),
        sto: String(row[1] || '').trim(),
        olt_name: olt,
        odc_name: odc,
        port_str: portStr,
        frame: parsed.frame,
        slot: parsed.slot,
        port: parsed.port,
      });
    }
  }

  OltOdcRepository.bulkInsert(unique);
}
