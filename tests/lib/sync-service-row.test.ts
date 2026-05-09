import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COL } from '@/lib/sheet-columns';

// Minimal row factory: 32 empty cells, override specific columns
function makeRow(overrides: Record<number, unknown> = {}): unknown[] {
  const row = new Array(32).fill('');
  row[COL.REGION_FMC] = 'SUMBAGTENG';
  row[COL.ID_IHLD] = 'IHLD-001';
  row[COL.BATCH_PROGRAM] = 'BATCH1';
  row[COL.NAMA_LOP] = 'Test LOP';
  row[COL.STATUS] = '3. Survey';
  row[COL.SUB_STATUS_KONS] = 'On Progress';
  row[COL.AREA] = 'RIDAR';
  row[COL.BRANCH_FMC] = 'PEKANBARU';
  row[COL.PORT_PLAN] = 128;
  row[COL.REAL_JML_PORT_GOLIVE] = 0;
  for (const [idx, val] of Object.entries(overrides)) {
    row[Number(idx)] = val;
  }
  return row;
}

// Extract the per-row processing logic from SyncService for unit testing.
// We replicate the exact conditions from sync-service.ts without hitting DB or Sheets API.
function processRow(row: unknown[]): {
  skipped: boolean;
  reason?: string;
  data?: Record<string, unknown>;
} {
  if (row.length < 16) return { skipped: true, reason: 'too_short' };

  const region = (row[COL.REGION_FMC] ?? '').toString().trim();
  if (region !== 'SUMBAGTENG') return { skipped: true, reason: 'wrong_region' };

  const id_ihld = (row[COL.ID_IHLD] ?? '').toString().trim();
  if (!id_ihld) return { skipped: true, reason: 'no_id_ihld' };

  const str = (idx: number) => (row[idx] ?? '').toString().trim();
  const num = (idx: number) => { const n = Number(row[idx]); return isNaN(n) ? 0 : n; };

  return {
    skipped: false,
    data: {
      id_ihld,
      batch_program: str(COL.BATCH_PROGRAM),
      nama_lop: str(COL.NAMA_LOP),
      region,
      status: str(COL.STATUS),
      sub_status: str(COL.SUB_STATUS_KONS),
      area: str(COL.AREA),
      branch: str(COL.BRANCH_FMC),
      port_planned: num(COL.PORT_PLAN),
      port_realized: num(COL.REAL_JML_PORT_GOLIVE),
      golive_target: str(COL.TARGET_GOLIVE_APRIL),
      golive_actual: str(COL.TANGGAL_GOLIVE),
    },
  };
}

describe('sync-service row processing logic', () => {
  it('skips rows with fewer than 16 columns', () => {
    const result = processRow(new Array(10).fill(''));
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('too_short');
  });

  it('skips rows where REGION_FMC is not SUMBAGTENG', () => {
    const result = processRow(makeRow({ [COL.REGION_FMC]: 'SUMBAGTENBARAT' }));
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('wrong_region');
  });

  it('skips rows with empty id_ihld', () => {
    const result = processRow(makeRow({ [COL.ID_IHLD]: '' }));
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('no_id_ihld');
  });

  it('processes a valid row and extracts all expected fields', () => {
    const row = makeRow({
      [COL.PORT_PLAN]: 256,
      [COL.REAL_JML_PORT_GOLIVE]: 128,
      [COL.TANGGAL_GOLIVE]: '45300',
      [COL.TARGET_GOLIVE_APRIL]: '45200',
    });
    const result = processRow(row);

    expect(result.skipped).toBe(false);
    expect(result.data?.id_ihld).toBe('IHLD-001');
    expect(result.data?.area).toBe('RIDAR');
    expect(result.data?.branch).toBe('PEKANBARU');
    expect(result.data?.port_planned).toBe(256);
    expect(result.data?.port_realized).toBe(128);
    expect(result.data?.golive_actual).toBe('45300');
    expect(result.data?.golive_target).toBe('45200');
  });

  it('treats non-numeric port values as 0', () => {
    const result = processRow(makeRow({ [COL.REAL_JML_PORT_GOLIVE]: 'N/A' }));
    expect(result.data?.port_realized).toBe(0);
  });

  it('accepts row with exactly 16 columns (minimum)', () => {
    const row = new Array(16).fill('');
    row[COL.REGION_FMC] = 'SUMBAGTENG';
    row[COL.ID_IHLD] = 'IHLD-MIN';
    const result = processRow(row);
    expect(result.skipped).toBe(false);
    expect(result.data?.id_ihld).toBe('IHLD-MIN');
  });
});
