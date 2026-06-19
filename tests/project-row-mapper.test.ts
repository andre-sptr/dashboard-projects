import { describe, expect, it } from 'vitest';
import { getProjectConfig } from '@/lib/project-config';
import { mapSheetRowToProjectData, shouldIncludeSourceRow } from '@/lib/project-row-mapper';

describe('project row mapper', () => {
  it('maps NodeB rows using SITE ID as uid and KABEL FO DRM as batch', () => {
    const row: unknown[] = [];
    row[1] = 'SBS';
    row[2] = 'Bengkulu';
    row[3] = 'MUA';
    row[4] = 'AGR030';
    row[5] = 'DUSUNRAJA2';
    row[13] = 'TELKOM AKSES';
    row[20] = 2550;
    row[26] = '6. On Air';
    row[27] = '6.1 OA';
    row[28] = '(05/Jun) QC Passed';
    row[30] = 46193;
    row[36] = 46098;

    const data = mapSheetRowToProjectData(row, getProjectConfig('NODEB'));

    expect(data).toMatchObject({
      uid: 'NODEB::AGR030',
      project_type: 'NODEB',
      id_ihld: 'AGR030',
      batch_program: '2550',
      nama_lop: 'DUSUNRAJA2',
      region: 'SBS',
      area: 'Bengkulu',
      branch: 'Bengkulu',
      sto: 'MUA',
      status: '6. On Air',
      sub_status: '6.1 OA',
      golive_target: '46098',
      golive_actual: '46193',
      port_planned: 0,
      port_realized: 0,
    });
  });

  it('maps HEM rows using IHLD as uid and Detail Progres from column V', () => {
    const row: unknown[] = [];
    row[0] = 'SUMBAGTENG';
    row[1] = 'RIAU DARATAN';
    row[2] = 'PKR';
    row[3] = 12516319;
    row[4] = 'RDR PKR PT2 SMAN BERNAS BINSUS';
    row[9] = 1;
    row[18] = '07 GOLIVE';
    row[19] = 'GOLIVE';
    row[21] = '20/03 Pelanggan sudah berlangganan provider lain';
    row[22] = 46185;
    row[32] = 46186;

    const data = mapSheetRowToProjectData(row, getProjectConfig('HEM'));

    expect(data).toMatchObject({
      uid: 'HEM::12516319',
      project_type: 'HEM',
      id_ihld: '12516319',
      batch_program: '1',
      nama_lop: 'RDR PKR PT2 SMAN BERNAS BINSUS',
      region: 'SUMBAGTENG',
      status: '07 GOLIVE',
      sub_status: 'GOLIVE',
      golive_target: '46185',
      golive_actual: '46186',
    });
    expect(JSON.parse(data!.full_data)[21]).toBe('20/03 Pelanggan sudah berlangganan provider lain');
  });

  it('keeps JPP uid format backward-compatible and applies the SUMBAGTENG filter', () => {
    const row: unknown[] = [];
    row[1] = 10882441;
    row[2] = 'JPP Project';
    row[6] = 'SUMBAGTENG';
    row[8] = 'Batch 1';

    const config = getProjectConfig('JPP');
    const data = mapSheetRowToProjectData(row, config);

    expect(shouldIncludeSourceRow(row, config)).toBe(true);
    expect(data?.uid).toBe('10882441::Batch 1');
  });
});
