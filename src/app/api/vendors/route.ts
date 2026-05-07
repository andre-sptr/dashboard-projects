import { NextRequest } from 'next/server';
import { VendorRepository } from '@/repositories/VendorRepository';
import { vendorSchema, vendorQuerySchema, safeValidate, formatValidationError } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/response';
import { randomUUID } from 'crypto';

/**
 * GET /api/vendors
 * Get all vendors with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
    };

    const validation = safeValidate(vendorQuerySchema, filters);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const vendors = VendorRepository.findAll(validation.data);
    const stats = VendorRepository.getOverallStats();

    return successResponse({
      vendors,
      stats,
      total: vendors.length,
    });
  } catch (error) {
    console.error('[GET /api/vendors] Error:', error);
    return errorResponse('Gagal mengambil data vendor', 500);
  }
}

/**
 * POST /api/vendors
 * Create new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = safeValidate(vendorSchema, body);
    if (!validation.success) {
      return errorResponse(formatValidationError(validation.error), 400);
    }

    const data = validation.data;

    // Check if vendor name already exists
    const existingByName = VendorRepository.findByName(data.vendor_name);
    if (existingByName) {
      return errorResponse('Nama vendor sudah digunakan', 409);
    }

    // Check if vendor code already exists (if provided)
    if (data.vendor_code) {
      const existingByCode = VendorRepository.findByCode(data.vendor_code);
      if (existingByCode) {
        return errorResponse('Kode vendor sudah digunakan', 409);
      }
    }

    // Create vendor
    const vendor = VendorRepository.create({
      id: data.id || randomUUID(),
      vendor_name: data.vendor_name,
      vendor_code: data.vendor_code || null,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      contract_start_date: data.contract_start_date || null,
      contract_end_date: data.contract_end_date || null,
      contract_value: data.contract_value || 0,
      rating: data.rating || 0,
      total_projects: data.total_projects || 0,
      completed_projects: data.completed_projects || 0,
      on_time_delivery_rate: data.on_time_delivery_rate || 0,
      quality_score: data.quality_score || 0,
      status: data.status || 'active',
      notes: data.notes || '',
    });

    return successResponse(vendor, 'Vendor berhasil ditambahkan', 201);
  } catch (error) {
    console.error('[POST /api/vendors] Error:', error);
    return errorResponse('Gagal menambahkan vendor', 500);
  }
}

// Made with Bob
