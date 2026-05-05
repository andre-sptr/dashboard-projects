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
  formatExcelDateShort
} from '@/utils/project';
import dynamic from 'next/dynamic';
import { KpiCard } from '@/components/features/recap/KpiCard';
import { RecentChanges } from '@/components/features/recap/RecentChanges';

// Dynamically import heavy chart components
const DistributionCharts = dynamic(() => import('@/components/features/recap/DistributionCharts').then(mod => mod.DistributionCharts), {
  loading: () => <div className="h-[350px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const TimelineChart = dynamic(() => import('@/components/features/recap/TimelineChart').then(mod => mod.TimelineChart), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
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
    const subStatusMap = new Map<string, number>();
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

      const sub = p.sub_status || '-';
      subStatusMap.set(sub, (subStatusMap.get(sub) || 0) + ports);

      const goliveStr = formatExcelDateShort(fd[30]);
      if (goliveStr && bucket === 'done') {
        totalGolivePorts += ports;
        goliveMonthMap.set(goliveStr, (goliveMonthMap.get(goliveStr) || 0) + ports);
      }
    }

    const toSortedArr = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const chronologicalGolive: { name: string; count: number }[] = [];

    for (let m = 0; m <= currentMonth; m++) {
      const d = new Date(currentYear, m, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      chronologicalGolive.push({
        name: label,
        count: goliveMonthMap.get(label) || 0
      });
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

    const subStatusList = Array.from(subStatusMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const aNum = parseFloat(a.name);
        const bNum = parseFloat(b.name);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum;
        }
        return b.name.localeCompare(a.name);
      });

    return {
      total: projects.length,
      totalPorts,
      donePorts,
      progressPorts,
      cancelledPorts,
      otherPorts,
      statusList: toSortedArr(statusMap),
      subStatusList: subStatusList,
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
          subStatusList={stats.subStatusList} 
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
