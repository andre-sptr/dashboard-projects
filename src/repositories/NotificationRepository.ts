import { db } from '../lib/db';

export interface Aanwijzing {
  id: string;
  nama_lop: string;
  id_ihld: string;
  tematik: string;
  tanggal_aanwijzing: string;
  catatan: string;
  status_after_aanwijzing: string;
  gpon: string;
  frame: number;
  slot_awal: number;
  slot_akhir: number;
  port_awal: number;
  port_akhir: number;
  wa_spang: string;
  ut: string;
  updated_at: string;
}

export interface BoqAanwijzing {
  id: string;
  aanwijzing_id: string;
  nama_lop: string;
  id_ihld: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Aanwijzing (technical briefing) records
export class AanwijzingRepository {
  // Get all aanwijzing records
  static findAll(): Aanwijzing[] {
    return db.prepare('SELECT * FROM aanwijzing ORDER BY created_at DESC').all() as Aanwijzing[];
  }

  // Find aanwijzing by ID
  static findById(id: string): Aanwijzing | undefined {
    return db.prepare('SELECT * FROM aanwijzing WHERE id = ?').get(id) as Aanwijzing | undefined;
  }

  // Delete aanwijzing by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM aanwijzing WHERE id = ?').run(id);
  }

  // Insert or update aanwijzing
  static upsert(data: Omit<Aanwijzing, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO aanwijzing (
        id, nama_lop, id_ihld, tematik, tanggal_aanwijzing, catatan,
        status_after_aanwijzing, gpon, frame, slot_awal, slot_akhir,
        port_awal, port_akhir, wa_spang, ut, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        tematik = excluded.tematik,
        tanggal_aanwijzing = excluded.tanggal_aanwijzing,
        catatan = excluded.catatan,
        status_after_aanwijzing = excluded.status_after_aanwijzing,
        gpon = excluded.gpon,
        frame = excluded.frame,
        slot_awal = excluded.slot_awal,
        slot_akhir = excluded.slot_akhir,
        port_awal = excluded.port_awal,
        port_akhir = excluded.port_akhir,
        wa_spang = excluded.wa_spang,
        ut = excluded.ut,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.tematik,
      data.tanggal_aanwijzing,
      data.catatan,
      data.status_after_aanwijzing,
      data.gpon,
      data.frame,
      data.slot_awal,
      data.slot_akhir,
      data.port_awal,
      data.port_akhir,
      data.wa_spang,
      data.ut
    );
  }

  // Get BoQ data for aanwijzing
  static getBoq(aanwijzingId: string): BoqAanwijzing | undefined {
    return db.prepare('SELECT * FROM boq_aanwijzing WHERE aanwijzing_id = ?').get(aanwijzingId) as BoqAanwijzing | undefined;
  }

  // Insert or update BoQ for aanwijzing
  static upsertBoq(data: {
    id: string;
    aanwijzing_id: string;
    nama_lop: string;
    id_ihld: string;
    full_data: string;
  }) {
    const stmt = db.prepare(`
      INSERT INTO boq_aanwijzing (
        id, aanwijzing_id, nama_lop, id_ihld, full_data, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        aanwijzing_id = excluded.aanwijzing_id,
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        full_data = excluded.full_data,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.aanwijzing_id,
      data.nama_lop,
      data.id_ihld,
      data.full_data
    );
  }

  // Delete BoQ records for aanwijzing
  static deleteBoqByAanwijzingId(aanwijzingId: string) {
    return db.prepare('DELETE FROM boq_aanwijzing WHERE aanwijzing_id = ?').run(aanwijzingId);
  }
}
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: string;
  new_value: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class AuditLogRepository {
  static create(data: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id, 
        old_value, new_value, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.user_id, data.action, data.entity_type, data.entity_id,
      data.old_value, data.new_value, data.ip_address || '', data.user_agent || '', created_at
    );

    return { ...data, id, created_at };
  }

  static getByEntity(entityType: string, entityId: string): AuditLog[] {
    return db.prepare(`
      SELECT * FROM audit_logs 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC
    `).all(entityType, entityId) as AuditLog[];
  }

  static getRecent(limit: number = 50): AuditLog[] {
    return db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as AuditLog[];
  }
}
import { db } from '../lib/db';

export interface Boq {
  id: string;
  nama_lop: string;
  id_ihld: string;
  sto: string;
  batch_program: string;
  project_name: string;
  region: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Bill of Quantity (BoQ) records
export class BoqRepository {
  // Get all BoQ records
  static findAll(): Boq[] {
    return db.prepare('SELECT * FROM boq ORDER BY created_at DESC').all() as Boq[];
  }

  // Find BoQ by ID
  static findById(id: string): Boq | undefined {
    return db.prepare('SELECT * FROM boq WHERE id = ?').get(id) as Boq | undefined;
  }

  // Delete BoQ by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM boq WHERE id = ?').run(id);
  }

  // Insert or update BoQ
  static upsert(data: Omit<Boq, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO boq (
        id, nama_lop, id_ihld, sto, batch_program, project_name, region, full_data, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        sto = excluded.sto,
        batch_program = excluded.batch_program,
        project_name = excluded.project_name,
        region = excluded.region,
        full_data = excluded.full_data,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.sto,
      data.batch_program,
      data.project_name,
      data.region,
      data.full_data
    );
  }
}
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: number;
  created_at: string;
  read_at?: string;
}

export class NotificationRepository {
  static create(data: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Notification {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, 
        related_entity_type, related_entity_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id, data.user_id, data.type, data.title, data.message,
      data.related_entity_type || null, data.related_entity_id || null, created_at
    );

    return { ...data, id, is_read: 0, created_at };
  }

  static getByUserId(userId: string, limit: number = 20): Notification[] {
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as Notification[];
  }

  static getUnreadCount(userId: string): number {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as { count: number };
    return result.count;
  }

  static markAsRead(id: string) {
    const read_at = new Date().toISOString();
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = ? 
      WHERE id = ?
    `).run(read_at, id);
  }

