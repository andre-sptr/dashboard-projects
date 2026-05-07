import { NextRequest } from 'next/server';
import { VendorRepository } from '@/repositories/VendorRepository';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/vendors/[id]/performance
 * Get vendor performance metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if vendor exists
    const vendor = VendorRepository.findById(id);
    if (!vendor) {
      return errorResponse('Vendor tidak ditemukan', 404);
    }

    // Get performance metrics
    const metrics = VendorRepository.getPerformanceMetrics(id);
    if (!metrics) {
      return errorResponse('Gagal mengambil metrics vendor', 500);
    }

    return successResponse(metrics);
  } catch (error) {
    console.error('[GET /api/vendors/[id]/performance] Error:', error);
    return errorResponse('Gagal mengambil performance metrics', 500);
  }
}

// Made with Bob
