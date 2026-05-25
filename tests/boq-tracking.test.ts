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

async function loadRepository() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);
  return import('../src/repositories/BoqRepository');
}

function seedAanwijzingBoq(project: {
  boqId: string;
  aanwijzingId: string;
  idIhld: string;
  name: string;
}) {
  state.db.prepare(`
    INSERT INTO boq_aanwijzing (id, aanwijzing_id, nama_lop, id_ihld)
    VALUES (?, ?, ?, ?)
  `).run(project.boqId, project.aanwijzingId, project.name, project.idIhld);
}

function seedUtBoq(project: {
  boqUtId: string;
  utId: string;
  idIhld: string;
  name: string;
}) {
  state.db.prepare(`
    INSERT INTO boq_ut (id, ut_id, nama_lop, id_ihld)
    VALUES (?, ?, ?, ?)
  `).run(project.boqUtId, project.utId, project.name, project.idIhld);
}

function insertAanwijzingItem(item: {
  id: string;
  boqAanwijzingId: string;
  idIhld: string;
  no: number;
  designator: string;
  volume: number;
  total: number;
  isSection?: boolean;
}) {
  state.db.prepare(`
    INSERT INTO boq_aanwijzing_items (
      id, boq_aanwijzing_id, nama_lop, id_ihld, no, is_section,
      designator, volume, total
    ) VALUES (?, ?, 'LOP', ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.boqAanwijzingId,
    item.idIhld,
    item.no,
    item.isSection ? 1 : 0,
    item.designator,
    item.volume,
    item.total
  );
}

function insertUtItem(item: {
  id: string;
  boqUtId: string;
  idIhld: string;
  no: number;
  designator: string;
  volume: number;
  total: number;
  isSection?: boolean;
}) {
  state.db.prepare(`
    INSERT INTO boq_ut_items (
      id, boq_ut_id, nama_lop, id_ihld, no, is_section,
      designator, volume, total
    ) VALUES (?, ?, 'LOP', ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.boqUtId,
    item.idIhld,
    item.no,
    item.isSection ? 1 : 0,
    item.designator,
    item.volume,
    item.total
  );
}

describe('BoqRepository tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates global aanwijzing, UT, remaining volume, and cost by designator', async () => {
    const { BoqRepository } = await loadRepository();

    seedAanwijzingBoq({ boqId: 'boqa-a', aanwijzingId: 'aanwijzing-a', idIhld: 'IHLD-A', name: 'Project A' });
    seedAanwijzingBoq({ boqId: 'boqa-b', aanwijzingId: 'aanwijzing-b', idIhld: 'IHLD-B', name: 'Project B' });
    seedUtBoq({ boqUtId: 'ut-a', utId: 'ut-a-parent', idIhld: 'IHLD-A', name: 'Project A' });
    seedUtBoq({ boqUtId: 'ut-b', utId: 'ut-b-parent', idIhld: 'IHLD-B', name: 'Project B' });

    insertAanwijzingItem({
      id: 'aanwijzing-section',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 0,
      designator: 'MATERIAL',
      volume: 0,
      total: 0,
      isSection: true,
    });
    insertAanwijzingItem({
      id: 'aanwijzing-cable-a',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 1,
      designator: 'CABLE-FO',
      volume: 100,
      total: 1000,
    });
    insertAanwijzingItem({
      id: 'aanwijzing-odp-a',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 2,
      designator: 'ODP',
      volume: 10,
      total: 500,
    });
    insertAanwijzingItem({
      id: 'aanwijzing-cable-b',
      boqAanwijzingId: 'boqa-b',
      idIhld: 'IHLD-B',
      no: 1,
      designator: 'CABLE-FO',
      volume: 20,
      total: 200,
    });
    insertUtItem({
      id: 'ut-cable-a',
      boqUtId: 'ut-a',
      idIhld: 'IHLD-A',
      no: 1,
      designator: 'CABLE-FO',
      volume: 70,
      total: 700,
    });
    insertUtItem({
      id: 'ut-cable-b',
      boqUtId: 'ut-b',
      idIhld: 'IHLD-B',
      no: 1,
      designator: 'CABLE-FO',
      volume: 25,
      total: 250,
    });
    insertUtItem({
      id: 'ut-odp-b',
      boqUtId: 'ut-b',
      idIhld: 'IHLD-B',
      no: 2,
      designator: 'ODP',
      volume: 2,
      total: 100,
    });

    const tracking = BoqRepository.getTrackingGlobal();

    expect(tracking).toEqual([
      {
        designator: 'CABLE-FO',
        jumlah_project: 2,
        aanwijzing_vol: 120,
        aanwijzing_cost: 1200,
        ut_vol: 95,
        ut_cost: 950,
        remaining_vol: 25,
        remaining_cost: 250,
      },
      {
        designator: 'ODP',
        jumlah_project: 2,
        aanwijzing_vol: 10,
        aanwijzing_cost: 500,
        ut_vol: 2,
        ut_cost: 100,
        remaining_vol: 8,
        remaining_cost: 400,
      },
    ]);
  });

  it('aggregates project tracking without duplicating rows and includes UT-only designators', async () => {
    const { BoqRepository } = await loadRepository();

    seedAanwijzingBoq({ boqId: 'boqa-a', aanwijzingId: 'aanwijzing-a', idIhld: 'IHLD-A', name: 'Project A' });
    seedUtBoq({ boqUtId: 'ut-a', utId: 'ut-a-parent', idIhld: 'IHLD-A', name: 'Project A' });

    insertAanwijzingItem({
      id: 'aanwijzing-cable-a1',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 1,
      designator: 'CABLE-FO',
      volume: 60,
      total: 600,
    });
    insertAanwijzingItem({
      id: 'aanwijzing-cable-a2',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 2,
      designator: 'CABLE-FO',
      volume: 40,
      total: 400,
    });
    insertAanwijzingItem({
      id: 'aanwijzing-odp-a',
      boqAanwijzingId: 'boqa-a',
      idIhld: 'IHLD-A',
      no: 3,
      designator: 'ODP',
      volume: 10,
      total: 500,
    });
    insertUtItem({
      id: 'ut-cable-a1',
      boqUtId: 'ut-a',
      idIhld: 'IHLD-A',
      no: 1,
      designator: 'CABLE-FO',
      volume: 35,
      total: 350,
    });
    insertUtItem({
      id: 'ut-cable-a2',
      boqUtId: 'ut-a',
      idIhld: 'IHLD-A',
      no: 2,
      designator: 'CABLE-FO',
      volume: 35,
      total: 350,
    });
    insertUtItem({
      id: 'ut-splitter-a',
      boqUtId: 'ut-a',
      idIhld: 'IHLD-A',
      no: 99,
      designator: 'SPLITTER',
      volume: 5,
      total: 50,
    });

    const tracking = BoqRepository.getTrackingByProject('IHLD-A');

    expect(tracking).toEqual([
      {
        designator: 'CABLE-FO',
        aanwijzing_vol: 100,
        aanwijzing_cost: 1000,
        ut_vol: 70,
        ut_cost: 700,
        remaining_vol: 30,
        remaining_cost: 300,
      },
      {
        designator: 'ODP',
        aanwijzing_vol: 10,
        aanwijzing_cost: 500,
        ut_vol: 0,
        ut_cost: 0,
        remaining_vol: 10,
        remaining_cost: 500,
      },
      {
        designator: 'SPLITTER',
        aanwijzing_vol: 0,
        aanwijzing_cost: 0,
        ut_vol: 5,
        ut_cost: 50,
        remaining_vol: -5,
        remaining_cost: -50,
      },
    ]);
  });
});

