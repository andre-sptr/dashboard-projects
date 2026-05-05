// Grid of KPI cards specifically for report views
import React from 'react';
import { Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  suppressHydrationWarning?: boolean;
}

const KpiCard = ({ icon: Icon, label, value, sub, color, suppressHydrationWarning }: KpiCardProps) => (
  <div className="glass-panel p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white" suppressHydrationWarning={suppressHydrationWarning}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5" suppressHydrationWarning={suppressHydrationWarning}>{sub}</p>}
      </div>
    </div>
  </div>
);

interface ReportKpiGridProps {
  stats: {
    achievementRate: number;
    totalRealizedPorts: number;
    totalPlannedPorts: number;
    slaRate: number;
    onTimeProjects: number;
    lateProjects: number;
  };
}

export const ReportKpiGrid = ({ stats }: ReportKpiGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={Target}
        label="Achievement Rate"
        value={`${stats.achievementRate}%`}
        sub="Realisasi vs Port Plan"
        color="bg-blue-600"
      />
      <KpiCard
        icon={TrendingUp}
        label="Total Realized Ports"
        value={stats.totalRealizedPorts.toLocaleString('id-ID')}
        sub={`Dari ${stats.totalPlannedPorts.toLocaleString('id-ID')} plan`}
        color="bg-emerald-600"
        suppressHydrationWarning
      />
      <KpiCard
        icon={CheckCircle2}
        label="SLA Success Rate"
        value={`${stats.slaRate}%`}
        sub={`${stats.onTimeProjects} Proyek Tepat Waktu`}
        color="bg-indigo-600"
      />
      <KpiCard
        icon={AlertCircle}
        label="Late Golive"
        value={stats.lateProjects}
        sub="Proyek melewati target"
        color="bg-rose-600"
      />
    </div>
  );
};
