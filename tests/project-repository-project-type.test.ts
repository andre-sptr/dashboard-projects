import Database from 'better-sqlite3';
import { describe, expect, it, vi } from 'vitest';
import { initializeSchema } from '../src/lib/schema';

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

async function loadRepository() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);
  return import('../src/repositories/ProjectRepository');
}

const baseProject = {
  uid: 'JPP::1',
  project_type: 'JPP' as const,
  id_ihld: '1',
  batch_program: 'Batch 1',
  nama_lop: 'Project JPP',
  region: 'SUMBAGTENG',
  status: '7. GOLIVE',
  sub_status: 'GOLIVE',
  full_data: '[]',
  history: '[]',
  area: 'AREA',
  branch: 'BRANCH',
  mitra: 'MITRA',
  sto: 'STO',
  odp_planned: 0,
  port_planned: 0,
  port_realized: 0,
  golive_target: null,
  golive_actual: null,
  golive_target_violated: 0,
};

describe('ProjectRepository project_type separation', () => {
  it('stores project_type and keeps JPP region queries isolated', async () => {
    const { ProjectRepository } = await loadRepository();

    ProjectRepository.upsert(baseProject);
    ProjectRepository.upsert({
      ...baseProject,
      uid: 'NODEB::AGR030',
      project_type: 'NODEB',
      id_ihld: 'AGR030',
      batch_program: '2550',
      nama_lop: 'DUSUNRAJA2',
      region: 'SUMBAGTENG',
    });

    expect(ProjectRepository.findAllByProjectType('NODEB')).toMatchObject([
      { uid: 'NODEB::AGR030', project_type: 'NODEB' },
    ]);
    expect(ProjectRepository.findAllByRegion('SUMBAGTENG')).toMatchObject([
      { uid: 'JPP::1', project_type: 'JPP' },
    ]);
  });
});
