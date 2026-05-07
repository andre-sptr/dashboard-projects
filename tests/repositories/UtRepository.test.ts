// Unit tests for User Test (UT) documentation repository
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UtRepository, BoqUt } from '@/repositories/UtRepository';
import { db } from '@/lib/db';

// Mock the database to use an in-memory instance for tests
vi.mock('@/lib/db', async () => {
  const Database = (await import('better-sqlite3')).default;
  const { runMigrations } = await import('@/lib/migrations');
  const mockDb = new Database(':memory:');
  runMigrations(mockDb);
  return {
    db: mockDb,
  };
});

describe('UtRepository', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM ut').run();
    db.prepare('DELETE FROM boq_ut').run();
  });

  const sampleUt = {
    id: 'UT001',
    nama_lop: 'Project Y',
    id_ihld: 'P002',
    witel: 'Witel X',
    tematik: 'Fiber',
    sto: 'STO-01',
    tim_ut: 'Team A',
    commtest_ut: 'PASS',
    jumlah_odp: 10,
    jumlah_port: 80,
    tanggal_ct_ut: '2024-05-06',
    temuan: 'None',
    follow_up_mitra: 0,
    mitra: 'Mitra A',
    jumlah_temuan: 0,
    wa_spang: 'SPG-02',
    komitmen_penyelesaian: 'N/A'
  };

  it('should upsert and find UT', () => {
    UtRepository.upsert(sampleUt);
    const found = UtRepository.findById('UT001');
    expect(found).toBeDefined();
    expect(found?.nama_lop).toBe('Project Y');
  });

  it('should delete UT', () => {
    UtRepository.upsert(sampleUt);
    UtRepository.delete('UT001');
    const found = UtRepository.findById('UT001');
    expect(found).toBeUndefined();
  });

  it('should manage BoQ for UT', () => {
    UtRepository.upsertBoq({
      id: 'BOQUT001',
      ut_id: 'UT001',
      nama_lop: 'Project Y',
      id_ihld: 'P002',
      full_data: '[]'
    });

    const boq = UtRepository.getBoq('UT001') as BoqUt;
    expect(boq).toBeDefined();
    expect(boq?.id).toBe('BOQUT001');

    UtRepository.deleteBoqByUtId('UT001');
    const deletedBoq = UtRepository.getBoq('UT001');
    expect(deletedBoq).toBeUndefined();
  });
});
