import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AanwijzingRepository } from '@/repositories/AanwijzingRepository';
import db from '@/lib/db';

// Mock the database to use an in-memory instance for tests
vi.mock('@/lib/db', async () => {
  const Database = (await import('better-sqlite3')).default;
  const { runMigrations } = await import('@/lib/migrations');
  const mockDb = new Database(':memory:');
  runMigrations(mockDb);
  return {
    default: mockDb,
  };
});

describe('AanwijzingRepository', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM aanwijzing').run();
    db.prepare('DELETE FROM boq_aanwijzing').run();
  });

  const sampleAanwijzing = {
    id: 'AAN001',
    nama_lop: 'Project X',
    id_ihld: 'P001',
    tematik: 'Fiber',
    tanggal_aanwijzing: '2024-05-05',
    catatan: 'Test note',
    status_after_aanwijzing: 'OK',
    gpon: 'OLT-01',
    frame: 1,
    slot_awal: 1,
    slot_akhir: 2,
    port_awal: 1,
    port_akhir: 16,
    wa_spang: 'SPG-01',
    ut: 'PENDING'
  };

  it('should upsert and find aanwijzing', () => {
    AanwijzingRepository.upsert(sampleAanwijzing);
    const found = AanwijzingRepository.findById('AAN001');
    expect(found).toBeDefined();
    expect(found?.nama_lop).toBe('Project X');
  });

  it('should delete aanwijzing', () => {
    AanwijzingRepository.upsert(sampleAanwijzing);
    AanwijzingRepository.delete('AAN001');
    const found = AanwijzingRepository.findById('AAN001');
    expect(found).toBeUndefined();
  });

  it('should manage BoQ for aanwijzing', () => {
    AanwijzingRepository.upsertBoq({
      id: 'BOQ001',
      aanwijzing_id: 'AAN001',
      nama_lop: 'Project X',
      id_ihld: 'P001',
      full_data: '[]'
    });

    const boq = AanwijzingRepository.getBoq('AAN001') as any;
    expect(boq).toBeDefined();
    expect(boq?.id).toBe('BOQ001');

    AanwijzingRepository.deleteBoqByAanwijzingId('AAN001');
    const deletedBoq = AanwijzingRepository.getBoq('AAN001');
    expect(deletedBoq).toBeUndefined();
  });
});
