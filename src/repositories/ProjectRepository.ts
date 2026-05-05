import db, { Project } from '../lib/db';

/**
 * Repository for managing Project entities in the database
 */
export class ProjectRepository {
  /**
   * Find a project by its unique identifier (UID)
   * @param uid - The unique identifier of the project (id_ihld::batch_program)
   * @returns The project or undefined if not found
   */
  static findByUid(uid: string): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE uid = ?').get(uid) as Project | undefined;
  }

  /**
   * Get all projects for a specific region
   * @param region - The region to filter by (e.g., 'SUMBAGTENG')
   * @returns Array of projects
   */
  static findAllByRegion(region: string = 'SUMBAGTENG'): Project[] {
    return db.prepare('SELECT * FROM projects WHERE region = ? ORDER BY last_changed_at DESC').all(region) as Project[];
  }

  /**
   * Get a list of project names and IDs for selection inputs
   * @returns Array of project identifier objects
   */
  static getForSelect(): { nama_lop: string; id_ihld: string }[] {
    return db.prepare(`
      SELECT DISTINCT nama_lop, id_ihld 
      FROM projects 
      WHERE nama_lop IS NOT NULL AND nama_lop != '' 
      ORDER BY nama_lop ASC
    `).all() as { nama_lop: string; id_ihld: string }[];
  }

  /**
   * Insert or update a project record
   * @param data - Project data to upsert
   */
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
