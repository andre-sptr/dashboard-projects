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

export interface DashboardStats {
  total: number;
  totalPorts: number;
  donePorts: number;
  progressPorts: number;
  cancelledPorts: number;
  otherPorts: number;
  statusList: { name: string; count: number }[];
  totalGolivePorts: number;
  goliveMonthList: { name: string; count: number }[];
  branchGoliveData: { name: string; done: number; achiev: number }[];
  branchRankingData: BranchRankingEntry[];
  recent: Project[];
}
