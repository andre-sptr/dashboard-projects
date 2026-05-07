import { db } from '../lib/db';

/**
 * Vendor Interface
 * Represents a vendor/mitra in the system
 */
export interface Vendor {
  id: string;
  vendor_name: string;
  vendor_code: string | null;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_value: number;
  rating: number;
  total_projects: number;
  completed_projects: number;
  on_time_delivery_rate: number;
  quality_score: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Filter options for querying vendors
 */
export interface VendorFilters {
  status?: string;
  search?: string;
  min_rating?: number;
}

/**
 * Vendor performance metrics
 */
export interface VendorPerformanceMetrics {
  vendor_id: string;
  vendor_name: string;
  total_projects: number;
  completed_projects: number;
  in_progress_projects: number;
  completion_rate: number;
  on_time_delivery_rate: number;
  quality_score: number;
  rating: number;
  contract_value: number;
  active_contract: boolean;
}

interface VendorProjectStatsRow {
  total: number | null;
  completed: number | null;
  in_progress: number | null;
}

interface VendorOverallStatsRow {
  total_vendors: number | null;
  active_vendors: number | null;
  inactive_vendors: number | null;
  average_rating: number | null;
  total_contract_value: number | null;
}

/**
 * Repository for Vendor management
 * Handles all database operations for vendors/mitras
 */
export class VendorRepository {
  /**
   * Get all vendors with optional filtering
   */
  static findAll(filters?: VendorFilters): Vendor[] {
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.min_rating !== undefined) {
      query += ' AND rating >= ?';
      params.push(filters.min_rating);
    }

    if (filters?.search) {
      query += ' AND (vendor_name LIKE ? OR vendor_code LIKE ? OR contact_person LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY vendor_name ASC';

    return db.prepare(query).all(...params) as Vendor[];
  }

  /**
   * Find vendor by ID
   */
  static findById(id: string): Vendor | undefined {
    return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as Vendor | undefined;
  }

  /**
   * Find vendor by name
   */
  static findByName(vendorName: string): Vendor | undefined {
    return db.prepare('SELECT * FROM vendors WHERE vendor_name = ?').get(vendorName) as Vendor | undefined;
  }

  /**
   * Find vendor by code
   */
  static findByCode(vendorCode: string): Vendor | undefined {
    return db.prepare('SELECT * FROM vendors WHERE vendor_code = ?').get(vendorCode) as Vendor | undefined;
  }

  /**
   * Get all active vendors
   */
  static findActive(): Vendor[] {
    return db.prepare('SELECT * FROM vendors WHERE status = ? ORDER BY vendor_name').all('active') as Vendor[];
  }

