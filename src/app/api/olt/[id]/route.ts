import { NextRequest } from 'next/server';
import { OltRepository } from '@/repositories/OltRepository';
import { oltUpdateSchema, safeValidate, formatValidationError } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/olt/[id]
 * Get single OLT device by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const olt = OltRepository.findById(id);
    if (!olt) {
      return errorResponse('OLT tidak ditemukan', 404);
    }

    return successResponse(olt);
  } catch (error) {
    console.error('[GET /api/olt/[id]] Error:', error);
    return errorResponse('Gagal mengambil data OLT', 500);
  }
}

/**
 * PUT /api/olt/[id]
 * Update existing OLT device
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if OLT exists
    const existing = OltRepository.findById(id);
    if (!existing) {
      return errorResponse('OLT tidak ditemukan', 404);
    }

    // Validate request body
    const validation = safeValidate(oltUpdateSchema, { ...body, id });
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if IP address is being changed and already exists
    if (data.ip_address && data.ip_address !== existing.ip_address) {
      const existingByIp = OltRepository.findByIpAddress(data.ip_address);
      if (existingByIp && existingByIp.id !== id) {
        return errorResponse('IP address sudah digunakan oleh OLT lain', 409);
      }
    }

    // Check if hostname is being changed and already exists
    if (data.hostname && data.hostname !== existing.hostname) {
      const existingByHostname = OltRepository.findByHostname(data.hostname);
      if (existingByHostname && existingByHostname.id !== id) {
        return errorResponse('Hostname sudah digunakan oleh OLT lain', 409);
      }
    }

    // Check if serial number is being changed and already exists
    if (data.serial_number && data.serial_number !== existing.serial_number) {
      const existingBySerial = OltRepository.findAll().find(
        olt => olt.serial_number === data.serial_number && olt.id !== id
      );
      if (existingBySerial) {
        return errorResponse('Serial number sudah digunakan oleh OLT lain', 409);
      }
    }

    // Calculate available ports if total_ports or used_ports changed
    const updateData: any = { ...data };
    if (data.total_ports !== undefined || data.used_ports !== undefined) {
      const totalPorts = data.total_ports ?? existing.total_ports;
      const usedPorts = data.used_ports ?? existing.used_ports;
      updateData.available_ports = totalPorts - usedPorts;
    }

    // Update OLT device
    const olt = OltRepository.update(id, updateData);
    if (!olt) {
      return errorResponse('Gagal mengupdate OLT', 500);
    }

    return successResponse(olt, 'OLT berhasil diupdate');
  } catch (error) {
    console.error('[PUT /api/olt/[id]] Error:', error);
    return errorResponse('Gagal mengupdate OLT', 500);
  }
}

/**
 * DELETE /api/olt/[id]
 * Delete OLT device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if OLT exists
    const existing = OltRepository.findById(id);
    if (!existing) {
      return errorResponse('OLT tidak ditemukan', 404);
    }

    // Check if OLT is being used by any ODC
    // Note: This would require checking ODC repository
    // For now, we'll allow deletion

    const success = OltRepository.delete(id);
    if (!success) {
      return errorResponse('Gagal menghapus OLT', 500);
    }

    return successResponse({ id }, 'OLT berhasil dihapus');
  } catch (error) {
    console.error('[DELETE /api/olt/[id]] Error:', error);
    return errorResponse('Gagal menghapus OLT', 500);
  }
}

// Made with Bob
