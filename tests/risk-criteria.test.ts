import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { computeProjectRisk, getDaysSinceChanged } from '../src/lib/risk-criteria';
import type { Project } from '../src/types/database';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    uid: 'test-uid',
    id_ihld: 'TEST',
    batch_program: 'B1',
    nama_lop: 'Test LOP',
    region: 'SUMBAGTENG',
    status: '3. PERIZINAN',
    sub_status: '',
    full_data: '[]',
    last_changed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d+Z$/, ''),
    history: '[]',
    area: '',
    branch: 'SUMUT',
    mitra: '',
    sto: '',
    odp_planned: 0,
    port_planned: 100,
    port_realized: 80,
    golive_target: null,
    golive_actual: null,
    ...overrides,
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '');
}

function daysFromNow(n: number): string {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function daysAgoDate(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

describe('computeProjectRisk', () => {
  // Test 1: null/empty last_changed_at — must not throw; treat as not stuck
  it('handles empty last_changed_at without throwing', () => {
    const project = makeProject({ last_changed_at: '' });
    expect(() => computeProjectRisk(project)).not.toThrow();
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 2: last_changed_at < 14 days ago — NOT stuck (criterion is > 14, not >=)
  it('does not flag as stuck when last_changed_at is under 14 days ago', () => {
    const project = makeProject({ last_changed_at: daysAgo(13) });
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 3: stuck 15 days + in-progress status → PERHATIAN (1 criterion)
  it('flags PERHATIAN when stuck 15 days with progress status', () => {
    const project = makeProject({
      last_changed_at: daysAgo(15),
      status: '3. PERIZINAN',
    });
    expect(computeProjectRisk(project)).toBe('PERHATIAN');
  });

  // Test 4: stuck 15 days but status is done → AMAN (done excluded)
  it('returns AMAN when status is done even if last changed 15 days ago', () => {
    const project = makeProject({
      last_changed_at: daysAgo(15),
      status: '7. GOLIVE',
    });
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 5: golive_target null → not overdue
  it('handles null golive_target without flagging overdue', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      golive_target: null,
    });
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 6: golive_target as Excel serial — parseExcelDate must parse correctly
  it('parses Excel serial golive_target correctly', () => {
    // Excel serial 45000 ≈ 2023-03-15, which is in the past
    const project = makeProject({
      last_changed_at: daysAgo(5),
      status: '3. PERIZINAN',
      golive_target: '45000',
    });
    const result = computeProjectRisk(project);
    // Serial 45000 is in the past → overdue → at least PERHATIAN
    expect(['PERHATIAN', 'KRITIS']).toContain(result);
  });

  // Test 7: golive_target in future → not overdue
  it('does not flag overdue when golive_target is in the future', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      golive_target: daysFromNow(60),
    });
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 8: golive_target in past + progress status → PERHATIAN
  it('flags PERHATIAN when golive_target is past and project in progress', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      status: '5. INSTALASI',
      golive_target: daysAgoDate(10),
    });
    expect(computeProjectRisk(project)).toBe('PERHATIAN');
  });

  // Test 9: port_planned = 0 → low-realization criterion skipped (no divide-by-zero)
  it('skips low-realization criterion when port_planned is 0', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      port_planned: 0,
      port_realized: 0,
      golive_target: daysFromNow(10),
    });
    expect(() => computeProjectRisk(project)).not.toThrow();
    expect(computeProjectRisk(project)).toBe('AMAN');
  });

  // Test 10: port_realized / port_planned = 0.49 + golive < 30 days → criterion met
  it('flags low-realization when realization is 0.49 and golive within 30 days', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      status: '5. INSTALASI',
      port_planned: 100,
      port_realized: 49,
      golive_target: daysFromNow(20),
    });
    expect(computeProjectRisk(project)).toBe('PERHATIAN');
  });

  // Test 11: 2+ criteria met → KRITIS
  it('returns KRITIS when 2 or more criteria are met', () => {
    const project = makeProject({
      last_changed_at: daysAgo(20),   // stuck
      status: '3. PERIZINAN',
      golive_target: daysAgoDate(5),  // overdue
      port_planned: 100,
      port_realized: 10,
    });
    expect(computeProjectRisk(project)).toBe('KRITIS');
  });

  // Test 12: 0 criteria met → AMAN
  it('returns AMAN when no criteria are met', () => {
    const project = makeProject({
      last_changed_at: daysAgo(5),
      status: '5. INSTALASI',
      golive_target: daysFromNow(60),
      port_planned: 100,
      port_realized: 80,
    });
    expect(computeProjectRisk(project)).toBe('AMAN');
  });
});

describe('getDaysSinceChanged', () => {
  it('returns 0 for empty last_changed_at', () => {
    expect(getDaysSinceChanged(makeProject({ last_changed_at: '' }))).toBe(0);
  });

  it('returns approximate days since change', () => {
    const project = makeProject({ last_changed_at: daysAgo(10) });
    expect(getDaysSinceChanged(project)).toBe(10);
  });
});
