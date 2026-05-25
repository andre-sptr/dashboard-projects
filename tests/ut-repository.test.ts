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

async function loadRepository() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);
  return import('../src/repositories/UtRepository');
}

describe('UtRepository CRUD Operations', () => {
  it('successfully performs CRUD on UT table', async () => {
    const { UtRepository } = await loadRepository();

    const mockUt = {
      id: 'ut-1',
      nama_lop: 'LOP UT Test',
      id_ihld: 'IHLD-UT-1',
      witel: 'WITEL-A',
      tematik: 'TEMATIK-A',
      sto: 'STO-A',
      tim_ut: 'TEAM-A',
      commtest_ut: 'COMM-A',
      jumlah_odp: 10,
      jumlah_port: 80,
      tanggal_ct_ut: '2026-05-20',
      temuan: 'No findings',
      mitra: 'MITRA-A',
      jumlah_temuan: 0,
      wa_spang: 'SPANG-A',
      komitmen_penyelesaian: 'Done',
    };

    // 1. Test upsert (insert)
    UtRepository.upsert(mockUt);

    const all = UtRepository.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('ut-1');
    expect(all[0].nama_lop).toBe('LOP UT Test');

    // 2. Test findById
    const found = UtRepository.findById('ut-1');
    expect(found).toBeDefined();
    expect(found?.id_ihld).toBe('IHLD-UT-1');

    // 3. Test upsert (update)
    UtRepository.upsert({
      ...mockUt,
      nama_lop: 'LOP UT Test Updated',
      jumlah_temuan: 2,
      temuan: 'Minor issue',
    });

    const updated = UtRepository.findById('ut-1');
    expect(updated?.nama_lop).toBe('LOP UT Test Updated');
    expect(updated?.jumlah_temuan).toBe(2);

    // 4. Test delete
    UtRepository.delete('ut-1');
    expect(UtRepository.findById('ut-1')).toBeUndefined();
  });
});

describe('UtRepository BOQ & Transaction Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly retrieves UT along with mapped BOQ data in findAllWithBoq', async () => {
    const { UtRepository } = await loadRepository();

    // Seed two UT records
    state.db.prepare(`
      INSERT INTO ut (id, nama_lop, id_ihld)
      VALUES 
        ('ut-1', 'LOP UT 1', 'IHLD-UT-1'),
        ('ut-2', 'LOP UT 2', 'IHLD-UT-2')
    `).run();

    // Seed one BOQ UT record for ut-1
    state.db.prepare(`
      INSERT INTO boq_ut (id, ut_id, nama_lop, id_ihld, full_data)
      VALUES ('boqut-1', 'ut-1', 'LOP UT 1', 'IHLD-UT-1', '[]')
    `).run();

    const list = UtRepository.findAllWithBoq();
    expect(list).toHaveLength(2);

    const ut1 = list.find(u => u.id === 'ut-1');
    expect(ut1?.boq_data).not.toBeNull();
    expect(ut1?.boq_data?.id).toBe('boqut-1');

    const ut2 = list.find(u => u.id === 'ut-2');
    expect(ut2?.boq_data).toBeNull();
  });

  it('handles basic upsert and delete for boq_ut table', async () => {
    const { UtRepository } = await loadRepository();

    // Seeding UT first due to FK or semantic matching
    state.db.prepare(`
      INSERT INTO ut (id, nama_lop, id_ihld)
      VALUES ('ut-1', 'LOP UT 1', 'IHLD-UT-1')
    `).run();

    UtRepository.upsertBoq({
      id: 'boqut-1',
      ut_id: 'ut-1',
      nama_lop: 'LOP UT 1',
      id_ihld: 'IHLD-UT-1',
      full_data: '[]',
    });

    const boq = UtRepository.getBoq('ut-1');
    expect(boq).toBeDefined();
    expect(boq?.id).toBe('boqut-1');

    UtRepository.deleteBoqByUtId('ut-1');
    expect(UtRepository.getBoq('ut-1')).toBeUndefined();
  });

  it('handles upsertBoqWithItems transaction safely', async () => {
    const { UtRepository } = await loadRepository();

    // Seed parent UT first
    state.db.prepare(`
      INSERT INTO ut (id, nama_lop, id_ihld)
      VALUES ('ut-parent', 'LOP UT Parent', 'IHLD-UT-PARENT')
    `).run();

    const items = [
      {
        no: 1,
        is_section: false,
        designator: 'UT-DSG-1',
        uraian_pekerjaan: 'Work 1',
        satuan: 'Core',
        harga_satuan_material: 100,
        harga_satuan_jasa: 50,
        volume: 10,
        total_material: 1000,
        total_jasa: 500,
        total: 1500,
        keterangan: '',
      }
    ];

    // 1. Initial insert
    const boqId = UtRepository.upsertBoqWithItems({
      ut_id: 'ut-parent',
      nama_lop: 'LOP UT Parent',
      id_ihld: 'IHLD-UT-PARENT'
    }, items);

    expect(boqId).toBeDefined();
    expect(boqId).toMatch(/^boqut_/);

    const boq = UtRepository.getBoq('ut-parent');
    expect(boq).toBeDefined();
    expect(JSON.parse(boq!.full_data)).toHaveLength(1);

    // Verify items in boq_ut_items
    const dbItems = state.db.prepare('SELECT * FROM boq_ut_items WHERE boq_ut_id = ?').all(boqId);
    expect(dbItems).toHaveLength(1);
    expect((dbItems[0] as any).designator).toBe('UT-DSG-1');

    // 2. Update with new items (should delete old ones first)
    const newItems = [
      {
        no: 1,
        is_section: false,
        designator: 'UT-DSG-2',
        uraian_pekerjaan: 'Work 2',
        satuan: 'Core',
        harga_satuan_material: 200,
        harga_satuan_jasa: 100,
        volume: 20,
        total_material: 4000,
        total_jasa: 2000,
        total: 6000,
        keterangan: 'newer desc',
      }
    ];

    const boqId2 = UtRepository.upsertBoqWithItems({
      ut_id: 'ut-parent',
      nama_lop: 'LOP UT Parent Updated',
      id_ihld: 'IHLD-UT-PARENT'
    }, newItems);

    expect(boqId2).toBe(boqId); // Must update the same BOQ ID because ut_id matches

    const dbItems2 = state.db.prepare('SELECT * FROM boq_ut_items WHERE boq_ut_id = ?').all(boqId);
    expect(dbItems2).toHaveLength(1);
    expect((dbItems2[0] as any).designator).toBe('UT-DSG-2'); // Verify it replaced UT-DSG-1
  });
});
