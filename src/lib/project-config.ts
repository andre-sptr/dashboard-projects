import {
  COLUMN_FIELDS,
  DEFAULT_COLUMN_MAP,
  type ColKey,
  type ColumnConfigEntry,
  type ColumnMap,
} from '@/lib/sheet-columns';
import type { ProjectType } from '@/types/database';

export interface ProjectDashboardConfig {
  searchPlaceholder: string;
  showAreaBranchFilters: boolean;
  areaLabel: string;
  branchLabel: string;
  tematikColIndex?: number;
  tematikLabel?: string;
  dateFilterColIndex?: number;
  planningTargetColIndex?: number;
  planningActualColIndex?: number;
}

export interface ProjectConfig {
  type: ProjectType;
  label: string;
  gid: string;
  dataStartRow: number;
  fieldMap: ColumnMap;
  columnLabels: Partial<Record<ColKey, string>>;
  columnHeaders: Partial<Record<ColKey, string>>;
  uidFields: ColKey[];
  rowFilter: 'SUMBAGTENG_REGION_FMC' | 'NON_EMPTY_ID';
  enforceGoliveDeadline: boolean;
  dashboard: ProjectDashboardConfig;
}

function withMap(overrides: Partial<ColumnMap>): ColumnMap {
  return { ...DEFAULT_COLUMN_MAP, ...overrides };
}

const JPP_CONFIG: ProjectConfig = {
  type: 'JPP',
  label: 'JPP',
  gid: '0',
  dataStartRow: 2,
  fieldMap: DEFAULT_COLUMN_MAP,
  columnLabels: {},
  columnHeaders: {},
  uidFields: ['ID_IHLD', 'BATCH_PROGRAM'],
  rowFilter: 'SUMBAGTENG_REGION_FMC',
  enforceGoliveDeadline: true,
  dashboard: {
    searchPlaceholder: 'Cari ID IHLD, Nama LOP, Status...',
    showAreaBranchFilters: true,
    areaLabel: 'Area',
    branchLabel: 'Branch',
  },
};

const NODEB_FIELD_MAP = withMap({
  TAHUN: 12,
  ID_IHLD: 4,
  NAMA_LOP: 5,
  REGIONAL: 1,
  AREA: 2,
  STO: 3,
  REGION_FMC: 1,
  BRANCH_FMC: 2,
  BATCH_PROGRAM: 20,
  ODP_PLAN: 42,
  PORT_PLAN: 44,
  CPP: 18,
  BOQ: 22,
  MITRA: 13,
  STATUS: 26,
  SUB_STATUS_KONS: 27,
  DETAIL_STATUS: 28,
  KOMITMEN_GOLIVE: 36,
  TARGET_GOLIVE_APRIL: 31,
  PRIORITAS_1_TSEL: 39,
  PID_PROACTIVE: 0,
  KET: 29,
  WASPANG: 52,
  PROJECT_ADMIN: 57,
  STATUS_GOLIVE: 25,
  KENDALA_GOLIVE: 33,
  PROGRES_MINOL: 50,
  REAL_JML_ODP_8: 45,
  REAL_JML_ODP_16: 46,
  ID_SW_ABD: 48,
  REAL_JML_PORT_GOLIVE: 47,
  TANGGAL_GOLIVE: 30,
  NILAI_PRELIM: 21,
  NILAI_BOQ_QE: 22,
  BOQ_AANWIJZING: 23,
  ODP_AANWIJZING: 35,
});

const NODEB_CONFIG: ProjectConfig = {
  type: 'NODEB',
  label: 'NodeB',
  gid: '1703451476',
  dataStartRow: 2,
  fieldMap: NODEB_FIELD_MAP,
  columnLabels: {
    TAHUN: 'Tanggal WO',
    ID_IHLD: 'Site ID',
    NAMA_LOP: 'Site Name',
    REGIONAL: 'Region',
    AREA: 'Branch',
    REGION_FMC: 'Region',
    BRANCH_FMC: 'Branch',
    BATCH_PROGRAM: 'Kabel FO DRM',
    ODP_PLAN: 'Target Tiang',
    PORT_PLAN: 'Target FO',
    CPP: 'Nilai Plan',
    BOQ: 'Nilai DRM',
    STATUS: 'Status',
    SUB_STATUS_KONS: 'Sub Status',
    DETAIL_STATUS: 'Detail Progress',
    KOMITMEN_GOLIVE: 'Komitmen OA',
    TARGET_GOLIVE_APRIL: 'SLA HO',
    PRIORITAS_1_TSEL: 'Priority A1',
    PID_PROACTIVE: 'ID',
    KET: 'Remarks',
    WASPANG: 'Waspang',
    PROJECT_ADMIN: 'Tim UT',
    STATUS_GOLIVE: 'Status Tower',
    KENDALA_GOLIVE: 'Cat SLA HO',
    PROGRES_MINOL: 'Progress %',
    REAL_JML_ODP_8: 'Real Tiang',
    REAL_JML_ODP_16: 'Real Galian',
    ID_SW_ABD: 'Evidence',
    REAL_JML_PORT_GOLIVE: 'Real FO',
    TANGGAL_GOLIVE: 'Tanggal OA',
    NILAI_PRELIM: 'Nilai Prelim',
    NILAI_BOQ_QE: 'Nilai DRM',
    BOQ_AANWIJZING: 'Approval',
    ODP_AANWIJZING: 'Cek JPP TIF HO',
  },
  columnHeaders: {
    ID_IHLD: 'SITE ID',
    NAMA_LOP: 'SITE NAME',
    BATCH_PROGRAM: 'KABEL FO DRM',
    KOMITMEN_GOLIVE: 'TGL COMMIT OA FIX',
    TANGGAL_GOLIVE: 'TGL COMMIT OA',
  },
  uidFields: ['ID_IHLD'],
  rowFilter: 'NON_EMPTY_ID',
  enforceGoliveDeadline: false,
  dashboard: {
    searchPlaceholder: 'Cari Site ID, Site Name, Status...',
    showAreaBranchFilters: false,
    areaLabel: 'Branch',
    branchLabel: 'Region',
    tematikColIndex: 34,
    tematikLabel: 'Tematik',
    dateFilterColIndex: 36,
    planningTargetColIndex: 36,
    planningActualColIndex: 30,
  },
};

