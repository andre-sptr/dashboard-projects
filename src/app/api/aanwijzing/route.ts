import { NextRequest, NextResponse } from 'next/server';
import { AanwijzingRepository } from '@/repositories/AanwijzingRepository';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { successResponse, withErrorHandling } from '@/lib/response';
import {
  aanwijzingSchema,
  aanwijzingQuerySchema,
  formatValidationError,
} from '@/lib/validation';
import { ValidationError, DatabaseError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return `AAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export const GET = withErrorHandling(async () => {
  const aanwijzingList = AanwijzingRepository.findAll();
  const projects = ProjectRepository.getForSelect();

  const aanwijzingWithBoq = aanwijzingList.map(a => {
    const boq = AanwijzingRepository.getBoq(a.id);
    return { ...a, boq_data: boq || null };
  });

  return successResponse({
    aanwijzing: aanwijzingWithBoq,
    projects: projects
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  const validationResult = aanwijzingSchema.safeParse(body);
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const validated = validationResult.data;
  const aanwijzingId = validated.id || generateId();

  try {
    AanwijzingRepository.upsert({
      id: aanwijzingId,
      nama_lop: validated.nama_lop,
      id_ihld: validated.id_ihld,
      tematik: validated.tematik || '',
      tanggal_aanwijzing: validated.tanggal_aanwijzing,
      catatan: validated.catatan || '',
      status_after_aanwijzing: validated.status_after_aanwijzing || '',
      gpon: validated.gpon || '',
      frame: validated.frame || 0,
      slot_awal: validated.slot_awal || 0,
      slot_akhir: validated.slot_akhir || 0,
      port_awal: validated.port_awal || 0,
      port_akhir: validated.port_akhir || 0,
      wa_spang: validated.wa_spang || '',
      ut: validated.ut || ''
    });

    const boq_data = (body as any).boq_data;
    if (boq_data) {
      const boqId = `boqa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      AanwijzingRepository.upsertBoq({
        id: boqId,
        aanwijzing_id: aanwijzingId,
        nama_lop: validated.nama_lop,
        id_ihld: validated.id_ihld,
        full_data: JSON.stringify(boq_data)
      });
    }
  } catch (error) {
    throw new DatabaseError(`Gagal menyimpan data AANWIJZING: ${(error as Error).message}`);
  }

  return successResponse({ id: aanwijzingId }, 'Data AANWIJZING berhasil disimpan');
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = { id: searchParams.get('id') };

  const validationResult = aanwijzingQuerySchema.safeParse(params);
  if (!validationResult.success) {
    throw new ValidationError(formatValidationError(validationResult.error));
  }

  const { id } = validationResult.data;

  try {
    AanwijzingRepository.delete(id);
    AanwijzingRepository.deleteBoqByAanwijzingId(id);
  } catch (error) {
    throw new DatabaseError(`Gagal menghapus data AANWIJZING: ${(error as Error).message}`);
  }

  return successResponse(null, 'Data AANWIJZING berhasil dihapus');
});