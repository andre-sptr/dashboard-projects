import type { ProjectType } from '@/types/database';
import type { ProjectConfig } from './project-config';

export interface ProjectUpsertData {
  uid: string;
  project_type: ProjectType;
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
}

function cell(row: unknown[], index: number): unknown {
  return index >= 0 ? row[index] : undefined;
}

export function cellText(row: unknown[], index: number): string {
  const value = cell(row, index);
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cellNumber(row: unknown[], index: number): number {
  const value = cell(row, index);
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fullData(row: unknown[], config: ProjectConfig): unknown[] {
  const maxIndex = Math.max(...Object.values(config.fieldMap));
  return row.slice(0, maxIndex + 1).map((value) => value ?? '');
}

function composeUid(row: unknown[], config: ProjectConfig): string {
  const parts = config.uidFields.map((key) => cellText(row, config.fieldMap[key]));
  if (config.type === 'JPP') return parts.join('::');
  return `${config.type}::${parts.join('::')}`;
}

export function shouldIncludeSourceRow(row: unknown[], config: ProjectConfig): boolean {
  const id = cellText(row, config.fieldMap.ID_IHLD);
  if (!id) return false;

  if (config.rowFilter === 'SUMBAGTENG_REGION_FMC') {
    return cellText(row, config.fieldMap.REGION_FMC) === 'SUMBAGTENG';
  }

  return true;
}

export function mapSheetRowToProjectData(
  row: unknown[],
  config: ProjectConfig
): ProjectUpsertData | null {
  if (!shouldIncludeSourceRow(row, config)) return null;

  const map = config.fieldMap;
  const isJpp = config.type === 'JPP';

  return {
    uid: composeUid(row, config),
    project_type: config.type,
    id_ihld: cellText(row, map.ID_IHLD),
    batch_program: cellText(row, map.BATCH_PROGRAM),
    nama_lop: cellText(row, map.NAMA_LOP),
    region: cellText(row, map.REGION_FMC) || cellText(row, map.REGIONAL),
    status: cellText(row, map.STATUS),
    sub_status: cellText(row, map.SUB_STATUS_KONS),
    full_data: JSON.stringify(fullData(row, config)),
    history: '[]',
    area: cellText(row, map.AREA),
    branch: cellText(row, map.BRANCH_FMC),
    mitra: cellText(row, map.MITRA),
    sto: cellText(row, map.STO),
    odp_planned: isJpp ? cellNumber(row, map.ODP_PLAN) : 0,
    port_planned: isJpp ? cellNumber(row, map.PORT_PLAN) : 0,
    port_realized: isJpp ? cellNumber(row, map.REAL_JML_PORT_GOLIVE) : 0,
    golive_target: cellText(row, map.KOMITMEN_GOLIVE) || null,
    golive_actual: cellText(row, map.TANGGAL_GOLIVE) || null,
    golive_target_violated: 0,
  };
}
