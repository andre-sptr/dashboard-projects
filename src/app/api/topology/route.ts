import { NextResponse } from 'next/server';
import { getNetworkHierarchy } from '@/lib/topology';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getNetworkHierarchy();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching topology:', error);
    return NextResponse.json({ error: 'Gagal mengambil data topologi' }, { status: 500 });
  }
}
