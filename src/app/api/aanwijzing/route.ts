import { NextRequest } from 'next/server';
import {
  getAllAanwijzing,
  upsertAanwijzing,
  deleteAanwijzingById,
  getProjectsForSelect,
  getBoqAanwijzingByAanwijzingId,
  upsertBoqAanwijzing,
  deleteBoqAanwijzingByAanwijzingId
} from '@/lib/aanwijzing';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return `AAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const aanwijzingList = getAllAanwijzing.all() as any[];
    const projects = getProjectsForSelect();

    const aanwijzingWithBoq = aanwijzingList.map(a => {
      const boq = getBoqAanwijzingByAanwijzingId.get(a.id);
      return { ...a, boq_data: boq || null };
    });

    return successResponse({
      aanwijzing: aanwijzingWithBoq,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching aanwijzing:', error);
    return errorResponse('Gagal mengambil data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nama_lop,
      id_ihld,
      tematik,
      tanggal_aanwijzing,
      catatan,
      status_after_aanwijzing,
      gpon,
      frame,
      slot_awal,
      slot_akhir,
      port_awal,
      port_akhir,
      wa_spang,
      ut,
      boq_data,
      id
    } = body;

    if (!nama_lop || !id_ihld || !tanggal_aanwijzing) {
      return errorResponse('Nama LOP, ID IHLD, dan Tanggal AANWIJZING wajib diisi', 400);
    }

    const aanwijzingId = id || generateId();

    upsertAanwijzing.run(
      aanwijzingId,
      nama_lop,
      id_ihld,
      tematik || '',
      tanggal_aanwijzing,
      catatan || '',
      status_after_aanwijzing || '',
      gpon || '',
      frame || 0,
      slot_awal || 0,
      slot_akhir || 0,
      port_awal || 0,
      port_akhir || 0,
      wa_spang || '',
      ut || ''
    );

    if (boq_data) {
      const boqId = `boqa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      upsertBoqAanwijzing.run(
        boqId,
        aanwijzingId,
        nama_lop,
        id_ihld,
        JSON.stringify(boq_data)
      );
    }

    return successResponse({ id: aanwijzingId }, 'Data AANWIJZING berhasil disimpan');
  } catch (error) {
    console.error('Error saving aanwijzing:', error);
    return errorResponse('Gagal menyimpan data');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID diperlukan', 400);
    }

    deleteAanwijzingById.run(id);
    deleteBoqAanwijzingByAanwijzingId.run(id);

    return successResponse(null, 'Data AANWIJZING berhasil dihapus');
  } catch (error) {
    console.error('Error deleting aanwijzing:', error);
    return errorResponse('Gagal menghapus data');
  }
}