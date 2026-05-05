import { NextRequest } from 'next/server';
import { parseBoQExcel } from '@/lib/excel';
import { successResponse, errorResponse } from '@/lib/response';
import { validateExcelFile, validateFileSize } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file presence
    if (!file) {
      return errorResponse('File tidak ditemukan', 400);
    }

    // Validate file extension
    if (!validateExcelFile(file.name)) {
      return errorResponse('Format file harus .xlsx atau .xls', 400);
    }

    // Validate file size (max 10MB)
    if (!validateFileSize(file.size, 10)) {
      return errorResponse('Ukuran file terlalu besar (maksimal 10MB)', 400);
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
