import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

async function setupDb() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);
}

describe('TopologyLocationRepository', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('updates existing topology map locations without duplicating rows', async () => {
    const { TopologyLocationRepository } = await import('../src/repositories/TopologyLocationRepository');

    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-AMK-FQ',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.9471,
      longitude: 100.4172,
      source: 'manual',
      confidence: 'verified',
      notes: 'Verified from field data',
    });

    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-AMK-FQ',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.9482,
      longitude: 100.4183,
      source: 'field-survey',
      confidence: 'estimated',
      notes: 'Adjusted after survey',
    });

    const rows = TopologyLocationRepository.findAll();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      entity_type: 'odc',
      entity_name: 'ODC-AMK-FQ',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.9482,
      longitude: 100.4183,
      source: 'field-survey',
      confidence: 'estimated',
      notes: 'Adjusted after survey',
    });
  });

  it('returns locations ordered by entity type, area, sto, and entity name', async () => {
    const { TopologyLocationRepository } = await import('../src/repositories/TopologyLocationRepository');

    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-B',
      area: 'BTM',
      sto: 'BTM-02',
      latitude: -0.9,
      longitude: 100.4,
    });
    TopologyLocationRepository.upsert({
      entity_type: 'area',
      entity_name: 'AREA-Z',
      area: 'ZZZ',
      sto: '',
      latitude: -0.3,
      longitude: 100.1,
    });
    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-A',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.7,
      longitude: 100.2,
    });
    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-C',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.8,
      longitude: 100.3,
    });
    TopologyLocationRepository.upsert({
      entity_type: 'olt',
      entity_name: 'OLT-A',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.6,
      longitude: 100.5,
    });

    expect(
      TopologyLocationRepository.findAll().map(({ entity_type, area, sto, entity_name }) => ({
        entity_type,
        area,
        sto,
        entity_name,
      }))
    ).toEqual([
      { entity_type: 'area', area: 'ZZZ', sto: '', entity_name: 'AREA-Z' },
      { entity_type: 'odc', area: 'AMK', sto: 'AMK-01', entity_name: 'ODC-A' },
      { entity_type: 'odc', area: 'AMK', sto: 'AMK-01', entity_name: 'ODC-C' },
      { entity_type: 'odc', area: 'BTM', sto: 'BTM-02', entity_name: 'ODC-B' },
      { entity_type: 'olt', area: 'AMK', sto: 'AMK-01', entity_name: 'OLT-A' },
    ]);
  });

  it('uses repository defaults when optional fields are omitted', async () => {
    const { TopologyLocationRepository } = await import('../src/repositories/TopologyLocationRepository');

    TopologyLocationRepository.upsert({
      entity_type: 'core',
      entity_name: 'CORE-SITE',
      latitude: -0.5,
      longitude: 100.6,
    });

    expect(TopologyLocationRepository.findAll()[0]).toMatchObject({
      entity_type: 'core',
      entity_name: 'CORE-SITE',
      area: '',
      sto: '',
      latitude: -0.5,
      longitude: 100.6,
      source: 'manual',
      confidence: 'verified',
      notes: '',
    });
  });

  it('creates topology location row columns as non-null where the row type requires strings', () => {
    const tableInfo = state.db.pragma('table_info(topology_locations)') as {
      name: string;
      notnull: 0 | 1;
    }[];
    const columnsByName = new Map(tableInfo.map((column) => [column.name, column]));
    const nonNullColumns = [
      'entity_type',
      'entity_name',
      'area',
      'sto',
      'latitude',
      'longitude',
      'source',
      'confidence',
      'notes',
      'created_at',
      'updated_at',
    ];

    expect(
      nonNullColumns.map((name) => ({
        name,
        notnull: columnsByName.get(name)?.notnull,
      }))
    ).toEqual(nonNullColumns.map((name) => ({ name, notnull: 1 })));
  });
});
