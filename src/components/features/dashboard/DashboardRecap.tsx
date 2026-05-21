// Summary cards for project status counts
'use client';

import {
  Briefcase,
  CheckCircle2,
  Download,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { KpiCard } from '@/components/features/recap/KpiCard';
import { RecentChanges } from '@/components/features/recap/RecentChanges';
import type { Project } from '@/types/database';
import {
  buildDashboardStats,
  buildRiskyProjects,
  getKomitmenGoliveDate,
} from '@/lib/dashboard-stats';
import { DEFAULT_COLUMN_MAP, type ColumnMap } from '@/lib/sheet-columns';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

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
  projects: Project[];
  colMap?: ColumnMap;
}

const now = new Date();

// A month is "future" (and thus not selectable) when, combined with the chosen
// year, it refers to a period that hasn't arrived yet. With year = 'all' every
// month has already occurred in some past year, so nothing is disabled.
function isFutureMonth(monthIndex: number, year: number | 'all'): boolean {
  if (year === 'all') return false;
  if (year > now.getFullYear()) return true;
  if (year < now.getFullYear()) return false;
  return monthIndex > now.getMonth();
}

export default function DashboardRecap({ projects, colMap = DEFAULT_COLUMN_MAP }: Props) {
  const [exporting, setExporting] = useState(false);
  const [year, setYear] = useState<number | 'all'>(now.getFullYear());
  const [month, setMonth] = useState<number | 'all'>(now.getMonth());

  // Distinct komitmen-golive years available in the data (+ current year).
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const p of projects) {
      const d = getKomitmenGoliveDate(p, colMap);
      if (d) set.add(d.getFullYear());
    }
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [projects, colMap]);

  // Filter by komitmen golive (target) date.
  const filtered = useMemo(() => {
    if (year === 'all' && month === 'all') return projects;
    return projects.filter((p) => {
      const d = getKomitmenGoliveDate(p, colMap);
      if (!d) return false;
      if (year !== 'all' && d.getFullYear() !== year) return false;
      if (month !== 'all' && d.getMonth() !== month) return false;
      return true;
    });
  }, [projects, year, month, colMap]);

  const stats = useMemo(() => buildDashboardStats(filtered, colMap), [filtered, colMap]);
  const riskyProjects = useMemo(() => buildRiskyProjects(filtered), [filtered]);

  // Timeline golive per bulan selalu menampilkan seluruh data, tidak terpengaruh filter.
  const allStats = useMemo(() => buildDashboardStats(projects, colMap), [projects, colMap]);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitoring project region Sumbagteng
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Komitmen Golive:
          </span>
          <select
            value={String(month)}
            onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i} disabled={isFutureMonth(i, year)}>{name}</option>
            ))}
          </select>
          <select
            value={String(year)}
            onChange={(e) => {
              const nextYear = e.target.value === 'all' ? 'all' : Number(e.target.value);
              setYear(nextYear);
              if (month !== 'all' && isFutureMonth(month, nextYear)) setMonth('all');
            }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Mengekspor...' : 'Ekspor PDF'}
          </button>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Tidak ada project dengan komitmen golive pada periode ini. Coba ubah filter atau pilih &quot;Semua&quot;.
        </div>
      )}

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
          sub={`${stats.overallAchiev.toFixed(2)}% capaian`}
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
          goliveMonthList={allStats.goliveMonthList}
          totalGolivePorts={allStats.totalGolivePorts}
        />
      </div>

      <div className="animate-in stagger-7">
        <RecentChanges recent={stats.recent} />
      </div>
    </div>
  );
}
