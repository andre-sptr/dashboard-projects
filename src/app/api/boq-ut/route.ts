import { NextRequest, NextResponse } from 'next/server';
import { parseBoQExcel } from '@/lib/boq';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Format file harus .xlsx atau .xls' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const rows = parseBoQExcel(buffer);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang ditemukan di file Excel' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil import ${rows.length} baris data`,
      data: rows.map(r => ({
        id_ihld: r.id_ihld,
        batch_program: r.batch_program,
        full_data: r.full_data,
      }))
    });
  } catch (error) {
    console.error('Error parsing BoQ for UT:', error);
    return NextResponse.json({ error: 'Gagal menguraikan file: ' + (error as Error).message }, { status: 500 });
  }
}
