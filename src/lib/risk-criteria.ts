import type { Project } from '@/types/database';
import { classifyStatus } from '@/utils/project';
import { parseExcelDate } from '@/utils/date';

export type RiskLevel = 'KRITIS' | 'PERHATIAN' | 'AMAN';

function getStuckDays(): number {
  return Number(process.env.RISK_THRESHOLD_STUCK_DAYS) || 14;
}

function getNearGoliveDays(): number {
  return Number(process.env.RISK_THRESHOLD_NEAR_GOLIVE_DAYS) || 30;
}

function getLowRealizationThreshold(): number {
  return Number(process.env.RISK_THRESHOLD_LOW_REALIZATION) || 0.5;
}

function normalizeTimestamp(ts: string): Date | null {
  if (!ts || ts.trim() === '') return null;
  let dateStr = ts;
  if (!dateStr.includes('T')) dateStr = dateStr.replace(' ', 'T') + 'Z';
  else if (!dateStr.endsWith('Z')) dateStr = dateStr + 'Z';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function computeProjectRisk(project: Project): RiskLevel {
  const bucket = classifyStatus(project.status);
  const isDone = bucket === 'done' || bucket === 'cancelled';
  const today = new Date();
  let criteriaCount = 0;

  // Criterion 1: stuck — last status change > stuck days ago, project still active
  if (!isDone) {
    const lastChanged = normalizeTimestamp(project.last_changed_at);
    if (lastChanged !== null) {
      const diffDays = (today.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > getStuckDays()) criteriaCount++;
    }
  }

  // Criterion 2: overdue — golive_target passed today, project still active
  if (!isDone && project.golive_target) {
    const goliveDate = parseExcelDate(project.golive_target);
    if (goliveDate !== null && goliveDate < today) {
      criteriaCount++;
    }
  }

  // Criterion 3: low realization — < threshold realized with golive within near golive days
  // Guard: skip when port_planned === 0 (not applicable)
  if (!isDone && project.port_planned > 0 && project.golive_target) {
    const realization = project.port_realized / project.port_planned;
    if (realization < getLowRealizationThreshold()) {
      const goliveDate = parseExcelDate(project.golive_target);
      if (goliveDate !== null) {
        const daysToGolive = (goliveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        if (daysToGolive >= 0 && daysToGolive <= getNearGoliveDays()) {
          criteriaCount++;
        }
      }
    }
  }

  if (criteriaCount >= 2) return 'KRITIS';
  if (criteriaCount === 1) return 'PERHATIAN';
  return 'AMAN';
}

export function getDaysSinceChanged(project: Project): number {
  const lastChanged = normalizeTimestamp(project.last_changed_at);
  if (lastChanged === null) return 0;
  return Math.floor((new Date().getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
}
