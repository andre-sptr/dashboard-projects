import { describe, expect, it } from 'vitest';
import type { Project } from '@/types/database';
import { buildPlanningChartData } from '@/lib/project-planning-stats';

function project(uid: string, fullData: unknown[]): Project {
  return {
    uid,
    project_type: 'NODEB',
    id_ihld: uid,
    batch_program: '',
    nama_lop: '',
    region: '',
    status: '',
    sub_status: '',
    full_data: JSON.stringify(fullData),
    last_changed_at: '2026-06-19T00:00:00.000Z',
    history: '[]',
    area: '',
    branch: '',
    mitra: '',
    sto: '',
    odp_planned: 999,
    port_planned: 999,
    port_realized: 999,
    golive_target: null,
    golive_actual: null,
  };
}

describe('buildPlanningChartData', () => {
  it('counts NodeB planning and OA as rows, not port-like numeric fields', () => {
    const march17 = 46098;
    const june20 = 46193;
    const june28 = 46201;

    const rowA: unknown[] = [];
    rowA[20] = 2550;
    rowA[30] = june20;
    rowA[36] = march17;

    const rowB: unknown[] = [];
    rowB[20] = 15600;
    rowB[30] = june28;
    rowB[36] = march17;

    const data = buildPlanningChartData([
      project('NODEB::A', rowA),
      project('NODEB::B', rowB),
    ], 'NODEB');

    expect(data).toEqual([
      { monthKey: '2026-03', name: 'Mar 2026', plannedRows: 2, actualRows: 0 },
      { monthKey: '2026-04', name: 'Apr 2026', plannedRows: 0, actualRows: 0 },
      { monthKey: '2026-05', name: 'Mei 2026', plannedRows: 0, actualRows: 0 },
      { monthKey: '2026-06', name: 'Jun 2026', plannedRows: 0, actualRows: 2 },
    ]);
  });
});
