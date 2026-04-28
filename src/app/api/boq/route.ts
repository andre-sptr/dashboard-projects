import { NextRequest, NextResponse } from 'next/server';
import db, { getAllBoq, upsertBoq, deleteBoq } from '@/lib/db';
import { parseBoQExcel } from '@/lib/boq';

export async function GET() {
  try {
    const boqList = getAllBoq.all();
    return NextResponse.json({ boq: boqList });
  } catch (error) {
    console.error('Error fetching BoQ:', error);
    return NextResponse.json({ error: 'Gagal mengambil data BoQ' }, { status: 500 });
  }
}

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
    const parseResult = parseBoQExcel(buffer);

    if (parseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang ditemukan di file Excel' }, { status: 400 });
    }

    const uniqueId = `boq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const fullDataJson = JSON.stringify(parseResult.rows.map(r => ({
      id_ihld: r.id_ihld,
      batch_program: r.batch_program,
      full_data: r.full_data,
    })));

    upsertBoq.run(
      uniqueId,
      parseResult.nama_lop,
      parseResult.rows[0]?.id_ihld || '',
      parseResult.sto,
      parseResult.rows[0]?.batch_program || '',
      parseResult.project_name,
      'SUMBAGTENG',
      fullDataJson
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil import ${parseResult.rows.length} baris data`,
      data: {
        id: uniqueId,
        nama_lop: parseResult.nama_lop,
        sto: parseResult.sto,
        project_name: parseResult.project_name,
        row_count: parseResult.rows.length,
      },
    });
  } catch (error) {
    console.error('Error uploading BoQ:', error);
    return NextResponse.json({ error: 'Gagal mengupload file: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    deleteBoq.run(id);

    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting BoQ:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}