  static markAllAsRead(userId: string) {
    const read_at = new Date().toISOString();
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = ? 
      WHERE user_id = ? AND is_read = 0
    `).run(read_at, userId);
  }

  static delete(id: string) {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  }
}
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
    const params: any[] = [];

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
    const values: any[] = [];

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
    const params: any[] = [];

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

    const result = db.prepare(query).get(...params) as any;

    const totalCapacity = result.total_capacity || 0;
    const usedCapacity = result.used_capacity || 0;
    const utilizationPercentage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      total_odcs: result.total_odcs || 0,
      active_odcs: result.active_odcs || 0,
      total_capacity: totalCapacity,
      used_capacity: usedCapacity,
      available_capacity: result.available_capacity || 0,
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
  static findAllWithOlt(filters?: OdcFilters): any[] {
    let query = `
      SELECT 
        odc.*,
        olt.hostname as olt_hostname,
        olt.ip_address as olt_ip_address
      FROM odc_inventory odc
      LEFT JOIN olt_inventory olt ON odc.olt_id = olt.id
      WHERE 1=1
    `;
    const params: any[] = [];

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

    return db.prepare(query).all(...params);
  }
}

// Made with Bob
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
    const params: any[] = [];

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
    const values: any[] = [];

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
    const params: any[] = [];

    if (filters?.area) {
      query += ' AND area = ?';
      params.push(filters.area);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const result = db.prepare(query).get(...params) as any;

    const totalPorts = result.total_ports || 0;
    const usedPorts = result.used_ports || 0;
    const utilizationPercentage = totalPorts > 0 ? (usedPorts / totalPorts) * 100 : 0;

    return {
      total_devices: result.total_devices || 0,
      active_devices: result.active_devices || 0,
      total_ports: totalPorts,
      used_ports: usedPorts,
      available_ports: result.available_ports || 0,
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
import { db, Project } from '../lib/db';

// Repository for Project entities
export class ProjectRepository {
  // Find project by UID (id_ihld::batch_program)
  static findByUid(uid: string): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE uid = ?').get(uid) as Project | undefined;
  }

  // Get all projects for region
  static findAllByRegion(region: string = 'SUMBAGTENG'): Project[] {
    return db.prepare('SELECT * FROM projects WHERE region = ? ORDER BY last_changed_at DESC').all(region) as Project[];
  }

  // Get project names and IDs for select inputs
  static getForSelect(): { nama_lop: string; id_ihld: string }[] {
    return db.prepare(`
      SELECT DISTINCT nama_lop, id_ihld 
      FROM projects 
      WHERE nama_lop IS NOT NULL AND nama_lop != '' 
      ORDER BY nama_lop ASC
    `).all() as { nama_lop: string; id_ihld: string }[];
  }

  // Insert or update project with history tracking
  static upsert(data: {
    uid: string;
    id_ihld: string;
    batch_program: string;
    nama_lop: string;
    region: string;
    status: string;
    sub_status: string;
    full_data: string;
    history: string;
  }) {
    const stmt = db.prepare(`
      INSERT INTO projects (
        uid, id_ihld, batch_program, nama_lop, region, status, sub_status, full_data, last_changed_at, history
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(uid) DO UPDATE SET
        id_ihld = excluded.id_ihld,
        batch_program = excluded.batch_program,
        nama_lop = excluded.nama_lop,
        region = excluded.region,
        status = excluded.status,
        sub_status = excluded.sub_status,
        full_data = excluded.full_data,
        last_changed_at = CASE 
          WHEN projects.sub_status != excluded.sub_status OR projects.status != excluded.status 
          THEN CURRENT_TIMESTAMP 
          ELSE projects.last_changed_at 
        END,
        history = excluded.history
    `);

    return stmt.run(
      data.uid,
      data.id_ihld,
      data.batch_program,
      data.nama_lop,
      data.region,
      data.status,
      data.sub_status,
      data.full_data,
      data.history
    );
  }
}
import { db }, { SyncLog } from '../lib/db';
import { randomUUID } from 'crypto';

export class SyncLogRepository {
  static create(data: {
    sync_type: string;
    status: string;
    started_at: string;
    details?: string;
  }): string {
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO sync_logs (id, sync_type, status, started_at, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.sync_type, data.status, data.started_at, data.details || '{}');
    return id;
  }

  static update(id: string, data: {
    status?: string;
    completed_at?: string;
    records_processed?: number;
    records_created?: number;
    records_updated?: number;
    records_failed?: number;
    error_message?: string;
    details?: string;
  }) {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (sets.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE sync_logs SET ${sets.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static findLatest(sync_type?: string): SyncLog | undefined {
    if (sync_type) {
      return db.prepare('SELECT * FROM sync_logs WHERE sync_type = ? ORDER BY started_at DESC LIMIT 1').get(sync_type) as SyncLog | undefined;
    }
    return db.prepare('SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1').get() as SyncLog | undefined;
  }

  static findAll(limit: number = 50): SyncLog[] {
    return db.prepare('SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT ?').all(limit) as SyncLog[];
  }
}
import { db } from '../lib/db';

export interface UT {
  id: string;
  nama_lop: string;
  id_ihld: string;
  witel: string;
  tematik: string;
  sto: string;
  tim_ut: string;
  commtest_ut: string;
  jumlah_odp: number;
  jumlah_port: number;
  tanggal_ct_ut: string;
  temuan: string;
  follow_up_mitra: number;
  mitra: string;
  jumlah_temuan: number;
  wa_spang: string;
  komitmen_penyelesaian: string;
  created_at: string;
  updated_at: string;
}

export interface BoqUt {
  id: string;
  ut_id: string;
  nama_lop: string;
  id_ihld: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Uji Terima (UT) records
export class UtRepository {
  // Get all UT records
  static findAll(): UT[] {
    return db.prepare('SELECT * FROM ut ORDER BY created_at DESC').all() as UT[];
  }

  // Find UT by ID
  static findById(id: string): UT | undefined {
    return db.prepare('SELECT * FROM ut WHERE id = ?').get(id) as UT | undefined;
  }

  // Delete UT by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM ut WHERE id = ?').run(id);
  }

  // Insert or update UT
  static upsert(data: Omit<UT, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO ut (
        id, nama_lop, id_ihld, witel, tematik, sto, tim_ut, commtest_ut,
        jumlah_odp, jumlah_port, tanggal_ct_ut, temuan, follow_up_mitra,
        mitra, jumlah_temuan, wa_spang, komitmen_penyelesaian, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        witel = excluded.witel,
        tematik = excluded.tematik,
        sto = excluded.sto,
        tim_ut = excluded.tim_ut,
        commtest_ut = excluded.commtest_ut,
        jumlah_odp = excluded.jumlah_odp,
        jumlah_port = excluded.jumlah_port,
        tanggal_ct_ut = excluded.tanggal_ct_ut,
        temuan = excluded.temuan,
        follow_up_mitra = excluded.follow_up_mitra,
        mitra = excluded.mitra,
        jumlah_temuan = excluded.jumlah_temuan,
        wa_spang = excluded.wa_spang,
        komitmen_penyelesaian = excluded.komitmen_penyelesaian,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.witel,
      data.tematik,
      data.sto,
      data.tim_ut,
      data.commtest_ut,
      data.jumlah_odp,
      data.jumlah_port,
      data.tanggal_ct_ut,
      data.temuan,
      data.follow_up_mitra,
      data.mitra,
      data.jumlah_temuan,
      data.wa_spang,
      data.komitmen_penyelesaian
    );
  }

  // Get BoQ data for UT
  static getBoq(utId: string): BoqUt | undefined {
    return db.prepare('SELECT * FROM boq_ut WHERE ut_id = ?').get(utId) as BoqUt | undefined;
  }

  // Insert or update BoQ for UT
  static upsertBoq(data: {
    id: string;
    ut_id: string;
    nama_lop: string;
    id_ihld: string;
    full_data: string;
  }) {
    const stmt = db.prepare(`
      INSERT INTO boq_ut (
        id, ut_id, nama_lop, id_ihld, full_data, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        ut_id = excluded.ut_id,
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        full_data = excluded.full_data,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.ut_id,
      data.nama_lop,
      data.id_ihld,
      data.full_data
    );
  }

  // Delete BoQ records for UT
  static deleteBoqByUtId(utId: string) {
    return db.prepare('DELETE FROM boq_ut WHERE ut_id = ?').run(utId);
  }
}
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
    const params: any[] = [];

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
    const values: any[] = [];

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
    `).get(id) as any;

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
    `).get() as any;

    return {
      total_vendors: result.total_vendors || 0,
      active_vendors: result.active_vendors || 0,
      inactive_vendors: result.inactive_vendors || 0,
      average_rating: Math.round((result.average_rating || 0) * 100) / 100,
      total_contract_value: result.total_contract_value || 0,
    };
  }
}

// Made with Bob