  /**
   * Create new vendor
   */
  static create(data: Omit<Vendor, 'created_at' | 'updated_at'>): Vendor {
    const stmt = db.prepare(`
      INSERT INTO vendors (
        id, vendor_name, vendor_code, contact_person, phone, email, address,
        contract_start_date, contract_end_date, contract_value, rating,
        total_projects, completed_projects, on_time_delivery_rate, quality_score,
        status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.vendor_name,
      data.vendor_code,
      data.contact_person,
      data.phone,
      data.email,
      data.address,
      data.contract_start_date,
      data.contract_end_date,
      data.contract_value,
      data.rating,
      data.total_projects,
      data.completed_projects,
      data.on_time_delivery_rate,
      data.quality_score,
      data.status,
      data.notes
    );

    return this.findById(data.id)!;
  }

  /**
   * Update existing vendor
   */
  static update(id: string, data: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at'>>): Vendor | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    // Build dynamic update query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return existing;

    // Add updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.findById(id);
  }

  /**
   * Delete vendor
   */
  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Update vendor project statistics
   */
  static updateProjectStats(id: string, totalProjects: number, completedProjects: number): Vendor | undefined {
    const vendor = this.findById(id);
    if (!vendor) return undefined;

    db.prepare(`
      UPDATE vendors 
      SET total_projects = ?, completed_projects = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(totalProjects, completedProjects, id);

    return this.findById(id);
  }

  /**
   * Update vendor rating
   */
  static updateRating(id: string, rating: number): Vendor | undefined {
    const vendor = this.findById(id);
    if (!vendor) return undefined;

    // Ensure rating is between 0 and 5
    const validRating = Math.max(0, Math.min(5, rating));

    db.prepare(`
      UPDATE vendors 
      SET rating = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(validRating, id);

    return this.findById(id);
  }

  /**
   * Update vendor performance metrics
   */
  static updatePerformanceMetrics(
    id: string,
    onTimeDeliveryRate: number,
    qualityScore: number
  ): Vendor | undefined {
    const vendor = this.findById(id);
    if (!vendor) return undefined;

    db.prepare(`
      UPDATE vendors 
      SET on_time_delivery_rate = ?, quality_score = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(onTimeDeliveryRate, qualityScore, id);

    return this.findById(id);
  }

  /**
   * Get vendor performance metrics with project data
   */
  static getPerformanceMetrics(id: string): VendorPerformanceMetrics | undefined {
    const vendor = this.findById(id);
    if (!vendor) return undefined;

    // Get project counts from projects table
    const projectStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'UJI TERIMA' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status != 'UJI TERIMA' THEN 1 ELSE 0 END) as in_progress
      FROM projects
      WHERE vendor_id = ?
    `).get(id) as VendorProjectStatsRow | undefined;

    const totalProjects = projectStats?.total || vendor.total_projects;
    const completedProjects = projectStats?.completed || vendor.completed_projects;
    const inProgressProjects = projectStats?.in_progress || 0;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // Check if contract is active
    const now = new Date();
    const contractStart = vendor.contract_start_date ? new Date(vendor.contract_start_date) : null;
    const contractEnd = vendor.contract_end_date ? new Date(vendor.contract_end_date) : null;
    const activeContract = contractStart && contractEnd 
      ? now >= contractStart && now <= contractEnd 
      : false;

    return {
      vendor_id: vendor.id,
      vendor_name: vendor.vendor_name,
      total_projects: totalProjects,
      completed_projects: completedProjects,
      in_progress_projects: inProgressProjects,
      completion_rate: Math.round(completionRate * 100) / 100,
      on_time_delivery_rate: vendor.on_time_delivery_rate,
      quality_score: vendor.quality_score,
      rating: vendor.rating,
      contract_value: vendor.contract_value,
      active_contract: activeContract,
    };
  }

  /**
   * Get vendors for select dropdown (id, vendor_name)
   */
  static getForSelect(): { id: string; vendor_name: string; vendor_code: string | null }[] {
    return db.prepare(`
      SELECT id, vendor_name, vendor_code 
      FROM vendors 
      WHERE status = 'active'
      ORDER BY vendor_name
    `).all() as { id: string; vendor_name: string; vendor_code: string | null }[];
  }

  /**
   * Get top performing vendors
   */
  static getTopPerformers(limit: number = 10): Vendor[] {
    return db.prepare(`
      SELECT * FROM vendors 
      WHERE status = 'active'
      ORDER BY rating DESC, on_time_delivery_rate DESC, quality_score DESC
      LIMIT ?
    `).all(limit) as Vendor[];
  }

  /**
   * Get vendors with expiring contracts (within next N days)
   */
  static getExpiringContracts(daysAhead: number = 30): Vendor[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return db.prepare(`
      SELECT * FROM vendors 
      WHERE status = 'active'
        AND contract_end_date IS NOT NULL
        AND contract_end_date <= ?
        AND contract_end_date >= date('now')
      ORDER BY contract_end_date ASC
    `).all(futureDateStr) as Vendor[];
  }

  /**
   * Calculate overall vendor statistics
   */
  static getOverallStats(): {
    total_vendors: number;
    active_vendors: number;
    inactive_vendors: number;
    average_rating: number;
    total_contract_value: number;
  } {
    const result = db.prepare(`
      SELECT 
        COUNT(*) as total_vendors,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vendors,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_vendors,
        AVG(rating) as average_rating,
        SUM(contract_value) as total_contract_value
      FROM vendors
    `).get() as VendorOverallStatsRow | undefined;

    return {
      total_vendors: result?.total_vendors || 0,
      active_vendors: result?.active_vendors || 0,
      inactive_vendors: result?.inactive_vendors || 0,
      average_rating: Math.round((result?.average_rating || 0) * 100) / 100,
      total_contract_value: result?.total_contract_value || 0,
    };
  }
}

// Made with Bob
