import { NextRequest } from 'next/server';
import {
  getAllUT,
  upsertUT,
  deleteUTById,
  getProjectsForUTSelect,
  getBoqUtByUtId,
  upsertBoqUt,
  deleteBoqUtByUtId
} from '@/lib/ut';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return `UT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const utList = getAllUT.all() as any[];
    const projects = getProjectsForUTSelect();

    const utWithBoq = utList.map(item => {
      const boq = getBoqUtByUtId.get(item.id);
      return { ...item, boq_data: boq || null };
    });

    return successResponse({
      ut: utWithBoq,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching UT:', error);
    return errorResponse('Gagal mengambil data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nama_lop,
      id_ihld,
      witel,
      tematik,
      sto,
      tim_ut,
      commtest_ut,
      jumlah_odp,
      jumlah_port,
      tanggal_ct_ut,
      temuan,
      follow_up_mitra,
      mitra,
      jumlah_temuan,
      wa_spang,
      komitmen_penyelesaian,
      boq_data,
      id
    } = body;

    if (!nama_lop || !id_ihld || !tanggal_ct_ut) {
      return errorResponse('Nama LOP, ID IHLD, dan Tanggal CT/UT wajib diisi', 400);
    }

    const utId = id || generateId();

    upsertUT.run(
      utId,
      nama_lop,
      id_ihld,
      witel || '',
      tematik || '',
      sto || '',
      tim_ut || '',
      commtest_ut || '',
      Number(jumlah_odp) || 0,
      Number(jumlah_port) || 0,
      tanggal_ct_ut,
      temuan || '',
      follow_up_mitra ? 1 : 0,
      mitra || '',
      Number(jumlah_temuan) || 0,
      wa_spang || '',
      komitmen_penyelesaian || ''
    );

    if (boq_data) {
      const boqId = `boqut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      upsertBoqUt.run(
        boqId,
        utId,
        nama_lop,
        id_ihld,
        JSON.stringify(boq_data)
      );
    }

    return successResponse({ id: utId }, 'Data UT berhasil disimpan');
  } catch (error) {
    console.error('Error saving UT:', error);
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

    deleteUTById.run(id);
    deleteBoqUtByUtId.run(id);

    return successResponse(null, 'Data UT berhasil dihapus');
  } catch (error) {
    console.error('Error deleting UT:', error);
    return errorResponse('Gagal menghapus data');
  }
}