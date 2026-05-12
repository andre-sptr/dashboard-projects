import { NextRequest } from 'next/server';
import { UtRepository } from '@/repositories/UtRepository';
import { parseBoQExcelItems } from '@/lib/excel';
import { successResponse, withErrorHandling } from '@/lib/response';
import { validateExcelFile, validateFileSize } from '@/lib/validation';
import { ValidationError, DatabaseError, FileProcessingError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const ut_id = formData.get('ut_id') as string | null;

  if (!file) throw new ValidationError('File tidak ditemukan');
  if (!ut_id) throw new ValidationError('ut_id tidak boleh kosong');

  const ut = UtRepository.findById(ut_id);
  if (!ut) throw new ValidationError(`UT ${ut_id} tidak ditemukan`);

  if (!validateExcelFile(file.name)) {
    throw new ValidationError('Format file harus .xlsx atau .xls');
  }
  if (!validateFileSize(file.size, 10)) {
    throw new ValidationError('Ukuran file terlalu besar (maksimal 10MB)');
  }

  try {
    const buffer = await file.arrayBuffer();
    const items = parseBoQExcelItems(buffer);

    if (items.length === 0) {
      throw new FileProcessingError('Tidak ada data yang ditemukan di file Excel', file.name);
    }

    const boqId = UtRepository.upsertBoqWithItems(
      { ut_id, nama_lop: ut.nama_lop, id_ihld: ut.id_ihld },
      items
    );

    return successResponse(
      { id: boqId, ut_id, row_count: items.length },
      `Berhasil import ${items.length} baris data BoQ UT`
    );
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileProcessingError) throw error;
    throw new DatabaseError('Gagal mengupload file: ' + (error as Error).message);
  }
});
