// API endpoint for retrieving network topology hierarchy
import { getNetworkHierarchy } from '@/lib/topology';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getNetworkHierarchy();
    return successResponse(data);
  } catch (error) {
    console.error('Error fetching topology:', error);
    return errorResponse('Gagal mengambil data topologi');
  }
}
