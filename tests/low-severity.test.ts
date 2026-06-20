import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeProjectRisk } from '../src/lib/risk-criteria';
import { SyncScheduler } from '../src/lib/sync-scheduler';
import { AlertScheduler } from '../src/lib/alert-scheduler';
import { downloadAndParseExcel } from '../src/lib/parse-excel';
import type { Project } from '@/types/database';

vi.mock('node-cron', () => ({
  schedule: vi.fn(() => ({ stop: vi.fn() })),
}));

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

describe('Low Severity Polishes & Config Dinamization', () => {
  describe('L1: parse-excel.ts Renaming', () => {
    it('should correctly import and expose downloadAndParseExcel from parse-excel.ts', () => {
      expect(downloadAndParseExcel).toBeDefined();
      expect(typeof downloadAndParseExcel).toBe('function');
    });
  });

  describe('L8: Dynamic Risk Criteria Thresholds', () => {
    beforeEach(() => {
      vi.stubEnv('RISK_THRESHOLD_STUCK_DAYS', '5');
      vi.stubEnv('RISK_THRESHOLD_NEAR_GOLIVE_DAYS', '10');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should respect dynamic stuck thresholds configured via environment variables', () => {
      const mockProject: Project = {
        uid: 'IHLD-TEST::Batch1',
        id_ihld: 'IHLD-TEST',
        batch_program: 'Batch1',
        nama_lop: 'Test project',
        region: 'SUMBAGTENG',
        status: '3. SURVEY',
        sub_status: '3.1 SURVEY SCHEDULED',
        full_data: '[]',
        history: '[]',
        area: 'PEKANBARU',
        branch: 'RIAU',
        mitra: 'Mitra A',
        sto: 'PKU',
        odp_planned: 10,
        port_planned: 80,
        port_realized: 0,
        golive_target: daysFromNow(60), // Far enough ahead to avoid the near-golive criterion.
        golive_actual: '',
        golive_target_violated: 0,
        // Set last status change 8 days ago (more than 5 stuck days, but less than default 14)
        last_changed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: '',
        updated_at: '',
      };

      // Since last_changed_at is 8 days ago, under default STUCK_DAYS (14) it would not trigger stuck count.
      // But because we stubbed RISK_THRESHOLD_STUCK_DAYS = 5, it triggers stuck count!
      // This results in risk 'PERHATIAN' (1 criterion met: stuck)
      const risk = computeProjectRisk(mockProject);
      expect(risk).toBe('PERHATIAN');
    });
  });

  describe('L9: Dynamic Scheduler Cron Expressions', () => {
    it('should expose SyncScheduler and AlertScheduler methods', () => {
      expect(SyncScheduler.start).toBeDefined();
      expect(AlertScheduler.start).toBeDefined();
    });
  });
});