const HEM_FIELD_MAP = withMap({
  TAHUN: 37,
  ID_IHLD: 3,
  NAMA_LOP: 4,
  REGIONAL: 0,
  AREA: 1,
  STO: 2,
  REGION_FMC: 0,
  BRANCH_FMC: 1,
  BATCH_PROGRAM: 9,
  ODP_PLAN: 28,
  PORT_PLAN: 29,
  CPP: 25,
  BOQ: 13,
  MITRA: 16,
  STATUS: 18,
  SUB_STATUS_KONS: 19,
  DETAIL_STATUS: 21,
  KOMITMEN_GOLIVE: 22,
  TARGET_GOLIVE_APRIL: 38,
  PRIORITAS_1_TSEL: 67,
  PID_PROACTIVE: 41,
  KET: 50,
  WASPANG: 48,
  PROJECT_ADMIN: 49,
  STATUS_GOLIVE: 20,
  KENDALA_GOLIVE: 55,
  PROGRES_MINOL: 18,
  REAL_JML_ODP_8: 30,
  REAL_JML_ODP_16: 28,
  ID_SW_ABD: 41,
  REAL_JML_PORT_GOLIVE: 29,
  TANGGAL_GOLIVE: 32,
  NILAI_PRELIM: 25,
  NILAI_BOQ_QE: 36,
  BOQ_AANWIJZING: 25,
  ODP_AANWIJZING: 28,
});

const HEM_CONFIG: ProjectConfig = {
  type: 'HEM',
  label: 'HEM',
  gid: '1708701845',
  dataStartRow: 2,
  fieldMap: HEM_FIELD_MAP,
  columnLabels: {
    TAHUN: 'Bulan Komitmen',
    ID_IHLD: 'IHLD',
    NAMA_LOP: 'Nama LOP',
    REGIONAL: 'Region',
    AREA: 'District',
    REGION_FMC: 'Region',
    BRANCH_FMC: 'District',
    BATCH_PROGRAM: 'Batch Order',
    ODP_PLAN: 'ODP Real',
    PORT_PLAN: 'Port Real',
    CPP: 'BOQ Aanwijzing',
    BOQ: 'BOQ',
    MITRA: 'Mitra',
    STATUS: 'Progress Lapangan',
    SUB_STATUS_KONS: 'Sub Status',
    DETAIL_STATUS: 'Detail Progres',
    KOMITMEN_GOLIVE: 'Komitmen Golive',
    TARGET_GOLIVE_APRIL: 'Target Golive',
    PRIORITAS_1_TSEL: 'Priority by TIF',
    PID_PROACTIVE: 'No Order',
    KET: 'Catatan Hold',
    WASPANG: 'Tim Waspang',
    PROJECT_ADMIN: 'Tim UT',
    STATUS_GOLIVE: 'Status JT',
    KENDALA_GOLIVE: 'Ket Sumsel',
    PROGRES_MINOL: 'Progress Lapangan',
    REAL_JML_ODP_8: 'ODP Golive',
    REAL_JML_ODP_16: 'ODP Real',
    ID_SW_ABD: 'No Order',
    REAL_JML_PORT_GOLIVE: 'Port Real',
    TANGGAL_GOLIVE: 'Tanggal Golive Real',
    NILAI_PRELIM: 'BOQ Aanwijzing',
    NILAI_BOQ_QE: 'BOQ Bantu',
    BOQ_AANWIJZING: 'BOQ Aanwijzing',
    ODP_AANWIJZING: 'ODP Real',
  },
  columnHeaders: {
    ID_IHLD: 'IHLD',
    DETAIL_STATUS: 'Detail Progres',
    KOMITMEN_GOLIVE: 'Komitmen Golive',
    TANGGAL_GOLIVE: 'Tanggal Golive Real',
  },
  uidFields: ['ID_IHLD'],
  rowFilter: 'NON_EMPTY_ID',
  enforceGoliveDeadline: false,
  dashboard: {
    searchPlaceholder: 'Cari IHLD, Nama LOP, Status...',
    showAreaBranchFilters: false,
    areaLabel: 'District',
    branchLabel: 'Region',
    dateFilterColIndex: 22,
    planningTargetColIndex: 22,
    planningActualColIndex: 32,
  },
};

export const PROJECT_CONFIGS: Record<ProjectType, ProjectConfig> = {
  JPP: JPP_CONFIG,
  NODEB: NODEB_CONFIG,
  HEM: HEM_CONFIG,
};

export function getProjectConfig(projectType: ProjectType): ProjectConfig {
  return PROJECT_CONFIGS[projectType];
}

export function getAllProjectConfigs(): ProjectConfig[] {
  return [JPP_CONFIG, NODEB_CONFIG, HEM_CONFIG];
}

export function getProjectColumnConfig(projectType: ProjectType): ColumnConfigEntry[] {
  const config = getProjectConfig(projectType);

  return COLUMN_FIELDS.map((field, sort_order) => ({
    field_key: field.key,
    label: config.columnLabels[field.key] ?? field.label,
    header_text: config.columnHeaders[field.key] ?? field.headerText,
    col_index: config.fieldMap[field.key],
    sort_order,
  }));
}
