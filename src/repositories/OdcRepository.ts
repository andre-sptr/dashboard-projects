import { db } from '../lib/db';

/**
 * ODC Inventory Interface
 * Represents an ODC (Optical Distribution Cabinet) in the network
 */
export interface OdcInventory {
  id: string;
  odc_name: string;
  regional: string;
  witel: string;
  datel: string;
  sto: string;
  olt_id: string | null;
  splitter_type: string;
  max_capacity: number;
  used_capacity: number;
  available_capacity: number;
  latitude: number | null;
  longitude: number | null;
  polygon_coordinates: string;
  polygon_status: string;
  installation_date: string | null;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Filter options for querying ODC inventory
 */
export interface OdcFilters {
  regional?: string;
  witel?: string;
  datel?: string;
  sto?: string;
  olt_id?: string;
  status?: string;
  polygon_status?: string;
  search?: string;
}

/**
 * Capacity statistics for ODC devices
 */
export interface OdcCapacityStats {
  total_odcs: number;
  active_odcs: number;
  total_capacity: number;
  used_capacity: number;
  available_capacity: number;
  utilization_percentage: number;
}

interface OdcCapacityStatsRow {
  total_odcs: number | null;
  active_odcs: number | null;
  total_capacity: number | null;
  used_capacity: number | null;
  available_capacity: number | null;
}

export interface OdcWithOlt extends OdcInventory {
  olt_hostname: string | null;
  olt_ip_address: string | null;
}

/**
 * Repository for ODC Inventory management
 * Handles all database operations for ODC devices
 */
export class OdcRepository {
  /**
   * Get all ODC devices with optional filtering
   */
  static findAll(filters?: OdcFilters): OdcInventory[] {
    let query = 'SELECT * FROM odc_inventory WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.regional) {
      query += ' AND regional = ?';
      params.push(filters.regional);
    }

    if (filters?.witel) {
      query += ' AND witel = ?';
      params.push(filters.witel);
    }

    if (filters?.datel) {
      query += ' AND datel = ?';
      params.push(filters.datel);
    }

    if (filters?.sto) {
      query += ' AND sto = ?';
      params.push(filters.sto);
    }

    if (filters?.olt_id) {
      query += ' AND olt_id = ?';
      params.push(filters.olt_id);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.polygon_status) {
      query += ' AND polygon_status = ?';
      params.push(filters.polygon_status);
    }

    if (filters?.search) {
      query += ' AND (odc_name LIKE ? OR sto LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params) as OdcInventory[];
  }

  /**
   * Find ODC by ID
   */
  static findById(id: string): OdcInventory | undefined {
    return db.prepare('SELECT * FROM odc_inventory WHERE id = ?').get(id) as OdcInventory | undefined;
  }

  /**
   * Find ODC by name
   */
  static findByName(odcName: string): OdcInventory | undefined {
    return db.prepare('SELECT * FROM odc_inventory WHERE odc_name = ?').get(odcName) as OdcInventory | undefined;
  }

  /**
   * Get all ODCs connected to a specific OLT
   */
  static findByOltId(oltId: string): OdcInventory[] {
    return db.prepare('SELECT * FROM odc_inventory WHERE olt_id = ? ORDER BY odc_name').all(oltId) as OdcInventory[];
  }

  /**
   * Get all ODCs in a specific STO
   */
  static findBySto(sto: string): OdcInventory[] {
    return db.prepare('SELECT * FROM odc_inventory WHERE sto = ? ORDER BY odc_name').all(sto) as OdcInventory[];
  }

  /**
   * Get all active ODCs
   */
  static findActive(): OdcInventory[] {
    return db.prepare('SELECT * FROM odc_inventory WHERE status = ? ORDER BY odc_name').all('active') as OdcInventory[];
  }

