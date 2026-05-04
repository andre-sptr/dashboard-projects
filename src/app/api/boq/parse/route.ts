import { NextRequest } from 'next/server';
import { parseBoQExcel } from '@/lib/boq';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('File tidak ditemukan', 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return errorResponse('Format file harus .xlsx atau .xls', 400);
    }

    const buffer = await file.arrayBuffer();
    const rows = parseBoQExcel(buffer);

    if (rows.length === 0) {
      return errorResponse('Tidak ada data yang ditemukan di file Excel', 400);
    }

    return successResponse(
      rows.map(r => ({
        id_ihld: r.id_ihld,
        batch_program: r.batch_program,
        full_data: r.full_data,
      })),
      `Berhasil menguraikan ${rows.length} baris data`
    );
  } catch (error) {
    console.error('Error parsing BoQ:', error);
    return errorResponse('Gagal menguraikan file: ' + (error as Error).message, 500);
  }
}
