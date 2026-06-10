import type { Project } from '@/types/database';

export interface RiskyProjectDTO {
  uid: string;
  nama_lop: string;
  branch: string;
  status: string;
  risk_level: 'KRITIS' | 'PERHATIAN';
  days_since_changed: number;
  golive_target: string | null;
}

export interface BranchRankingEntry {
  name: string;
  planned: number;
  actual: number;
  achievement: number;
  statusCounts: Record<string, number>;
}

export interface GoliveTimelineDayEntry {
  name: string;
  day: number;
  dateKey: string;
  onTimePorts: number;
  pendingPorts: number;
  latePorts: number;
  totalPorts: number;
}

export interface GoliveTimelineEntry {
  name: string;
  year: number;
  month: number;
  monthKey: string;
  onTimePorts: number;
  pendingPorts: number;
  latePorts: number;
  totalPorts: number;
  days: GoliveTimelineDayEntry[];
}

export interface DashboardStats {
  total: number;
  totalPorts: number;
  donePorts: number;
  progressPorts: number;
  cancelledPorts: number;
  otherPorts: number;
  statusList: { name: string; count: number }[];
  overallAchiev: number;
  totalGolivePorts: number;
  goliveMonthList: GoliveTimelineEntry[];
  branchGoliveData: { name: string; done: number; achiev: number }[];
  branchRankingData: BranchRankingEntry[];
  recent: Project[];
}
