import { NextRequest } from 'next/server';
import { VendorRepository } from '@/repositories/VendorRepository';
import { vendorUpdateSchema, safeValidate, formatValidationError } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/vendors/[id]
 * Get single vendor by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const vendor = VendorRepository.findById(id);
    if (!vendor) {
      return errorResponse('Vendor tidak ditemukan', 404);
    }

    return successResponse(vendor);
  } catch (error) {
    console.error('[GET /api/vendors/[id]] Error:', error);
    return errorResponse('Gagal mengambil data vendor', 500);
  }
}

/**
 * PUT /api/vendors/[id]
 * Update existing vendor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if vendor exists
    const existing = VendorRepository.findById(id);
    if (!existing) {
      return errorResponse('Vendor tidak ditemukan', 404);
    }

    // Validate request body
    const validation = safeValidate(vendorUpdateSchema, { ...body, id });
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if vendor name is being changed and already exists
    if (data.vendor_name && data.vendor_name !== existing.vendor_name) {
      const existingByName = VendorRepository.findByName(data.vendor_name);
      if (existingByName && existingByName.id !== id) {
        return errorResponse('Nama vendor sudah digunakan', 409);
      }
    }

    // Check if vendor code is being changed and already exists
    if (data.vendor_code && data.vendor_code !== existing.vendor_code) {
      const existingByCode = VendorRepository.findByCode(data.vendor_code);
      if (existingByCode && existingByCode.id !== id) {
        return errorResponse('Kode vendor sudah digunakan', 409);
      }
    }

    // Update vendor
    const vendor = VendorRepository.update(id, data);
    if (!vendor) {
      return errorResponse('Gagal mengupdate vendor', 500);
    }

    return successResponse(vendor, 'Vendor berhasil diupdate');
  } catch (error) {
    console.error('[PUT /api/vendors/[id]] Error:', error);
    return errorResponse('Gagal mengupdate vendor', 500);
  }
}

/**
 * DELETE /api/vendors/[id]
 * Delete vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if vendor exists
    const existing = VendorRepository.findById(id);
    if (!existing) {
      return errorResponse('Vendor tidak ditemukan', 404);
    }

    // Check if vendor is being used by any project
    // Note: This would require checking projects table
    // For now, we'll allow deletion

    const success = VendorRepository.delete(id);
    if (!success) {
      return errorResponse('Gagal menghapus vendor', 500);
    }

    return successResponse({ id }, 'Vendor berhasil dihapus');
  } catch (error) {
    console.error('[DELETE /api/vendors/[id]] Error:', error);
    return errorResponse('Gagal menghapus vendor', 500);
  }
}

// Made with Bob
