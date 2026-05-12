import { NextRequest } from 'next/server';
import { BoqRepository } from '@/repositories/BoqRepository';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { parseBoQExcelItems } from '@/lib/excel';
import { successResponse, withErrorHandling } from '@/lib/response';
import {
  boqUploadSchema,
  boqQuerySchema,
  validateExcelFile,
  validateFileSize,
  formatValidationError,
} from '@/lib/validation';
import { ValidationError, DatabaseError, FileProcessingError } from '@/lib/errors';

export const GET = withErrorHandling(async () => {
  const boqList = BoqRepository.findAll();
  const projects = ProjectRepository.getForSelect();
  return successResponse({ boq: boqList, projects });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const nama_lop = formData.get('nama_lop') as string | null;
  const id_ihld = formData.get('id_ihld') as string | null;

  if (!file) throw new ValidationError('File tidak ditemukan');

  const validationResult = boqUploadSchema.safeParse({ nama_lop, id_ihld });
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const validated = validationResult.data;

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

    const project = ProjectRepository.findByIdIhld(validated.id_ihld);
    const project_uid = project?.uid ?? validated.id_ihld;

    const boqId = BoqRepository.upsertWithItems(
      { nama_lop: validated.nama_lop, id_ihld: validated.id_ihld, project_uid },
      items
    );

    return successResponse(
      { id: boqId, nama_lop: validated.nama_lop, row_count: items.length },
      `Berhasil import ${items.length} baris data BoQ`
    );
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileProcessingError) throw error;
    throw new DatabaseError('Gagal mengupload file: ' + (error as Error).message);
  }
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const validationResult = boqQuerySchema.safeParse({ id: searchParams.get('id') });
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  try {
    BoqRepository.delete(validationResult.data.id);
  } catch (error) {
    throw new DatabaseError(`Gagal menghapus data BoQ: ${(error as Error).message}`);
  }

  return successResponse(null, 'Data berhasil dihapus');
});