describe('BoqRepository CRUD & Transactions', () => {
  it('successfully performs CRUD operations on boq table', async () => {
    const { BoqRepository } = await loadRepository();

    // 1. Test upsert (insert)
    BoqRepository.upsert({
      id: 'boq-1',
      nama_lop: 'LOP 1',
      id_ihld: 'IHLD-1',
      sto: 'STO-1',
      project_name: 'Project 1',
      full_data: '[]',
      project_uid: null,
    });

    const all = BoqRepository.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('boq-1');

    // 2. Test findById
    const found = BoqRepository.findById('boq-1');
    expect(found).toBeDefined();
    expect(found?.nama_lop).toBe('LOP 1');

    // 3. Test upsert (update on conflict)
    BoqRepository.upsert({
      id: 'boq-1',
      nama_lop: 'LOP 1 Updated',
      id_ihld: 'IHLD-1',
      sto: 'STO-1',
      project_name: 'Project 1',
      full_data: '[{"no": 1}]',
      project_uid: null,
    });

    const updated = BoqRepository.findById('boq-1');
    expect(updated?.nama_lop).toBe('LOP 1 Updated');
    expect(updated?.full_data).toBe('[{"no": 1}]');

    // 4. Test delete
    BoqRepository.delete('boq-1');
    expect(BoqRepository.findById('boq-1')).toBeUndefined();
  });

  it('handles transaction control in upsertWithItems', async () => {
    const { BoqRepository } = await loadRepository();

    // Pastikan table projects memiliki data proyek agar valid
    state.db.prepare(`
      INSERT INTO projects (uid, id_ihld, nama_lop, status, port_planned, port_realized, region, sub_status)
      VALUES ('proj-uid-1', 'IHLD-1', 'LOP Test Transaction', '1. AANWIJZING', 100, 80, 'SUMBAGTENG', '')
    `).run();

    const items = [
      {
        no: 1,
        is_section: false,
        designator: 'DSG-1',
        uraian_pekerjaan: 'Work 1',
        satuan: 'Pcs',
        harga_satuan_material: 100,
        harga_satuan_jasa: 50,
        volume: 2,
        total_material: 200,
        total_jasa: 100,
        total: 300,
        keterangan: '',
      }
    ];

    // 1. Initial insert
    const boqId = BoqRepository.upsertWithItems({
      nama_lop: 'LOP Test Transaction',
      id_ihld: 'IHLD-1',
      project_uid: 'proj-uid-1',
    }, items);

    expect(boqId).toBeDefined();
    expect(boqId).toMatch(/^boq_/);

    const boq = BoqRepository.findById(boqId);
    expect(boq).toBeDefined();
    expect(JSON.parse(boq!.full_data)).toHaveLength(1);

    // Verifikasi item di boq_plan_items
    const dbItems = state.db.prepare('SELECT * FROM boq_plan_items WHERE boq_plan_id = ?').all(boqId);
    expect(dbItems).toHaveLength(1);
    expect((dbItems[0] as any).designator).toBe('DSG-1');

    // 2. Update dengan item baru (seharusnya menghapus item lama terlebih dahulu)
    const newItems = [
      {
        no: 1,
        is_section: false,
        designator: 'DSG-2',
        uraian_pekerjaan: 'Work 2',
        satuan: 'Pcs',
        harga_satuan_material: 200,
        harga_satuan_jasa: 100,
        volume: 3,
        total_material: 600,
        total_jasa: 300,
        total: 900,
        keterangan: 'new desc',
      }
    ];

    const boqId2 = BoqRepository.upsertWithItems({
      nama_lop: 'LOP Test Transaction Updated',
      id_ihld: 'IHLD-1',
      project_uid: 'proj-uid-1',
    }, newItems);

    expect(boqId2).toBe(boqId); // Harus mengembalikan ID BOQ yang sama karena project_uid cocok

    const dbItems2 = state.db.prepare('SELECT * FROM boq_plan_items WHERE boq_plan_id = ?').all(boqId);
    expect(dbItems2).toHaveLength(1);
    expect((dbItems2[0] as any).designator).toBe('DSG-2'); // Verifikasi ia menggantikan DSG-1
  });

  it('aggregates FMC branch data in getSelisihAanwijzingSummary and handles division-by-zero safely', async () => {
    const { BoqRepository } = await loadRepository();

    // 1. Seed two FMC branches: RIAU and KEPRI
    // Satu proyek memiliki port_planned = 0 untuk menguji penanganan zero-division
    state.db.prepare(`
      INSERT INTO projects (uid, id_ihld, nama_lop, branch, port_planned, port_realized, golive_target, golive_actual, region, status, sub_status)
      VALUES 
        ('p-riau-1', 'IHLD-RIAU-1', 'LOP RIAU 1', 'RIAU', 100, 80, '2026-06-01', '', 'SUMBAGTENG', '1. AANWIJZING', ''),
        ('p-riau-2', 'IHLD-RIAU-2', 'LOP RIAU 2 (ZERO PORT)', 'RIAU', 0, 0, '2026-06-15', '', 'SUMBAGTENG', '1. AANWIJZING', ''),
        ('p-kepri-1', 'IHLD-KEPRI-1', 'LOP KEPRI 1', 'KEPRI', 50, 40, '2026-07-01', '', 'SUMBAGTENG', '1. AANWIJZING', '')
    `).run();

    // Seed parent boq & boq_aanwijzing untuk memenuhi constraint foreign key
    state.db.prepare(`
      INSERT INTO boq (id, nama_lop, id_ihld, sto, project_name)
      VALUES 
        ('plan-riau-1', 'LOP RIAU 1', 'IHLD-RIAU-1', 'PKU', 'Project RIAU 1'),
        ('plan-kepri-1', 'LOP KEPRI 1', 'IHLD-KEPRI-1', 'TPI', 'Project KEPRI 1')
    `).run();

    state.db.prepare(`
      INSERT INTO boq_aanwijzing (id, aanwijzing_id, nama_lop, id_ihld)
      VALUES 
        ('aan-riau-1', 'aanwijzing-riau-1', 'LOP RIAU 1', 'IHLD-RIAU-1'),
        ('aan-kepri-1', 'aanwijzing-kepri-1', 'LOP KEPRI 1', 'IHLD-KEPRI-1')
    `).run();

    // Seed data plan & aanwijzing items
    state.db.prepare(`
      INSERT INTO boq_plan_items (id, boq_plan_id, id_ihld, total, is_section)
      VALUES 
        ('bpi-1', 'plan-riau-1', 'IHLD-RIAU-1', 10000000, 0),
        ('bpi-2', 'plan-kepri-1', 'IHLD-KEPRI-1', 5000000, 0)
    `).run();

    state.db.prepare(`
      INSERT INTO boq_aanwijzing_items (id, boq_aanwijzing_id, id_ihld, total, is_section)
      VALUES 
        ('bai-1', 'aan-riau-1', 'IHLD-RIAU-1', 12000000, 0),
        ('bai-2', 'aan-kepri-1', 'IHLD-KEPRI-1', 6500000, 0)
    `).run();

    // 2. Query all tanpa filter tanggal
    const summary = BoqRepository.getSelisihAanwijzingSummary();
    expect(summary).toHaveLength(2);

    // KEPRI branch check
    const kepri = summary.find(s => s.branch_fmc === 'KEPRI');
    expect(kepri).toBeDefined();
    expect(kepri?.port_plan).toBe(50);
    expect(kepri?.boq_plan).toBe(5000000);
    expect(kepri?.cpp_plan).toBe(100000); // 5,000,000 / 50
    expect(kepri?.port_aanwijzing).toBe(40);
    expect(kepri?.boq_aanwijzing).toBe(6500000);
    expect(kepri?.cpp_aanwijzing).toBe(162500); // 6,500,000 / 40
    expect(kepri?.kenaikan_boq).toBe(1500000); // 6,500,000 - 5,000,000
    expect(kepri?.persen_kenaikan).toBe(30); // (1,500,000 / 5,000,000) * 100

    // RIAU branch check (termasuk RIAU-2 yang memicu pembagian nol karena port=0)
    const riau = summary.find(s => s.branch_fmc === 'RIAU');
    expect(riau).toBeDefined();
    expect(riau?.port_plan).toBe(100); // 100 + 0
    expect(riau?.boq_plan).toBe(10000000);
    expect(riau?.port_aanwijzing).toBe(80);
    expect(riau?.boq_aanwijzing).toBe(12000000);
    expect(riau?.kenaikan_boq).toBe(2000000);
    expect(riau?.persen_kenaikan).toBe(20);

    // 3. Query dengan filter tanggal (Menyaring RIAU di bulan Juni 2026)
    const filteredSummary = BoqRepository.getSelisihAanwijzingSummary('2026-06-01', '2026-06-30');
    // Seharusnya mengecualikan KEPRI-1 yang tanggal live nya '2026-07-01'
    expect(filteredSummary).toHaveLength(1);
    expect(filteredSummary[0].branch_fmc).toBe('RIAU');
  });
});
