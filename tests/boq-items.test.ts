import { describe, expect, it } from 'vitest';
import { normalizeBoqItems, normalizeBoqItem } from '../src/lib/boq-items';

describe('normalizeBoqItems', () => {
  it('keeps parsed BoQ item objects readable for preview and persistence', () => {
    const rows = normalizeBoqItems([
      {
        no: 1,
        is_section: false,
        designator: 'OS-SM-1',
        uraian_pekerjaan: 'Penyambungan Kabel Optik',
        satuan: 'Core',
        harga_satuan_material: 0,
        harga_satuan_jasa: 49440,
        volume: 27,
        total_material: 0,
        total_jasa: 1334880,
        total: 1334880,
        keterangan: '',
      },
    ]);

    expect(rows).toEqual([
      {
        no: 1,
        is_section: false,
        designator: 'OS-SM-1',
        uraian_pekerjaan: 'Penyambungan Kabel Optik',
        satuan: 'Core',
        harga_satuan_material: 0,
        harga_satuan_jasa: 49440,
        volume: 27,
        total_material: 0,
        total_jasa: 1334880,
        total: 1334880,
        keterangan: '',
      },
    ]);
  });

  it('converts legacy full_data rows into normalized BoQ items', () => {
    const rows = normalizeBoqItems([
      {
        id_ihld: 'OS-SM-1',
        batch_program: '',
        full_data: JSON.stringify([
          1,
          'OS-SM-1',
          'Penyambungan Kabel Optik',
          'Core',
          0,
          49440,
          27,
          0,
          1334880,
          1334880,
          '',
        ]),
      },
    ]);

    expect(rows[0]).toMatchObject({
      no: 1,
      designator: 'OS-SM-1',
      uraian_pekerjaan: 'Penyambungan Kabel Optik',
      satuan: 'Core',
      harga_satuan_jasa: 49440,
      volume: 27,
      total: 1334880,
    });
  });

  it('handles dirty numeric formatting including local Indonesian formats, commas, and spaces', () => {
    const rows = normalizeBoqItems([
      [
        '1',
        'OS-SM-1',
        'Pekerjaan Optik',
        'Core',
        ' 0 ',
        '49,440.00', // US comma
        ' 27 ',
        '0',
        '1.334.880,50', // ID dot and comma
        '1,334,880',
        'keterangan',
      ],
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      no: 1,
      is_section: false,
      designator: 'OS-SM-1',
      uraian_pekerjaan: 'Pekerjaan Optik',
      satuan: 'Core',
      harga_satuan_material: 0,
      harga_satuan_jasa: 49440,
      volume: 27,
      total_material: 0,
      total_jasa: 1334880.5,
      total: 1334880,
      keterangan: 'keterangan',
    });
  });

  it('toNumber: parses fallback to 0 for non-numeric values, nulls, and NaNs', () => {
    const rows = normalizeBoqItems([
      [
        '1',
        'OS-SM-1',
        'Pekerjaan',
        'Core',
        null,
        undefined,
        'abc',
        '',
        'NaN',
        '0',
        '',
      ],
    ]);
    // Standard rows are skipped if they have zero total value (total_material, total_jasa, total all 0).
    // So this should return an empty array because total values are all parsed to 0!
    expect(rows).toHaveLength(0);
  });

  it('skips header rows matching NO or DESIGNATOR and summary rows matching MATERIAL/JASA/TOTAL', () => {
    const rows = normalizeBoqItems([
      ['NO', 'DESIGNATOR', 'Uraian', 'Satuan', 0, 0, 0, 0, 0, 0, ''],
      ['No', 'designator', 'Uraian', 'Satuan', 0, 0, 0, 0, 0, 0, ''],
      ['MATERIAL', 'OS-SM-1', 'Uraian', 'Satuan', 0, 0, 0, 0, 100, 100, ''],
      ['JASA', 'OS-SM-1', 'Uraian', 'Satuan', 0, 0, 0, 0, 100, 100, ''],
      ['TOTAL', 'OS-SM-1', 'Uraian', 'Satuan', 0, 0, 0, 0, 100, 100, ''],
    ]);
    expect(rows).toHaveLength(0);
  });

  it('detects single-letter seksi (A-Z) and does not require total values for sections', () => {
    const rows = normalizeBoqItems([
      ['A', 'SEKSI MATERIAL & JASA', '', '', 0, 0, 0, 0, 0, 0, ''],
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      no: 0,
      is_section: true,
      designator: 'SEKSI MATERIAL & JASA',
    });
  });

  it('skips normal rows if they do not contain total values', () => {
    const rows = normalizeBoqItems([
      ['1', 'OS-SM-1', 'Pekerjaan', 'Core', 1000, 2000, 10, 0, 0, 0, ''], // total is 0
    ]);
    expect(rows).toHaveLength(0);
  });

  it('returns null when normalizeBoqItem receives invalid full_data JSON', () => {
    const item = normalizeBoqItem({
      full_data: '{broken json',
    });
    expect(item).toBeNull();
  });
});

