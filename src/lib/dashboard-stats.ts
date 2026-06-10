// Shared dashboard statistics builders (client + server safe).
import type { Project } from '@/types/database';
import type { DashboardStats, GoliveTimelineEntry, RiskyProjectDTO } from '@/types/dashboard';
import {
  classifyStatus,
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

interface DashboardStatsOptions {
  today?: Date;
}

type GoliveTimelineBucket =
  | 'onTimePorts'
  | 'pendingPorts'
  | 'uncommittedPorts'
  | 'latePorts';

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
    branch: getMappedString(fullData, colMap.BRANCH_FMC, project.branch),
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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getDateKey(year: number, month: number, day: number): string {
  return `${getMonthKey(year, month)}-${String(day).padStart(2, '0')}`;
}

function createTimelineMonth(year: number, month: number): GoliveTimelineEntry {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    name: new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
    year,
    month,
    monthKey: getMonthKey(year, month),
    onTimePorts: 0,
    pendingPorts: 0,
    uncommittedPorts: 0,
    latePorts: 0,
    totalPorts: 0,
    days: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        name: String(day),
        day,
        dateKey: getDateKey(year, month, day),
        onTimePorts: 0,
        pendingPorts: 0,
        uncommittedPorts: 0,
        latePorts: 0,
        totalPorts: 0,
      };
    }),
  };
}

function classifyGoliveTimelineBucket(
  actualDate: Date | null,
  targetDate: Date | null,
  today: Date
): GoliveTimelineBucket | null {
  if (actualDate) {
    if (!targetDate) return 'uncommittedPorts';
    return actualDate.getTime() <= targetDate.getTime() ? 'onTimePorts' : 'latePorts';
  }

  if (!targetDate) return null;
  return targetDate.getTime() >= today.getTime() ? 'pendingPorts' : 'latePorts';
}

function addTimelinePorts(
  entry: GoliveTimelineEntry,
  timelineDate: Date,
  category: GoliveTimelineBucket,
  ports: number
) {
  entry[category] += ports;
  entry.totalPorts += ports;

  const dayEntry = entry.days[timelineDate.getDate() - 1];
  if (!dayEntry) return;
  dayEntry[category] += ports;
  dayEntry.totalPorts += ports;
}

export function buildDashboardStats(
  projects: Project[],
  colMap: ColumnMap = DEFAULT_COLUMN_MAP,
  options: DashboardStatsOptions = {}
): DashboardStats {
  let totalPorts = 0;
  let donePorts = 0;
  let progressPorts = 0;
  let cancelledPorts = 0;
  let otherPorts = 0;

  const statusMap = new Map<string, number>();
  const goliveMonthMap = new Map<string, GoliveTimelineEntry>();
  const branchRankingMap = new Map<string, { planned: number; actual: number; statusCounts: Record<string, number> }>();
  const globalStatusCounts: Record<string, number> = Object.fromEntries(STATUS_COLS.map(s => [s, 0]));
  let totalGolivePorts = 0;
  const today = startOfLocalDay(options.today ?? new Date());

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

    // Completed projects use their actual golive date. Pending projects fall
    // back to their commitment date so they remain visible on the timeline.
    const targetDateRaw = parseExcelDate(mappedProject.golive_target);
    const actualDateRaw = parseExcelDate(mappedProject.golive_actual);
    const targetDate = targetDateRaw ? startOfLocalDay(targetDateRaw) : null;
    const actualDate = actualDateRaw ? startOfLocalDay(actualDateRaw) : null;
    const timelineDate = actualDate ?? targetDate;
    const category = classifyGoliveTimelineBucket(actualDate, targetDate, today);

    if (timelineDate && category) {
      const monthKey = getMonthKey(timelineDate.getFullYear(), timelineDate.getMonth());
      const entry = goliveMonthMap.get(monthKey)
        ?? createTimelineMonth(timelineDate.getFullYear(), timelineDate.getMonth());

      totalGolivePorts += ports;
      addTimelinePorts(entry, timelineDate, category, ports);
      goliveMonthMap.set(monthKey, entry);
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

  const goliveMonthList: GoliveTimelineEntry[] = [];
  const parsedMonths = Array.from(goliveMonthMap.values())
    .map((entry) => ({ year: entry.year, month: entry.month }))
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
        const monthKey = getMonthKey(date.getFullYear(), date.getMonth());
        goliveMonthList.push(
          goliveMonthMap.get(monthKey) ?? createTimelineMonth(date.getFullYear(), date.getMonth())
        );
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
