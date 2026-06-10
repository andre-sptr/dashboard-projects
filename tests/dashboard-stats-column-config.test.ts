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

  it('groups golive timeline by actual date with commitment fallback and an uncommitted stack', () => {
    const colMap: ColumnMap = {
      ...DEFAULT_COLUMN_MAP,
      STATUS: 2,
      PORT_PLAN: 3,
      REAL_JML_PORT_GOLIVE: 4,
      BRANCH_FMC: 5,
      TANGGAL_GOLIVE: 6,
      KOMITMEN_GOLIVE: 7,
    };

    const makeProject = (
      uid: string,
      ports: number,
      actual: string | null,
      target: string | null
    ): Project => {
      const fullData: unknown[] = [];
      fullData[2] = actual ? '7. GOLIVE' : '5. INSTALASI';
      fullData[3] = String(ports);
      fullData[4] = actual ? String(ports - 1) : '0';
      fullData[5] = 'CONFIG-BRANCH';
      fullData[6] = actual;
      fullData[7] = target;

      return {
        ...staleProject,
        uid,
        id_ihld: uid,
        status: String(fullData[2]),
        full_data: JSON.stringify(fullData),
        port_planned: ports,
        port_realized: actual ? ports - 1 : 0,
        golive_actual: actual,
        golive_target: target,
      };
    };

    const stats = buildDashboardStats(
      [
        makeProject('ON-TIME-CROSS-MONTH', 10, '31/01/2026', '10/02/2026'),
        makeProject('UNCOMMITTED', 12, '29/01/2026', null),
        makeProject('PENDING', 20, null, '12/06/2026'),
        makeProject('PENDING-ZERO', 5, '0', '13/06/2026'),
        makeProject('MISSING-COMMITMENT', 7, null, null),
        makeProject('LATE-ACTUAL-CROSS-MONTH', 30, '15/03/2026', '11/02/2026'),
        makeProject('LATE-OVERDUE', 40, null, '09/06/2026'),
        makeProject('NEXT-MONTH-PENDING', 50, null, '01/07/2026'),
      ],
      colMap,
      { today: new Date(2026, 5, 10) }
    );

    expect(stats.totalGolivePorts).toBe(167);
    expect(stats.goliveMonthList.map((month) => month.monthKey)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
    ]);

    expect(stats.goliveMonthList.find((month) => month.monthKey === '2026-01')).toMatchObject({
      onTimePorts: 10,
      pendingPorts: 0,
      uncommittedPorts: 12,
      latePorts: 0,
      totalPorts: 22,
      days: expect.arrayContaining([
        expect.objectContaining({ name: '29', uncommittedPorts: 12, totalPorts: 12 }),
        expect.objectContaining({ name: '31', onTimePorts: 10, totalPorts: 10 }),
      ]),
    });
    expect(stats.goliveMonthList.find((month) => month.monthKey === '2026-02')).toMatchObject({
      totalPorts: 0,
    });
    expect(stats.goliveMonthList.find((month) => month.monthKey === '2026-03')).toMatchObject({
      latePorts: 30,
      totalPorts: 30,
      days: expect.arrayContaining([
        expect.objectContaining({ name: '15', latePorts: 30, totalPorts: 30 }),
      ]),
    });
    expect(stats.goliveMonthList.find((month) => month.monthKey === '2026-06')).toMatchObject({
      pendingPorts: 25,
      uncommittedPorts: 0,
      latePorts: 40,
      totalPorts: 65,
      days: expect.arrayContaining([
        expect.objectContaining({ name: '9', latePorts: 40, totalPorts: 40 }),
        expect.objectContaining({ name: '12', pendingPorts: 20, totalPorts: 20 }),
        expect.objectContaining({ name: '13', pendingPorts: 5, totalPorts: 5 }),
      ]),
    });
    expect(stats.goliveMonthList.find((month) => month.monthKey === '2026-07')).toMatchObject({
      pendingPorts: 50,
      totalPorts: 50,
      days: expect.arrayContaining([
        expect.objectContaining({ name: '1', pendingPorts: 50, totalPorts: 50 }),
      ]),
    });
  });
});
