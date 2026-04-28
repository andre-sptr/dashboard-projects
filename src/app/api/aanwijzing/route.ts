import { NextRequest, NextResponse } from 'next/server';
import { getAllAanwijzing, upsertAanwijzing, deleteAanwijzingById, getProjectsForSelect } from '@/lib/aanwijzing';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return `AAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const aanwijzingList = getAllAanwijzing.all() as any[];
    const projects = getProjectsForSelect();
    return NextResponse.json({
      aanwijzing: aanwijzingList,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching aanwijzing:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
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
      id
    } = body;

    if (!nama_lop || !id_ihld || !tanggal_aanwijzing) {
      return NextResponse.json(
        { error: 'Nama LOP, ID IHLD, dan Tanggal AANWIJZING wajib diisi' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      id: aanwijzingId,
      message: 'Data AANWIJZING berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving aanwijzing:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    deleteAanwijzingById.run(id);

    return NextResponse.json({
      success: true,
      message: 'Data AANWIJZING berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting aanwijzing:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}