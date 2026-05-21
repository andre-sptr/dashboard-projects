import { describe, expect, it } from 'vitest';
import type { Project } from '../src/types/database';
import { buildDashboardStats, buildRiskyProjects } from '../src/lib/dashboard-stats';
import { DEFAULT_COLUMN_MAP, type ColumnMap } from '../src/lib/sheet-columns';

const staleProject: Project = {
  uid: 'IHLD-1::BATCH-1',
  id_ihld: 'IHLD-1',
  batch_program: 'BATCH-1',
  nama_lop: 'LOP Config Test',
  region: 'SUMBAGTENG',
  status: '1. AANWIJZING',
  sub_status: 'Stale Sub Status',
  full_data: '[]',
  last_changed_at: '2020-01-01T00:00:00Z',
  history: '[]',
  area: 'STALE-AREA',
  branch: 'STALE-BRANCH',
  mitra: 'STALE-MITRA',
  sto: 'STALE-STO',
  odp_planned: 0,
  port_planned: 99,
  port_realized: 0,
  golive_target: '01/01/2020',
  golive_actual: null,
};

describe('dashboard stats column configuration', () => {
  it('derives dashboard metrics from full_data using the runtime column map', () => {
    const fullData: unknown[] = [];
    fullData[2] = '7. GOLIVE';
    fullData[3] = '12';
    fullData[4] = '8';
    fullData[5] = 'CONFIG-BRANCH';
    fullData[6] = '15/01/2026';
    fullData[7] = '10/01/2026';

    const colMap: ColumnMap = {
      ...DEFAULT_COLUMN_MAP,
      STATUS: 2,
      PORT_PLAN: 3,
      REAL_JML_PORT_GOLIVE: 4,
      BRANCH_FMC: 5,
      TANGGAL_GOLIVE: 6,
      KOMITMEN_GOLIVE: 7,
    };

    const project = { ...staleProject, full_data: JSON.stringify(fullData) };
    const stats = buildDashboardStats([project], colMap);
    const risky = buildRiskyProjects([project], colMap);

    expect(stats.donePorts).toBe(12);
    expect(stats.progressPorts).toBe(0);
    expect(stats.statusList).toEqual([{ name: '7. GOLIVE', count: 12 }]);
    expect(stats.branchRankingData[0]).toMatchObject({
      name: 'CONFIG-BRANCH',
      planned: 12,
      actual: 8,
    });
    expect(risky).toEqual([]);
  });
});
