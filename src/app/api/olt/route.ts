import { NextRequest } from 'next/server';
import { OltRepository } from '@/repositories/OltRepository';
import { oltSchema, oltQuerySchema, safeValidate, formatValidationError } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';
import { randomUUID } from 'crypto';

/**
 * GET /api/olt
 * Get all OLT devices with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = {
      area: searchParams.get('area') || undefined,
      branch: searchParams.get('branch') || undefined,
      sto: searchParams.get('sto') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validation = safeValidate(oltQuerySchema, filters);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const olts = OltRepository.findAll(validation.data);
    const stats = OltRepository.getCapacityStats(validation.data);

    return successResponse({
      olts,
      stats,
      total: olts.length,
    });
  } catch (error) {
    console.error('[GET /api/olt] Error:', error);
    return errorResponse('Gagal mengambil data OLT', 500);
  }
}

/**
 * POST /api/olt
 * Create new OLT device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = safeValidate(oltSchema, body);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if IP address already exists
    const existingByIp = OltRepository.findByIpAddress(data.ip_address);
    if (existingByIp) {
      return errorResponse('IP address sudah digunakan oleh OLT lain', 409);
    }

    // Check if hostname already exists
    const existingByHostname = OltRepository.findByHostname(data.hostname);
    if (existingByHostname) {
      return errorResponse('Hostname sudah digunakan oleh OLT lain', 409);
    }

    // Check if serial number already exists (if provided)
    if (data.serial_number) {
      const existingBySerial = OltRepository.findAll().find(
        olt => olt.serial_number === data.serial_number
      );
      if (existingBySerial) {
        return errorResponse('Serial number sudah digunakan oleh OLT lain', 409);
      }
    }

    // Calculate available ports
    const availablePorts = data.total_ports - data.used_ports;

    // Create OLT device
    const olt = OltRepository.create({
      id: data.id || randomUUID(),
      ip_address: data.ip_address,
      hostname: data.hostname,
      brand: data.brand || '',
      model: data.model || '',
      software_version: data.software_version || '',
      serial_number: data.serial_number || null,
      location_name: data.location_name || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      area: data.area || '',
      branch: data.branch || '',
      sto: data.sto || '',
      uplink_config: data.uplink_config || '{}',
      dualhoming_enabled: data.dualhoming_enabled || 0,
      dualhoming_pair: data.dualhoming_pair || null,
      total_ports: data.total_ports || 0,
      used_ports: data.used_ports || 0,
      available_ports: availablePorts,
      cacti_integrated: data.cacti_integrated || 0,
      cacti_device_id: data.cacti_device_id || null,
      nms_integrated: data.nms_integrated || 0,
      nms_device_id: data.nms_device_id || null,
      status: data.status || 'active',
      installation_date: data.installation_date || null,
      last_maintenance_date: data.last_maintenance_date || null,
      next_maintenance_date: data.next_maintenance_date || null,
      notes: data.notes || '',
    });

    return successResponse(olt, 'OLT berhasil ditambahkan', 201);
  } catch (error) {
    console.error('[POST /api/olt] Error:', error);
    return errorResponse('Gagal menambahkan OLT', 500);
  }
}

// Made with Bob
