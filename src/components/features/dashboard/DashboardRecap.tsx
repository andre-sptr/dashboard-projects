// Summary cards for project status counts
'use client';

import {
  Briefcase,
  CheckCircle2,
  Download,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { KpiCard } from '@/components/features/recap/KpiCard';
import { RecentChanges } from '@/components/features/recap/RecentChanges';
import type { DashboardStats, RiskyProjectDTO } from '@/types/dashboard';
import AtRiskPanel from './AtRiskPanel';
import BranchTrafficLight from './BranchTrafficLight';

// Dynamically import heavy chart components
const DistributionCharts = dynamic(() => import('@/components/features/recap/DistributionCharts').then(mod => mod.DistributionCharts), {
  loading: () => <div className="h-87.5 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

const TimelineChart = dynamic(() => import('@/components/features/recap/TimelineChart').then(mod => mod.TimelineChart), {
  loading: () => <div className="h-75 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

const BranchRanking = dynamic(() => import('@/components/features/report/BranchRanking').then(mod => mod.BranchRanking), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false,
});

interface Props {
  stats: DashboardStats;
  riskyProjects: RiskyProjectDTO[];
}

export default function DashboardRecap({ stats, riskyProjects }: Props) {
  const [exporting, setExporting] = useState(false);

  const pieData = [
    { name: 'Done', value: stats.donePorts, color: '#10b981' },
    { name: 'Progress', value: stats.progressPorts, color: '#3b82f6' },
    { name: 'Cancelled', value: stats.cancelledPorts, color: '#ef4444' },
    { name: 'Other', value: stats.otherPorts, color: '#f59e0b' },
  ].filter(d => d.value > 0);
  const { totalPorts } = stats;

  async function handleExportPDF() {
    setExporting(true);
    try {
      const { exportDashboardPDF } = await import('@/lib/export-pdf');
      await exportDashboardPDF(stats, riskyProjects);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitoring project region Sumbagteng
        </p>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 transition-colors"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Mengekspor...' : 'Ekspor PDF'}
        </button>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-in stagger-1">
        <KpiCard
          icon={Briefcase}
          label="Total Port Plan"
          value={totalPorts.toLocaleString('id-ID')}
          accent="bg-blue-600"
          sub={`${stats.total} Projects`}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Done Ports"
          value={stats.donePorts.toLocaleString('id-ID')}
          accent="bg-emerald-600"
          sub={totalPorts ? `${Math.round((stats.donePorts / totalPorts) * 100)}% dari total` : '0%'}
        />
        <KpiCard
          icon={Loader2}
          label="In Progress Ports"
          value={stats.progressPorts.toLocaleString('id-ID')}
          accent="bg-indigo-600"
          sub={totalPorts ? `${Math.round((stats.progressPorts / totalPorts) * 100)}% dari total` : '0%'}
        />
        <KpiCard
          icon={XCircle}
          label="Cancelled Ports"
          value={stats.cancelledPorts.toLocaleString('id-ID')}
          accent="bg-red-600"
          sub={totalPorts ? `${Math.round((stats.cancelledPorts / totalPorts) * 100)}% dari total` : '0%'}
        />
      </section>

      <div className="animate-in stagger-4">
        <DistributionCharts
          pieData={pieData}
          statusList={stats.statusList}
          totalPorts={totalPorts}
          branchGoliveData={stats.branchGoliveData}
        />
      </div>

      <div className="animate-in stagger-5">
        <BranchRanking branchData={stats.branchRankingData} />
      </div>

      <div className="animate-in stagger-6">
        <TimelineChart
          goliveMonthList={stats.goliveMonthList}
          totalGolivePorts={stats.totalGolivePorts}
        />
      </div>

      <div className="animate-in stagger-7">
        <RecentChanges recent={stats.recent} />
      </div>

      <div className="animate-in stagger-3">
        <BranchTrafficLight branchData={stats.branchRankingData} />
      </div>

      <div className="animate-in stagger-2">
        <AtRiskPanel projects={riskyProjects} />
      </div>
    </div>
  );
}
