import { describe, expect, it } from 'vitest';
import { getProjectConfig } from '@/lib/project-config';

describe('project spreadsheet configs', () => {
  it('maps NodeB to the grounded Project MBB FO columns', () => {
    const config = getProjectConfig('NODEB');

    expect(config.gid).toBe('1703451476');
    expect(config.dataStartRow).toBe(2);
    expect(config.fieldMap.ID_IHLD).toBe(4);
    expect(config.fieldMap.BATCH_PROGRAM).toBe(20);
    expect(config.fieldMap.KOMITMEN_GOLIVE).toBe(36);
    expect(config.fieldMap.TANGGAL_GOLIVE).toBe(30);
    expect(config.dashboard.tematikColIndex).toBe(34);
    expect(config.dashboard.dateFilterColIndex).toBe(36);
    expect(config.dashboard.planningTargetColIndex).toBe(36);
    expect(config.dashboard.planningActualColIndex).toBe(30);
  });

  it('maps HEM to the grounded JT HEM columns', () => {
    const config = getProjectConfig('HEM');

    expect(config.gid).toBe('1708701845');
    expect(config.dataStartRow).toBe(2);
    expect(config.fieldMap.ID_IHLD).toBe(3);
    expect(config.fieldMap.NAMA_LOP).toBe(4);
    expect(config.fieldMap.BATCH_PROGRAM).toBe(9);
    expect(config.fieldMap.STATUS).toBe(18);
    expect(config.fieldMap.SUB_STATUS_KONS).toBe(19);
    expect(config.fieldMap.DETAIL_STATUS).toBe(21);
    expect(config.fieldMap.KOMITMEN_GOLIVE).toBe(22);
    expect(config.fieldMap.TANGGAL_GOLIVE).toBe(32);
    expect(config.dashboard.dateFilterColIndex).toBe(22);
  });
});
