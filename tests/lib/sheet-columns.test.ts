import { describe, it, expect } from 'vitest';
import { COL } from '@/lib/sheet-columns';

describe('sheet-columns COL mapping', () => {
  it('has correct values for critical columns', () => {
    expect(COL.TAHUN).toBe(0);
    expect(COL.ID_IHLD).toBe(1);
    expect(COL.AREA).toBe(4);
    expect(COL.BRANCH_FMC).toBe(7);
    expect(COL.PORT_PLAN).toBe(10);
    expect(COL.STATUS).toBe(14);
    expect(COL.SUB_STATUS_KONS).toBe(15);
    expect(COL.KET_BA_DROP).toBe(17);
    expect(COL.KOMITMEN_GOLIVE).toBe(18);
    expect(COL.TARGET_GOLIVE_APRIL).toBe(19);
    expect(COL.ID_SW_ABD).toBe(29);
    expect(COL.REAL_JML_PORT_GOLIVE).toBe(30);
    expect(COL.TANGGAL_GOLIVE).toBe(31);
  });

  it('has no duplicate index values', () => {
    const values = Object.values(COL);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('covers all 32 columns (0-31) without gaps', () => {
    const values = Object.values(COL).sort((a, b) => a - b);
    expect(values[0]).toBe(0);
    expect(values[values.length - 1]).toBe(31);
    expect(values.length).toBe(32);
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).toBe(i);
    }
  });
});
