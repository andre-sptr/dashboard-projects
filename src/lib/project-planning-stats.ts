import type { Project, ProjectType } from '@/types/database';
import { parseExcelDate } from '@/utils/date';
import { getFullDataArray } from '@/utils/project';
import { getProjectConfig } from './project-config';

export interface PlanningChartEntry {
  monthKey: string;
  name: string;
  plannedRows: number;
  actualRows: number;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });
}

function incrementMonth(
  map: Map<string, PlanningChartEntry>,
  date: Date,
  key: 'plannedRows' | 'actualRows'
) {
  const month = startOfMonth(date);
  const monthKey = getMonthKey(month);
  const entry = map.get(monthKey) ?? {
    monthKey,
    name: getMonthLabel(month),
    plannedRows: 0,
    actualRows: 0,
  };
  entry[key] += 1;
  map.set(monthKey, entry);
}

export function buildPlanningChartData(
  projects: Project[],
  projectType: ProjectType
): PlanningChartEntry[] {
  const dashboard = getProjectConfig(projectType).dashboard;
  if (
    dashboard.planningTargetColIndex === undefined ||
    dashboard.planningActualColIndex === undefined
  ) {
    return [];
  }

  const map = new Map<string, PlanningChartEntry>();

  for (const project of projects) {
    const fullData = getFullDataArray(project);
    const plannedDate = parseExcelDate(fullData[dashboard.planningTargetColIndex]);
    const actualDate = parseExcelDate(fullData[dashboard.planningActualColIndex]);

    if (plannedDate) incrementMonth(map, plannedDate, 'plannedRows');
    if (actualDate) incrementMonth(map, actualDate, 'actualRows');
  }

  const existing = Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  if (existing.length <= 1) return existing;

  const first = existing[0];
  const last = existing[existing.length - 1];
  const [firstYear, firstMonth] = first.monthKey.split('-').map(Number);
  const [lastYear, lastMonth] = last.monthKey.split('-').map(Number);
  const start = new Date(firstYear, firstMonth - 1, 1);
  const end = new Date(lastYear, lastMonth - 1, 1);
  const filled: PlanningChartEntry[] = [];

  for (let cursor = start; cursor <= end; cursor = addMonths(cursor, 1)) {
    const monthKey = getMonthKey(cursor);
    filled.push(map.get(monthKey) ?? {
      monthKey,
      name: getMonthLabel(cursor),
      plannedRows: 0,
      actualRows: 0,
    });
  }

  return filled;
}