  /**
   * Create new ODC
   */
  static create(data: Omit<OdcInventory, 'created_at' | 'updated_at'>): OdcInventory {
    const stmt = db.prepare(`
      INSERT INTO odc_inventory (
        id, odc_name, regional, witel, datel, sto, olt_id, splitter_type,
        max_capacity, used_capacity, available_capacity, latitude, longitude,
        polygon_coordinates, polygon_status, installation_date, status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.odc_name,
      data.regional,
      data.witel,
      data.datel,
      data.sto,
      data.olt_id,
      data.splitter_type,
      data.max_capacity,
      data.used_capacity,
      data.available_capacity,
      data.latitude,
      data.longitude,
      data.polygon_coordinates,
      data.polygon_status,
      data.installation_date,
      data.status,
      data.notes
    );

    return this.findById(data.id)!;
  }

  /**
   * Update existing ODC
   */
  static update(id: string, data: Partial<Omit<OdcInventory, 'id' | 'created_at' | 'updated_at'>>): OdcInventory | undefined {
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

    const query = `UPDATE odc_inventory SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.findById(id);
  }

  /**
   * Delete ODC
   */
  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM odc_inventory WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Update capacity utilization for an ODC
   */
  static updateCapacityUtilization(id: string, usedCapacity: number): OdcInventory | undefined {
    const odc = this.findById(id);
    if (!odc) return undefined;

    const availableCapacity = odc.max_capacity - usedCapacity;

    db.prepare(`
      UPDATE odc_inventory 
      SET used_capacity = ?, available_capacity = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(usedCapacity, availableCapacity, id);

    return this.findById(id);
  }

  /**
   * Get capacity statistics for all ODCs
   */
  static getCapacityStats(filters?: OdcFilters): OdcCapacityStats {
    let query = `
      SELECT 
        COUNT(*) as total_odcs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_odcs,
        SUM(max_capacity) as total_capacity,
        SUM(used_capacity) as used_capacity,
        SUM(available_capacity) as available_capacity
      FROM odc_inventory
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters?.sto) {
      query += ' AND sto = ?';
      params.push(filters.sto);
    }

    if (filters?.olt_id) {
      query += ' AND olt_id = ?';
      params.push(filters.olt_id);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const result = db.prepare(query).get(...params) as OdcCapacityStatsRow | undefined;

    const totalCapacity = result?.total_capacity || 0;
    const usedCapacity = result?.used_capacity || 0;
    const utilizationPercentage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      total_odcs: result?.total_odcs || 0,
      active_odcs: result?.active_odcs || 0,
      total_capacity: totalCapacity,
      used_capacity: usedCapacity,
      available_capacity: result?.available_capacity || 0,
      utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
    };
  }

  /**
   * Get unique regionals from ODC inventory
   */
  static getUniqueRegionals(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT regional 
      FROM odc_inventory 
      WHERE regional != '' 
      ORDER BY regional
    `).all() as { regional: string }[];

    return results.map(r => r.regional);
  }

  /**
   * Get unique witels from ODC inventory
   */
  static getUniqueWitels(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT witel 
      FROM odc_inventory 
      WHERE witel != '' 
      ORDER BY witel
    `).all() as { witel: string }[];

    return results.map(r => r.witel);
  }

  /**
   * Get unique datels from ODC inventory
   */
  static getUniqueDatels(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT datel 
      FROM odc_inventory 
      WHERE datel != '' 
      ORDER BY datel
    `).all() as { datel: string }[];

    return results.map(r => r.datel);
  }

  /**
   * Get unique STOs from ODC inventory
   */
  static getUniqueSTOs(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT sto 
      FROM odc_inventory 
      WHERE sto != '' 
      ORDER BY sto
    `).all() as { sto: string }[];

    return results.map(r => r.sto);
  }

  /**
   * Get ODCs for select dropdown (id, odc_name, sto)
   */
  static getForSelect(): { id: string; odc_name: string; sto: string }[] {
    return db.prepare(`
      SELECT id, odc_name, sto 
      FROM odc_inventory 
      WHERE status = 'active'
      ORDER BY odc_name
    `).all() as { id: string; odc_name: string; sto: string }[];
  }

  /**
   * Get ODCs with OLT information (joined query)
   */
  static findAllWithOlt(filters?: OdcFilters): OdcWithOlt[] {
    let query = `
      SELECT 
        odc.*,
        olt.hostname as olt_hostname,
        olt.ip_address as olt_ip_address
      FROM odc_inventory odc
      LEFT JOIN olt_inventory olt ON odc.olt_id = olt.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters?.sto) {
      query += ' AND odc.sto = ?';
      params.push(filters.sto);
    }

    if (filters?.status) {
      query += ' AND odc.status = ?';
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ' AND (odc.odc_name LIKE ? OR odc.sto LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY odc.created_at DESC';

    return db.prepare(query).all(...params) as OdcWithOlt[];
  }
}

// Made with Bob
