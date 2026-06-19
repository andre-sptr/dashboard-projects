import { db } from '../lib/db';
import type { Project, ProjectType } from '@/types/database';

// Repository for Project entities
export class ProjectRepository {
  // Find project by UID (id_ihld::batch_program)
  static findByUid(uid: string): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE uid = ?').get(uid) as Project | undefined;
  }

  // Get all projects for region
  static findAllByRegion(region: string = 'SUMBAGTENG'): Project[] {
    return db
      .prepare('SELECT * FROM projects WHERE project_type = ? AND region = ? ORDER BY last_changed_at DESC')
      .all('JPP', region) as Project[];
  }

  static findAllByProjectType(projectType: ProjectType): Project[] {
    return db
      .prepare('SELECT * FROM projects WHERE project_type = ? ORDER BY last_changed_at DESC')
      .all(projectType) as Project[];
  }

  // Find project by id_ihld (returns first match)
  static findByIdIhld(idIhld: string, projectType: ProjectType = 'JPP'): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE project_type = ? AND id_ihld = ? LIMIT 1')
      .get(projectType, idIhld) as Project | undefined;
  }

  // Get project names and IDs for select inputs
  static getForSelect(projectType: ProjectType = 'JPP'): { nama_lop: string; id_ihld: string; area: string; sto: string }[] {
    return db.prepare(`
      SELECT DISTINCT nama_lop, id_ihld, area, sto
      FROM projects 
      WHERE project_type = ? AND nama_lop IS NOT NULL AND nama_lop != ''
      ORDER BY nama_lop ASC
    `).all(projectType) as { nama_lop: string; id_ihld: string; area: string; sto: string }[];
  }

  // Insert or update project with history tracking
  static upsert(data: {
    uid: string;
    project_type?: ProjectType;
    id_ihld: string;
    batch_program: string;
    nama_lop: string;
    region: string;
    status: string;
    sub_status: string;
    full_data: string;
    history: string;
    area: string;
    branch: string;
    mitra: string;
    sto: string;
    odp_planned: number;
    port_planned: number;
    port_realized: number;
    golive_target: string | null;
    golive_actual: string | null;
    golive_target_violated: number;
  }) {
    const stmt = db.prepare(`
      INSERT INTO projects (
        uid, project_type, id_ihld, batch_program, nama_lop, region, status, sub_status,
        full_data, last_changed_at, history,
        area, branch, mitra, sto, odp_planned, port_planned, port_realized,
        golive_target, golive_actual, golive_target_violated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET
        project_type = excluded.project_type,
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
        history = excluded.history,
        area = excluded.area,
        branch = excluded.branch,
        mitra = excluded.mitra,
        sto = excluded.sto,
        odp_planned = excluded.odp_planned,
        port_planned = excluded.port_planned,
        port_realized = excluded.port_realized,
        golive_target = excluded.golive_target,
        golive_actual = excluded.golive_actual,
        golive_target_violated = excluded.golive_target_violated
    `);

    return stmt.run(
      data.uid,
      data.project_type ?? 'JPP',
      data.id_ihld,
      data.batch_program,
      data.nama_lop,
      data.region,
      data.status,
      data.sub_status,
      data.full_data,
      data.history,
      data.area,
      data.branch,
      data.mitra,
      data.sto,
      data.odp_planned,
      data.port_planned,
      data.port_realized,
      data.golive_target,
      data.golive_actual,
      data.golive_target_violated
    );
  }
}
