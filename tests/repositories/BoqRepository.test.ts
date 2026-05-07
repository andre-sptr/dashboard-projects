// Unit tests for Bill of Quantity (BoQ) repository
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoqRepository } from '@/repositories/BoqRepository';
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

describe('BoqRepository', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM boq').run();
  });

  const sampleBoq = {
    id: 'BOQ001',
    nama_lop: 'Project Z',
    id_ihld: 'P003',
    sto: 'STO-02',
    batch_program: 'BATCH-01',
    project_name: 'Project Z Full',
    region: 'SUMBAGTENG',
    full_data: '[]'
  };

  it('should upsert and find BoQ', () => {
    BoqRepository.upsert(sampleBoq);
    const found = BoqRepository.findById('BOQ001');
    expect(found).toBeDefined();
    expect(found?.nama_lop).toBe('Project Z');
  });

  it('should delete BoQ', () => {
    BoqRepository.upsert(sampleBoq);
    BoqRepository.delete('BOQ001');
    const found = BoqRepository.findById('BOQ001');
    expect(found).toBeUndefined();
  });

  it('should return all BoQ records', () => {
    BoqRepository.upsert(sampleBoq);
    BoqRepository.upsert({ ...sampleBoq, id: 'BOQ002' });
    
    const all = BoqRepository.findAll();
    expect(all).toHaveLength(2);
  });
});
