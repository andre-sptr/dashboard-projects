import Database from 'better-sqlite3';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectType } from '@/types/database';
import { initializeSchema } from '../src/lib/schema';
import { getProjectColumnConfig } from '../src/lib/project-config';
import ColumnConfigClient from '../src/components/features/settings/ColumnConfigClient';
import DashboardEmptyState from '../src/components/features/dashboard/DashboardEmptyState';

const state = vi.hoisted(() => ({
  db: null as unknown as Database.Database,
}));

vi.mock('../src/lib/db', () => ({
  get db() {
    return state.db;
  },
}));

vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));

async function loadRepositories() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);

  const [
    { ColumnConfigRepository },
    { ProjectRepository },
    { AanwijzingRepository },
    { UtRepository },
  ] = await Promise.all([
    import('../src/repositories/ColumnConfigRepository'),
    import('../src/repositories/ProjectRepository'),
    import('../src/repositories/AanwijzingRepository'),
    import('../src/repositories/UtRepository'),
  ]);

  return { ColumnConfigRepository, ProjectRepository, AanwijzingRepository, UtRepository };
}

function seedProject(projectType: ProjectType, uid: string, idIhld: string, name: string) {
  state.db.prepare(`
    INSERT INTO projects (
      uid, project_type, id_ihld, batch_program, nama_lop, region,
      status, sub_status, full_data, history, area, branch, mitra, sto,
      odp_planned, port_planned, port_realized
    ) VALUES (?, ?, ?, '', ?, 'SUMBAGTENG', '1. PROGRESS', '', '[]', '[]', '', '', '', '', 0, 0, 0)
  `).run(uid, projectType, idIhld, name);
}

describe('multi-project column config', () => {
  it('seeds and updates column mappings independently per project type', async () => {
    const { ColumnConfigRepository } = await loadRepositories();

    expect(ColumnConfigRepository.getMap('JPP').ID_IHLD).toBe(1);
    expect(ColumnConfigRepository.getMap('NODEB').ID_IHLD).toBe(4);
    expect(ColumnConfigRepository.getMap('HEM').ID_IHLD).toBe(3);

    ColumnConfigRepository.updateMany('NODEB', [
      { field_key: 'ID_IHLD', col_index: 99, header_text: 'SITE ID CUSTOM' },
    ]);

    expect(ColumnConfigRepository.getMap('NODEB').ID_IHLD).toBe(99);
    expect(ColumnConfigRepository.getAll('NODEB').find((row) => row.field_key === 'ID_IHLD')).toMatchObject({
      header_text: 'SITE ID CUSTOM',
    });
    expect(ColumnConfigRepository.getMap('JPP').ID_IHLD).toBe(1);

    ColumnConfigRepository.resetDefaults('NODEB');
    expect(ColumnConfigRepository.getMap('NODEB').ID_IHLD).toBe(4);
  });
});

describe('multi-project operational repository scoping', () => {
  it('filters project select options by project type', async () => {
    const { ProjectRepository } = await loadRepositories();

    seedProject('JPP', 'JPP-1::BATCH', 'JPP-1', 'JPP Project');
    seedProject('NODEB', 'NODEB::NB-1', 'NB-1', 'NodeB Project');
    seedProject('HEM', 'HEM::HEM-1', 'HEM-1', 'HEM Project');

    expect(ProjectRepository.getForSelect('NODEB')).toEqual([
      { nama_lop: 'NodeB Project', id_ihld: 'NB-1', area: '', sto: '' },
    ]);
    expect(ProjectRepository.getForSelect('HEM')).toEqual([
      { nama_lop: 'HEM Project', id_ihld: 'HEM-1', area: '', sto: '' },
    ]);
  });

  it('filters AANWIJZING rows and attached BoQ by project type', async () => {
    const { AanwijzingRepository } = await loadRepositories();

    state.db.prepare(`
      INSERT INTO aanwijzing (id, project_type, nama_lop, id_ihld, tanggal_aanwijzing)
      VALUES
        ('AAN-JPP', 'JPP', 'JPP AAN', 'JPP-1', '2026-06-01'),
        ('AAN-NODEB', 'NODEB', 'NodeB AAN', 'NB-1', '2026-06-02')
    `).run();
    state.db.prepare(`
      INSERT INTO boq_aanwijzing (id, aanwijzing_id, nama_lop, id_ihld, full_data)
      VALUES ('BOQA-NODEB', 'AAN-NODEB', 'NodeB AAN', 'NB-1', '[]')
    `).run();

    const nodebRows = AanwijzingRepository.findAllWithBoq('NODEB');

    expect(nodebRows).toHaveLength(1);
    expect(nodebRows[0]).toMatchObject({ id: 'AAN-NODEB', project_type: 'NODEB' });
    expect(nodebRows[0].boq_data?.id).toBe('BOQA-NODEB');
  });

  it('filters UT rows and attached BoQ by project type', async () => {
    const { UtRepository } = await loadRepositories();

    state.db.prepare(`
      INSERT INTO ut (id, project_type, nama_lop, id_ihld)
      VALUES
        ('UT-JPP', 'JPP', 'JPP UT', 'JPP-1'),
        ('UT-HEM', 'HEM', 'HEM UT', 'HEM-1')
    `).run();
    state.db.prepare(`
      INSERT INTO boq_ut (id, ut_id, nama_lop, id_ihld, full_data)
      VALUES ('BOQUT-HEM', 'UT-HEM', 'HEM UT', 'HEM-1', '[]')
    `).run();

    const hemRows = UtRepository.findAllWithBoq('HEM');

    expect(hemRows).toHaveLength(1);
    expect(hemRows[0]).toMatchObject({ id: 'UT-HEM', project_type: 'HEM' });
    expect(hemRows[0].boq_data?.id).toBe('BOQUT-HEM');
  });
});

describe('multi-project settings UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the selected project type when detecting headers and saving column config', async () => {
    const initialConfigs = {
      JPP: getProjectColumnConfig('JPP'),
      NODEB: getProjectColumnConfig('NODEB'),
      HEM: getProjectColumnConfig('HEM'),
    };

    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            detected: initialConfigs.NODEB.map((row) => ({
              field_key: row.field_key,
              detected_index: row.col_index,
              matched_header: row.header_text,
            })),
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          message: 'Konfigurasi kolom NodeB disimpan.',
          data: { config: initialConfigs.NODEB },
        }),
      } as Response);

    render(
      <ColumnConfigClient
        initialConfigs={initialConfigs}
        initialProjectType="JPP"
        projectOptions={[
          { type: 'JPP', label: 'JPP' },
          { type: 'NODEB', label: 'NodeB' },
          { type: 'HEM', label: 'HEM' },
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText(/project/i), { target: { value: 'NODEB' } });
    fireEvent.click(screen.getByRole('button', { name: /detect/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/column-config/headers?projectType=NODEB');
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const [, options] = fetchMock.mock.calls[1];
      expect(fetchMock.mock.calls[1][0]).toBe('/api/column-config');
      expect(JSON.parse(String((options as RequestInit).body))).toMatchObject({
        projectType: 'NODEB',
      });
    });
  });
});

describe('dashboard empty state', () => {
  it('renders an empty dashboard landing state without the KPI report recap', () => {
    render(<DashboardEmptyState />);

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/pilih menu project/i)).toBeInTheDocument();
    expect(screen.queryByText(/total port plan/i)).not.toBeInTheDocument();
  });
});
