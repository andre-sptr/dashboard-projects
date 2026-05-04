import { NextRequest } from 'next/server';
import { getAllBoq, upsertBoq, deleteBoq, parseBoQExcel } from '@/lib/boq';
import { getProjectsForSelect } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET() {
  try {
    const boqList = getAllBoq.all();
    const projects = getProjectsForSelect();
    return successResponse({ boq: boqList, projects: projects });
  } catch (error) {
    console.error('Error fetching BoQ:', error);
    return errorResponse('Gagal mengambil data BoQ');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const nama_lop = formData.get('nama_lop') as string | null;
    const id_ihld = formData.get('id_ihld') as string | null;

    if (!file) {
      return errorResponse('File tidak ditemukan', 400);
    }

    if (!nama_lop || !id_ihld) {
      return errorResponse('Nama LOP dan ID IHLD wajib diisi', 400);
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return errorResponse('Format file harus .xlsx atau .xls', 400);
    }

    const buffer = await file.arrayBuffer();
    const rows = parseBoQExcel(buffer);

    if (rows.length === 0) {
      return errorResponse('Tidak ada data yang ditemukan di file Excel', 400);
    }

    const uniqueId = `boq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const fullDataJson = JSON.stringify(rows.map(r => ({
      id_ihld: r.id_ihld,
      batch_program: r.batch_program,
      full_data: r.full_data,
    })));

    upsertBoq.run(
      uniqueId,
      nama_lop,
      id_ihld,
      '',
      rows[0]?.batch_program || '',
      nama_lop,
      'SUMBAGTENG',
      fullDataJson
    );

    return successResponse(
      {
        id: uniqueId,
        nama_lop: nama_lop,
        row_count: rows.length,
      },
      `Berhasil import ${rows.length} baris data`
    );
  } catch (error) {
    console.error('Error uploading BoQ:', error);
    return errorResponse('Gagal mengupload file: ' + (error as Error).message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID tidak ditemukan', 400);
    }

    deleteBoq.run(id);

    return successResponse(null, 'Data berhasil dihapus');
  } catch (error) {
    console.error('Error deleting BoQ:', error);
    return errorResponse('Gagal menghapus data');
  }
}