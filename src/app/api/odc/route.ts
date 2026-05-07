import { NextRequest } from 'next/server';
import { OdcRepository } from '@/repositories/OdcRepository';
import { odcSchema, odcQuerySchema, safeValidate, formatValidationError } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';
import { randomUUID } from 'crypto';

/**
 * GET /api/odc
 * Get all ODC devices with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = {
      regional: searchParams.get('regional') || undefined,
      witel: searchParams.get('witel') || undefined,
      datel: searchParams.get('datel') || undefined,
      sto: searchParams.get('sto') || undefined,
      olt_id: searchParams.get('olt_id') || undefined,
      status: searchParams.get('status') || undefined,
      polygon_status: searchParams.get('polygon_status') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validation = safeValidate(odcQuerySchema, filters);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    // Check if we need to include OLT information
    const includeOlt = searchParams.get('include_olt') === 'true';

    let odcs;
    if (includeOlt) {
      odcs = OdcRepository.findAllWithOlt(validation.data);
    } else {
      odcs = OdcRepository.findAll(validation.data);
    }

    const stats = OdcRepository.getCapacityStats(validation.data);

    return successResponse({
      odcs,
      stats,
      total: odcs.length,
    });
  } catch (error) {
    console.error('[GET /api/odc] Error:', error);
    return errorResponse('Gagal mengambil data ODC', 500);
  }
}

/**
 * POST /api/odc
 * Create new ODC
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = safeValidate(odcSchema, body);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if ODC name already exists
    const existingByName = OdcRepository.findByName(data.odc_name);
    if (existingByName) {
      return errorResponse('Nama ODC sudah digunakan', 409);
    }

    // Validate OLT ID if provided
    if (data.olt_id) {
      // Note: We could validate if OLT exists by importing OltRepository
      // For now, we'll trust the foreign key constraint
    }

    // Calculate available capacity
    const availableCapacity = data.max_capacity - data.used_capacity;

    // Create ODC
    const odc = OdcRepository.create({
      id: data.id || randomUUID(),
      odc_name: data.odc_name,
      regional: data.regional || '',
      witel: data.witel || '',
      datel: data.datel || '',
      sto: data.sto,
      olt_id: data.olt_id || null,
      splitter_type: data.splitter_type || '',
      max_capacity: data.max_capacity || 0,
      used_capacity: data.used_capacity || 0,
      available_capacity: availableCapacity,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      polygon_coordinates: data.polygon_coordinates || '[]',
      polygon_status: data.polygon_status || 'planned',
      installation_date: data.installation_date || null,
      status: data.status || 'active',
      notes: data.notes || '',
    });

    return successResponse(odc, 'ODC berhasil ditambahkan', 201);
  } catch (error) {
    console.error('[POST /api/odc] Error:', error);
    return errorResponse('Gagal menambahkan ODC', 500);
  }
}

// Made with Bob
