// API endpoints for BoQ data management and Excel processing
import { NextRequest } from 'next/server';
import { BoqRepository } from '@/repositories/BoqRepository';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { parseBoQExcel } from '@/lib/excel';
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
  return successResponse({ boq: boqList, projects: projects });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const nama_lop = formData.get('nama_lop') as string | null;
  const id_ihld = formData.get('id_ihld') as string | null;

  if (!file) {
    throw new ValidationError('File tidak ditemukan');
  }

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
    const rows = parseBoQExcel(buffer);

    if (rows.length === 0) {
      throw new FileProcessingError('Tidak ada data yang ditemukan di file Excel', file.name);
    }

    const uniqueId = `boq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const fullDataJson = JSON.stringify(rows.map(r => ({
      id_ihld: r.id_ihld,
      batch_program: r.batch_program,
      full_data: r.full_data,
    })));

    BoqRepository.upsert({
      id: uniqueId,
      nama_lop: validated.nama_lop,
      id_ihld: validated.id_ihld,
      sto: '',
      batch_program: rows[0]?.batch_program || '',
      project_name: validated.nama_lop,
      region: 'SUMBAGTENG',
      full_data: fullDataJson
    });

    return successResponse(
      {
        id: uniqueId,
        nama_lop: validated.nama_lop,
        row_count: rows.length,
      },
      `Berhasil import ${rows.length} baris data`
    );
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileProcessingError) {
      throw error;
    }
    throw new DatabaseError('Gagal mengupload file: ' + (error as Error).message);
  }
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = { id: searchParams.get('id') };

  const validationResult = boqQuerySchema.safeParse(params);
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const { id } = validationResult.data;

  try {
    BoqRepository.delete(id);
  } catch (error) {
    throw new DatabaseError(`Gagal menghapus data BoQ: ${(error as Error).message}`);
  }

  return successResponse(null, 'Data berhasil dihapus');
});