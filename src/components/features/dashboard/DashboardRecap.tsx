// Summary cards for project status counts
'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/db';
import {
  Briefcase,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  classifyStatus,
  getPortCount,
  getFullDataArray,
  formatExcelDateShort,
  isGoliveTimelineStatus
} from '@/utils/project';
import dynamic from 'next/dynamic';
import { KpiCard } from '@/components/features/recap/KpiCard';
import { RecentChanges } from '@/components/features/recap/RecentChanges';

// Dynamically import heavy chart components
const DistributionCharts = dynamic(() => import('@/components/features/recap/DistributionCharts').then(mod => mod.DistributionCharts), {
  loading: () => <div className="h-87.5 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const TimelineChart = dynamic(() => import('@/components/features/recap/TimelineChart').then(mod => mod.TimelineChart), {
  loading: () => <div className="h-75 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

interface Props {
  projects: Project[];
}

export default function DashboardRecap({ projects }: Props) {
  const stats = useMemo(() => {
    let totalPorts = 0;
    let donePorts = 0;
    let progressPorts = 0;
    let cancelledPorts = 0;
    let otherPorts = 0;

    const statusMap = new Map<string, number>();
    const goliveMonthMap = new Map<string, number>();
    let totalGolivePorts = 0;

    for (const p of projects) {
      const fd = getFullDataArray(p);
      const ports = getPortCount(fd);
      totalPorts += ports;

      const bucket = classifyStatus(p.status);
      if (bucket === 'done') donePorts += ports;
      else if (bucket === 'progress') progressPorts += ports;
      else if (bucket === 'cancelled') cancelledPorts += ports;
      else otherPorts += ports;

      const st = p.status || '-';
      statusMap.set(st, (statusMap.get(st) || 0) + ports);

      const goliveStr = formatExcelDateShort(fd[31]);
      if (goliveStr && isGoliveTimelineStatus(p.status)) {
        totalGolivePorts += ports;
        goliveMonthMap.set(goliveStr, (goliveMonthMap.get(goliveStr) || 0) + ports);
      }
    }

    const chronologicalGolive: { name: string; count: number }[] = [];

    if (goliveMonthMap.size > 0) {
      // Build date range from earliest to latest golive month in the data
      const parsedMonths = Array.from(goliveMonthMap.keys()).map(label => {
        const parts = label.split(' ');
        const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des',
                            'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const mIdx = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
        return { label, year: parseInt(parts[1]), month: mIdx % 12 };
      }).filter(m => !isNaN(m.year) && m.month >= 0);

      if (parsedMonths.length > 0) {
        const minYear = Math.min(...parsedMonths.map(m => m.year));
        const maxYear = Math.max(...parsedMonths.map(m => m.year));
        const minMonth = Math.min(...parsedMonths.filter(m => m.year === minYear).map(m => m.month));
        const maxMonth = Math.max(...parsedMonths.filter(m => m.year === maxYear).map(m => m.month));

        for (let y = minYear; y <= maxYear; y++) {
          const startM = y === minYear ? minMonth : 0;
          const endM = y === maxYear ? maxMonth : 11;
          for (let m = startM; m <= endM; m++) {
            const d = new Date(y, m, 1);
            const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            chronologicalGolive.push({ name: label, count: goliveMonthMap.get(label) || 0 });
          }
        }
      }
    }

    const recent = [...projects]
      .sort(
        (a, b) =>
          new Date(b.last_changed_at).getTime() - new Date(a.last_changed_at).getTime(),
      )
      .slice(0, 5);

    const pieData = [
      { name: 'Done', value: donePorts, color: '#10b981' },
      { name: 'Progress', value: progressPorts, color: '#3b82f6' },
      { name: 'Cancelled', value: cancelledPorts, color: '#ef4444' },
      { name: 'Other', value: otherPorts, color: '#f59e0b' },
    ].filter(d => d.value > 0);

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
      totalGolivePorts,
      goliveMonthList: chronologicalGolive,
      recent,
      pieData,
    };
  }, [projects]);

  const { totalPorts } = stats;

  return (
    <div className="w-full space-y-6">
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

      <div className="animate-in stagger-2">
        <DistributionCharts 
          pieData={stats.pieData} 
          statusList={stats.statusList} 
          totalPorts={totalPorts} 
        />
      </div>

      <div className="animate-in stagger-3">
        <TimelineChart 
          goliveMonthList={stats.goliveMonthList} 
          totalGolivePorts={stats.totalGolivePorts} 
        />
      </div>

      <div className="animate-in stagger-4">
        <RecentChanges recent={stats.recent} />
      </div>
    </div>
  );
}
