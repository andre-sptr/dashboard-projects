// Unit tests for Project tracking repository
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectRepository } from '@/repositories/ProjectRepository';
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

describe('ProjectRepository', () => {
  beforeEach(() => {
    // Clear the projects table before each test
    db.prepare('DELETE FROM projects').run();
  });

  it('should upsert a project correctly', () => {
    const projectData = {
      uid: 'PROJ001::BATCH1',
      id_ihld: 'PROJ001',
      batch_program: 'BATCH1',
      nama_lop: 'Test Project',
      region: 'SUMBAGTENG',
      status: 'In Progress',
      sub_status: 'Planning',
      full_data: '[]',
      history: '[]'
    };

    ProjectRepository.upsert(projectData);

    const project = ProjectRepository.findByUid('PROJ001::BATCH1');
    expect(project).toBeDefined();
    expect(project?.nama_lop).toBe('Test Project');
    expect(project?.id_ihld).toBe('PROJ001');
  });

  it('should find projects by region', () => {
    ProjectRepository.upsert({
      uid: 'P1', id_ihld: 'P1', batch_program: 'B1', nama_lop: 'N1',
      region: 'REGION1', status: 'S1', sub_status: 'SS1', full_data: '[]', history: '[]'
    });
    ProjectRepository.upsert({
      uid: 'P2', id_ihld: 'P2', batch_program: 'B1', nama_lop: 'N2',
      region: 'REGION2', status: 'S2', sub_status: 'SS2', full_data: '[]', history: '[]'
    });

    const region1Projects = ProjectRepository.findAllByRegion('REGION1');
    expect(region1Projects).toHaveLength(1);
    expect(region1Projects[0].uid).toBe('P1');
  });

  it('should update an existing project on conflict', () => {
    const baseData = {
      uid: 'P1', id_ihld: 'P1', batch_program: 'B1', nama_lop: 'N1',
      region: 'R1', status: 'OLD', sub_status: 'SS1', full_data: '[]', history: '[]'
    };
    
    ProjectRepository.upsert(baseData);
    
    ProjectRepository.upsert({
      ...baseData,
      status: 'NEW'
    });

    const project = ProjectRepository.findByUid('P1');
    expect(project?.status).toBe('NEW');
  });

  it('should return project info for select', () => {
    ProjectRepository.upsert({
      uid: 'P1', id_ihld: 'P1', batch_program: 'B1', nama_lop: 'Z Project',
      region: 'R1', status: 'S1', sub_status: 'SS1', full_data: '[]', history: '[]'
    });
    ProjectRepository.upsert({
      uid: 'P2', id_ihld: 'P2', batch_program: 'B1', nama_lop: 'A Project',
      region: 'R1', status: 'S1', sub_status: 'SS1', full_data: '[]', history: '[]'
    });

    const selectData = ProjectRepository.getForSelect();
    expect(selectData).toHaveLength(2);
    expect(selectData[0].nama_lop).toBe('A Project'); // Ordered by name
  });
});
