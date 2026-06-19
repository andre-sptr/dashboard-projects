// API endpoints for managing User Test (UT) documentation
import { NextRequest } from 'next/server';
import { UtRepository } from '@/repositories/UtRepository';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { successResponse, withErrorHandling } from '@/lib/response';
import { normalizeBoqItems } from '@/lib/boq-items';
import {
  utSchema,
  utQuerySchema,
  formatValidationError,
} from '@/lib/validation';
import { ValidationError, DatabaseError } from '@/lib/errors';
import { parseProjectType } from '@/lib/project-types';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return `UT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const projectType = parseProjectType(searchParams.get('projectType'));
  const utWithBoq = UtRepository.findAllWithBoq(projectType);
  const projects = ProjectRepository.getForSelect(projectType);
  return successResponse({ ut: utWithBoq, projects });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const projectType = parseProjectType((body as { project_type?: unknown; projectType?: unknown }).project_type ?? (body as { projectType?: unknown }).projectType);
  if ((body as { id?: unknown }).id === null) {
    delete (body as { id?: unknown }).id;
  }

  const validationResult = utSchema.safeParse(body);
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const validated = validationResult.data;
  const utId = validated.id || generateId();

  try {
    UtRepository.upsert({
      id: utId,
      project_type: projectType,
      nama_lop: validated.nama_lop,
      id_ihld: validated.id_ihld,
      witel: validated.witel || '',
      tematik: validated.tematik || '',
      sto: validated.sto || '',
      tim_ut: validated.tim_ut || '',
      commtest_ut: validated.commtest_ut || '',
      jumlah_odp: validated.jumlah_odp || 0,
      jumlah_port: validated.jumlah_port || 0,
      tanggal_ct_ut: validated.tanggal_ct_ut || '',
      temuan: validated.temuan || '',
      mitra: validated.mitra || '',
      jumlah_temuan: validated.jumlah_temuan || 0,
      wa_spang: validated.wa_spang || '',
      komitmen_penyelesaian: validated.komitmen_penyelesaian || ''
    });

    const boqItems = normalizeBoqItems((body as { boq_data?: unknown[] }).boq_data);
    if (boqItems.length > 0) {
      UtRepository.upsertBoqWithItems(
        {
          ut_id: utId,
          nama_lop: validated.nama_lop,
          id_ihld: validated.id_ihld,
        },
        boqItems
      );
    }
  } catch (error) {
    throw new DatabaseError(`Gagal menyimpan data UT: ${(error as Error).message}`);
  }

  return successResponse({ id: utId }, 'Data UT berhasil disimpan');
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = { id: searchParams.get('id') };

  const validationResult = utQuerySchema.safeParse(params);
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const { id } = validationResult.data;

  try {
    UtRepository.delete(id);
    UtRepository.deleteBoqByUtId(id);
  } catch (error) {
    throw new DatabaseError(`Gagal menghapus data UT: ${(error as Error).message}`);
  }

  return successResponse(null, 'Data UT berhasil dihapus');
});
