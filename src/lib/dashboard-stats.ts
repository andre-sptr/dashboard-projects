// Shared dashboard statistics builders (client + server safe).
import type { Project } from '@/types/database';
import type { DashboardStats, RiskyProjectDTO } from '@/types/dashboard';
import {
  classifyStatus,
  formatExcelDateShort,
  getFullDataArray,
  parseExcelDate,
  parseNumber,
} from '@/utils/project';
import { computeProjectRisk, getDaysSinceChanged } from '@/lib/risk-criteria';
import { DEFAULT_COLUMN_MAP, type ColumnMap } from '@/lib/sheet-columns';

export const STATUS_COLS = [
  '0. DROP', '1. AANWIJZING', '2. DONE AANWIJZING', '3. PERIZINAN',
  '4. MATDEL', '5. INSTALASI', '6. FINISH INSTALASI', '7. GOLIVE', '8. UJI TERIMA',
] as const;

// Komitmen golive date (target) used for the month/year filter.
export function getKomitmenGoliveDate(project: Project, colMap: ColumnMap = DEFAULT_COLUMN_MAP): Date | null {
  const fullData = getFullDataArray(project);
  return parseExcelDate(fullData[colMap.KOMITMEN_GOLIVE]);
}

function getMappedString(fullData: unknown[], index: number, fallback = ''): string {
  const value = fullData[index];
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function getDashboardProject(project: Project, colMap: ColumnMap, fullData: unknown[]): Project {
  return {
    ...project,
    status: getMappedString(fullData, colMap.STATUS, project.status),
    sub_status: getMappedString(fullData, colMap.SUB_STATUS_KONS, project.sub_status),
    area: getMappedString(fullData, colMap.AREA, project.area),
    branch: getMappedString(fullData, colMap.BRANCH_FMC, project.branch),
    mitra: getMappedString(fullData, colMap.MITRA, project.mitra),
    sto: getMappedString(fullData, colMap.STO, project.sto),
    port_planned: parseNumber(fullData[colMap.PORT_PLAN]),
    port_realized: parseNumber(fullData[colMap.REAL_JML_PORT_GOLIVE]),
    golive_target: getMappedString(fullData, colMap.KOMITMEN_GOLIVE, project.golive_target ?? '') || null,
    golive_actual: getMappedString(fullData, colMap.TANGGAL_GOLIVE, project.golive_actual ?? '') || null,
  };
}

// Achiev per distrik = (port 7.GOLIVE + 8.UJI TERIMA) / total port status 1..8 * 100 (0.DROP tidak dihitung)
function computeStatusAchiev(sc: Record<string, number>): number {
  const golive = (sc['7. GOLIVE'] || 0) + (sc['8. UJI TERIMA'] || 0);
  const total = STATUS_COLS
    .filter(s => s !== '0. DROP')
    .reduce((sum, s) => sum + (sc[s] || 0), 0);
  return total > 0 ? Math.round((golive / total) * 10000) / 100 : 0;
}

export function buildDashboardStats(projects: Project[], colMap: ColumnMap = DEFAULT_COLUMN_MAP): DashboardStats {
  let totalPorts = 0;
  let donePorts = 0;
  let progressPorts = 0;
  let cancelledPorts = 0;
  let otherPorts = 0;

  const statusMap = new Map<string, number>();
  const goliveMonthMap = new Map<string, number>();
  const branchRankingMap = new Map<string, { planned: number; actual: number; statusCounts: Record<string, number> }>();
  const globalStatusCounts: Record<string, number> = Object.fromEntries(STATUS_COLS.map(s => [s, 0]));
  let totalGolivePorts = 0;

  for (const project of projects) {
    const fullData = getFullDataArray(project);
    const mappedProject = getDashboardProject(project, colMap, fullData);
    const ports = parseNumber(fullData[colMap.PORT_PLAN]);
    const bucket = classifyStatus(mappedProject.status);

    totalPorts += ports;
    if (bucket === 'done') donePorts += ports;
    else if (bucket === 'progress') progressPorts += ports;
    else if (bucket === 'cancelled') cancelledPorts += ports;
    else otherPorts += ports;

    const status = mappedProject.status || '-';
    statusMap.set(status, (statusMap.get(status) || 0) + ports);

    // Timeline grouped by actual Tanggal Golive (kolom AF) month — based purely on
    // whether a golive date exists, regardless of status.
    const goliveStr = formatExcelDateShort(fullData[colMap.TANGGAL_GOLIVE]);
    if (goliveStr) {
      totalGolivePorts += ports;
      goliveMonthMap.set(goliveStr, (goliveMonthMap.get(goliveStr) || 0) + ports);
    }

    const branch = (mappedProject.branch || 'UNKNOWN').toUpperCase();

    const planPort = mappedProject.port_planned || 0;
    const realPort = mappedProject.port_realized || 0;
    const rankEntry = branchRankingMap.get(branch) || {
      planned: 0, actual: 0,
      statusCounts: Object.fromEntries(STATUS_COLS.map(s => [s, 0])),
    };
    rankEntry.planned += planPort;
    rankEntry.actual += realPort;
    const normalizedStatus = (mappedProject.status || '').trim();
    if ((STATUS_COLS as readonly string[]).includes(normalizedStatus)) {
      rankEntry.statusCounts[normalizedStatus] = (rankEntry.statusCounts[normalizedStatus] || 0) + planPort;
      globalStatusCounts[normalizedStatus] = (globalStatusCounts[normalizedStatus] || 0) + planPort;
    }
    branchRankingMap.set(branch, rankEntry);
  }

  const goliveMonthList: { name: string; count: number }[] = [];
  const parsedMonths = Array.from(goliveMonthMap.keys())
    .map((label) => {
      const parts = label.split(' ');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
      return { label, year: parseInt(parts[1]), month: monthIndex % 12 };
    })
    .filter(m => !isNaN(m.year) && m.year >= 1900 && m.year <= 2100 && m.month >= 0);

  if (parsedMonths.length > 0) {
    const minYear = Math.min(...parsedMonths.map(m => m.year));
    const maxYear = Math.max(...parsedMonths.map(m => m.year));
    const minMonth = Math.min(...parsedMonths.filter(m => m.year === minYear).map(m => m.month));
    const maxMonth = Math.max(...parsedMonths.filter(m => m.year === maxYear).map(m => m.month));

    for (let year = minYear; year <= maxYear; year++) {
      const startMonth = year === minYear ? minMonth : 0;
      const endMonth = year === maxYear ? maxMonth : 11;
      for (let month = startMonth; month <= endMonth; month++) {
        const date = new Date(year, month, 1);
        const label = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        goliveMonthList.push({ name: label, count: goliveMonthMap.get(label) || 0 });
      }
    }
  }

  const recent = [...projects]
    .sort((a, b) => getDaysSinceChanged(a) - getDaysSinceChanged(b))
    .slice(0, 5)
    .map((project) => {
      const fullData = getFullDataArray(project);
      const mappedProject = getDashboardProject(project, colMap, fullData);
      return {
        uid: project.uid,
        id_ihld: project.id_ihld,
        batch_program: '',
        nama_lop: project.nama_lop,
        region: '',
        status: mappedProject.status,
        sub_status: mappedProject.sub_status,
        full_data: '[]',
        last_changed_at: project.last_changed_at,
        history: '[]',
        area: '',
        branch: mappedProject.branch,
        mitra: '',
        sto: '',
        odp_planned: 0,
        port_planned: mappedProject.port_planned,
        port_realized: mappedProject.port_realized,
        golive_target: mappedProject.golive_target,
        golive_actual: mappedProject.golive_actual,
      };
    });

  return {
    total: projects.length,
    totalPorts,
    donePorts,
    progressPorts,
    cancelledPorts,
    otherPorts,
    statusList: Array.from(statusMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const aNum = parseFloat(a.name) || 0;
        const bNum = parseFloat(b.name) || 0;
        return bNum - aNum;
      }),
    overallAchiev: computeStatusAchiev(globalStatusCounts),
    totalGolivePorts,
    goliveMonthList,
    branchGoliveData: Array.from(branchRankingMap.entries())
      .map(([name, value]) => ({
        name,
        done: (value.statusCounts['7. GOLIVE'] || 0) + (value.statusCounts['8. UJI TERIMA'] || 0),
        achiev: computeStatusAchiev(value.statusCounts),
      }))
      .sort((a, b) => b.achiev - a.achiev),
    branchRankingData: Array.from(branchRankingMap.entries())
      .map(([name, value]) => ({
        name,
        planned: value.planned,
        actual: value.actual,
        achievement: computeStatusAchiev(value.statusCounts),
        statusCounts: value.statusCounts,
      }))
      .sort((a, b) => b.achievement - a.achievement),
    recent,
  };
}

export function buildRiskyProjects(projects: Project[], colMap: ColumnMap = DEFAULT_COLUMN_MAP): RiskyProjectDTO[] {
  const result: RiskyProjectDTO[] = [];
  for (const project of projects) {
    const fullData = getFullDataArray(project);
    const mappedProject = getDashboardProject(project, colMap, fullData);
    const risk = computeProjectRisk(mappedProject);
    if (risk === 'AMAN') continue;
    result.push({
      uid: mappedProject.uid,
      nama_lop: mappedProject.nama_lop,
      branch: mappedProject.branch,
      status: mappedProject.status,
      risk_level: risk,
      days_since_changed: getDaysSinceChanged(mappedProject),
      golive_target: mappedProject.golive_target,
    });
  }
  return result;
}
