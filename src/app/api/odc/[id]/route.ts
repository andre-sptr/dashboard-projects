import { NextRequest } from 'next/server';
import { OdcRepository } from '@/repositories/OdcRepository';
import { odcUpdateSchema, safeValidate, formatValidationError, type OdcUpdateInput } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/odc/[id]
 * Get single ODC by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const odc = OdcRepository.findById(id);
    if (!odc) {
      return errorResponse('ODC tidak ditemukan', 404);
    }

    return successResponse(odc);
  } catch (error) {
    console.error('[GET /api/odc/[id]] Error:', error);
    return errorResponse('Gagal mengambil data ODC', 500);
  }
}

/**
 * PUT /api/odc/[id]
 * Update existing ODC
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if ODC exists
    const existing = OdcRepository.findById(id);
    if (!existing) {
      return errorResponse('ODC tidak ditemukan', 404);
    }

    // Validate request body
    const validation = safeValidate(odcUpdateSchema, { ...body, id });
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if ODC name is being changed and already exists
    if (data.odc_name && data.odc_name !== existing.odc_name) {
      const existingByName = OdcRepository.findByName(data.odc_name);
      if (existingByName && existingByName.id !== id) {
        return errorResponse('Nama ODC sudah digunakan', 409);
      }
    }

    // Calculate available capacity if max_capacity or used_capacity changed
    const updateData: OdcUpdateInput = { ...data };
    if (data.max_capacity !== undefined || data.used_capacity !== undefined) {
      const maxCapacity = data.max_capacity ?? existing.max_capacity;
      const usedCapacity = data.used_capacity ?? existing.used_capacity;
      updateData.available_capacity = maxCapacity - usedCapacity;
    }

    // Update ODC
    const odc = OdcRepository.update(id, updateData);
    if (!odc) {
      return errorResponse('Gagal mengupdate ODC', 500);
    }

    return successResponse(odc, 'ODC berhasil diupdate');
  } catch (error) {
    console.error('[PUT /api/odc/[id]] Error:', error);
    return errorResponse('Gagal mengupdate ODC', 500);
  }
}

/**
 * DELETE /api/odc/[id]
 * Delete ODC
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if ODC exists
    const existing = OdcRepository.findById(id);
    if (!existing) {
      return errorResponse('ODC tidak ditemukan', 404);
    }

    // Check if ODC is being used by any project
    // Note: This would require checking projects table
    // For now, we'll allow deletion

    const success = OdcRepository.delete(id);
    if (!success) {
      return errorResponse('Gagal menghapus ODC', 500);
    }

    return successResponse({ id }, 'ODC berhasil dihapus');
  } catch (error) {
    console.error('[DELETE /api/odc/[id]] Error:', error);
    return errorResponse('Gagal menghapus ODC', 500);
  }
}

// Made with Bob
