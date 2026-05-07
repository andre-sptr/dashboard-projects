import { db } from '../lib/db';

/**
 * OLT Inventory Interface
 * Represents an OLT (Optical Line Terminal) device in the network
 */
export interface OltInventory {
  id: string;
  ip_address: string;
  hostname: string;
  brand: string;
  model: string;
  software_version: string;
  serial_number: string | null;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  area: string;
  branch: string;
  sto: string;
  uplink_config: string;
  dualhoming_enabled: number;
  dualhoming_pair: string | null;
  total_ports: number;
  used_ports: number;
  available_ports: number;
  cacti_integrated: number;
  cacti_device_id: string | null;
  nms_integrated: number;
  nms_device_id: string | null;
  status: string;
  installation_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Filter options for querying OLT inventory
 */
export interface OltFilters {
  area?: string;
  branch?: string;
  sto?: string;
  status?: string;
  search?: string;
}

/**
 * Capacity statistics for OLT devices
 */
export interface OltCapacityStats {
  total_devices: number;
  active_devices: number;
  total_ports: number;
  used_ports: number;
  available_ports: number;
  utilization_percentage: number;
}

interface OltCapacityStatsRow {
  total_devices: number | null;
  active_devices: number | null;
  total_ports: number | null;
  used_ports: number | null;
  available_ports: number | null;
}

/**
 * Repository for OLT Inventory management
 * Handles all database operations for OLT devices
 */
export class OltRepository {
  /**
   * Get all OLT devices with optional filtering
   */
  static findAll(filters?: OltFilters): OltInventory[] {
    let query = 'SELECT * FROM olt_inventory WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.area) {
      query += ' AND area = ?';
      params.push(filters.area);
    }

    if (filters?.branch) {
      query += ' AND branch = ?';
      params.push(filters.branch);
    }

    if (filters?.sto) {
      query += ' AND sto = ?';
      params.push(filters.sto);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ' AND (hostname LIKE ? OR ip_address LIKE ? OR location_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params) as OltInventory[];
  }

  /**
   * Find OLT device by ID
   */
  static findById(id: string): OltInventory | undefined {
    return db.prepare('SELECT * FROM olt_inventory WHERE id = ?').get(id) as OltInventory | undefined;
  }

  /**
   * Find OLT device by IP address
   */
  static findByIpAddress(ipAddress: string): OltInventory | undefined {
    return db.prepare('SELECT * FROM olt_inventory WHERE ip_address = ?').get(ipAddress) as OltInventory | undefined;
  }

  /**
   * Find OLT device by hostname
   */
  static findByHostname(hostname: string): OltInventory | undefined {
    return db.prepare('SELECT * FROM olt_inventory WHERE hostname = ?').get(hostname) as OltInventory | undefined;
  }

  /**
   * Get all OLT devices in a specific area
   */
  static findByArea(area: string): OltInventory[] {
    return db.prepare('SELECT * FROM olt_inventory WHERE area = ? ORDER BY hostname').all(area) as OltInventory[];
  }

  /**
   * Get all active OLT devices
   */
  static findActive(): OltInventory[] {
    return db.prepare('SELECT * FROM olt_inventory WHERE status = ? ORDER BY hostname').all('active') as OltInventory[];
  }

  /**
   * Create new OLT device
   */
  static create(data: Omit<OltInventory, 'created_at' | 'updated_at'>): OltInventory {
    const stmt = db.prepare(`
      INSERT INTO olt_inventory (
        id, ip_address, hostname, brand, model, software_version, serial_number,
        location_name, latitude, longitude, area, branch, sto, uplink_config,
        dualhoming_enabled, dualhoming_pair, total_ports, used_ports, available_ports,
        cacti_integrated, cacti_device_id, nms_integrated, nms_device_id,
        status, installation_date, last_maintenance_date, next_maintenance_date, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.ip_address,
      data.hostname,
      data.brand,
      data.model,
      data.software_version,
      data.serial_number,
      data.location_name,
      data.latitude,
      data.longitude,
      data.area,
      data.branch,
      data.sto,
      data.uplink_config,
      data.dualhoming_enabled,
      data.dualhoming_pair,
      data.total_ports,
      data.used_ports,
      data.available_ports,
      data.cacti_integrated,
      data.cacti_device_id,
      data.nms_integrated,
      data.nms_device_id,
      data.status,
      data.installation_date,
      data.last_maintenance_date,
      data.next_maintenance_date,
      data.notes
    );

    return this.findById(data.id)!;
  }

  /**
   * Update existing OLT device
   */
  static update(id: string, data: Partial<Omit<OltInventory, 'id' | 'created_at' | 'updated_at'>>): OltInventory | undefined {
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

    const query = `UPDATE olt_inventory SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.findById(id);
  }

  /**
   * Delete OLT device
   */
  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM olt_inventory WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Update port utilization for an OLT device
   */
  static updatePortUtilization(id: string, usedPorts: number): OltInventory | undefined {
    const olt = this.findById(id);
    if (!olt) return undefined;

    const availablePorts = olt.total_ports - usedPorts;

    db.prepare(`
      UPDATE olt_inventory 
      SET used_ports = ?, available_ports = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(usedPorts, availablePorts, id);

    return this.findById(id);
  }

  /**
   * Get capacity statistics for all OLT devices
   */
  static getCapacityStats(filters?: OltFilters): OltCapacityStats {
    let query = `
      SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_devices,
        SUM(total_ports) as total_ports,
        SUM(used_ports) as used_ports,
        SUM(available_ports) as available_ports
      FROM olt_inventory
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters?.area) {
      query += ' AND area = ?';
      params.push(filters.area);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const result = db.prepare(query).get(...params) as OltCapacityStatsRow | undefined;

    const totalPorts = result?.total_ports || 0;
    const usedPorts = result?.used_ports || 0;
    const utilizationPercentage = totalPorts > 0 ? (usedPorts / totalPorts) * 100 : 0;

    return {
      total_devices: result?.total_devices || 0,
      active_devices: result?.active_devices || 0,
      total_ports: totalPorts,
      used_ports: usedPorts,
      available_ports: result?.available_ports || 0,
      utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
    };
  }

  /**
   * Get unique areas from OLT inventory
   */
  static getUniqueAreas(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT area 
      FROM olt_inventory 
      WHERE area != '' 
      ORDER BY area
    `).all() as { area: string }[];

    return results.map(r => r.area);
  }

  /**
   * Get unique branches from OLT inventory
   */
  static getUniqueBranches(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT branch 
      FROM olt_inventory 
      WHERE branch != '' 
      ORDER BY branch
    `).all() as { branch: string }[];

    return results.map(r => r.branch);
  }

  /**
   * Get unique STOs from OLT inventory
   */
  static getUniqueSTOs(): string[] {
    const results = db.prepare(`
      SELECT DISTINCT sto 
      FROM olt_inventory 
      WHERE sto != '' 
      ORDER BY sto
    `).all() as { sto: string }[];

    return results.map(r => r.sto);
  }

  /**
   * Get OLT devices for select dropdown (id, hostname, ip_address)
   */
  static getForSelect(): { id: string; hostname: string; ip_address: string }[] {
    return db.prepare(`
      SELECT id, hostname, ip_address
      FROM olt_inventory
      WHERE status = 'active'
      ORDER BY hostname
    `).all() as { id: string; hostname: string; ip_address: string }[];
  }
}

// Made with Bob
