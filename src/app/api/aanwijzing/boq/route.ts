import { NextRequest } from 'next/server';
import { AanwijzingRepository } from '@/repositories/AanwijzingRepository';
import { parseBoQExcelItems } from '@/lib/excel';
import { successResponse, withErrorHandling } from '@/lib/response';
import { validateExcelFile, validateFileSize } from '@/lib/validation';
import { ValidationError, DatabaseError, FileProcessingError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const aanwijzing_id = formData.get('aanwijzing_id') as string | null;

  if (!file) throw new ValidationError('File tidak ditemukan');
  if (!aanwijzing_id) throw new ValidationError('aanwijzing_id tidak boleh kosong');

  const aanwijzing = AanwijzingRepository.findById(aanwijzing_id);
  if (!aanwijzing) throw new ValidationError(`AANWIJZING ${aanwijzing_id} tidak ditemukan`);

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

    const boqId = AanwijzingRepository.upsertBoqWithItems(
      { aanwijzing_id, nama_lop: aanwijzing.nama_lop, id_ihld: aanwijzing.id_ihld },
      items
    );

    return successResponse(
      { id: boqId, aanwijzing_id, row_count: items.length },
      `Berhasil import ${items.length} baris data BoQ AANWIJZING`
    );
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileProcessingError) throw error;
    throw new DatabaseError('Gagal mengupload file: ' + (error as Error).message);
  }
});
