import { NextRequest } from 'next/server';
import { OltRepository } from '@/repositories/OltRepository';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/olt/stats
 * Get OLT capacity statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse optional filter parameters
    const filters = {
      area: searchParams.get('area') || undefined,
      status: searchParams.get('status') || undefined,
    };

    // Get capacity statistics
    const stats = OltRepository.getCapacityStats(filters);

    // Get additional metadata
    const areas = OltRepository.getUniqueAreas();
    const branches = OltRepository.getUniqueBranches();
    const stos = OltRepository.getUniqueSTOs();

    return successResponse({
      capacity: stats,
      metadata: {
        areas,
        branches,
        stos,
      },
    });
  } catch (error) {
    console.error('[GET /api/olt/stats] Error:', error);
    return errorResponse('Gagal mengambil statistik OLT', 500);
  }
}

// Made with Bob
