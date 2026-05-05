'use client';

import React, { useMemo, useState } from 'react';
import { Project } from '@/lib/db';
import { parseExcelDate, getFullDataArray } from '@/utils/project';
import dynamic from 'next/dynamic';
import { ReportFilters, Granularity } from './ReportFilters';
import { ReportKpiGrid } from './ReportKpiGrid';

// Dynamically import heavy chart components
const PerformanceCharts = dynamic(() => import('./PerformanceCharts').then(mod => mod.PerformanceCharts), {
  loading: () => <div className="h-[400px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const BranchRanking = dynamic(() => import('./BranchRanking').then(mod => mod.BranchRanking), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

interface Props {
  initialProjects: Project[];
}

export default function ReportClient({ initialProjects }: Props) {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const areaBranchMap: Record<string, string[]> = {
    'RIDAR': ['DUMAI', 'PEKANBARU'],
    'RIKEP': ['BATAM'],
    'SUMBAR': ['BUKIT TINGGI', 'PADANG']
  };

  React.useEffect(() => {
    if (areaFilter && branchFilter) {
      const mappedBranches = areaBranchMap[areaFilter.toUpperCase()];
      if (mappedBranches && !mappedBranches.includes(branchFilter.toUpperCase())) {
        setBranchFilter('');
      }
    }
  }, [areaFilter]);

  const stats = useMemo(() => {
    const projects = initialProjects.filter(p => {
      const fd = getFullDataArray(p);
      const matchesArea = !areaFilter || fd[4] === areaFilter;
      const matchesBranch = !branchFilter || fd[7] === branchFilter;
      return matchesArea && matchesBranch;
    });

    let totalPlannedPorts = 0;
    let totalRealizedPorts = 0;
    let totalLeadTimeDays = 0;
    let lateProjects = 0;
    let onTimeProjects = 0;

    const timeSeriesMap = new Map<string, { name: string; actual: number; planned: number; timestamp: number }>();
    const branchMap = new Map<string, { name: string; planned: number; actual: number }>();

    projects.forEach(p => {
      const fd = getFullDataArray(p);

      const planPort = Number(fd[10]) || 0;
      const realPort = Number(fd[29]) || 0;
      const goliveDate = parseExcelDate(fd[30]);

      let targetDate = parseExcelDate(fd[18]);
      if (!targetDate) targetDate = parseExcelDate(fd[17]);

      const branch = String(fd[7] || 'UNKNOWN').toUpperCase();

      totalPlannedPorts += planPort;
      totalRealizedPorts += realPort;

      const bData = branchMap.get(branch) || { name: branch, planned: 0, actual: 0 };
      bData.planned += planPort;
      bData.actual += realPort;
      branchMap.set(branch, bData);

      if (goliveDate) {
        if (targetDate) {
          if (goliveDate <= targetDate) {
            onTimeProjects++;
          } else {
            lateProjects++;
            const diffDays = Math.ceil((goliveDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
            totalLeadTimeDays += diffDays;
          }
        }

        let key = '';
        let label = '';
        const d = goliveDate;

        if (granularity === 'daily') {
          key = d.toISOString().split('T')[0];
          label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        } else if (granularity === 'weekly') {
          const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
          const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${d.getFullYear()}-W${weekNum}`;
          label = `W${weekNum} ${d.getFullYear()}`;
        } else if (granularity === 'monthly') {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        } else {
          key = `${d.getFullYear()}`;
          label = `${d.getFullYear()}`;
        }

        const existing = timeSeriesMap.get(key) || { name: label, actual: 0, planned: 0, timestamp: d.getTime() };
        existing.actual += realPort;
        existing.planned += planPort;
        timeSeriesMap.set(key, existing);
      }
    });

    const avgDelayDays = lateProjects > 0 ? Math.round(totalLeadTimeDays / lateProjects) : 0;
    const trendData = Array.from(timeSeriesMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    let cumulative = 0;
    const velocityTrend = trendData.map(d => {
      cumulative += d.actual;
      return { ...d, cumulative };
    });

    const branchData = Array.from(branchMap.values())
      .map(b => ({
        ...b,
        achievement: b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0
      }))
      .sort((a, b) => b.achievement - a.achievement);

    const slaData = [
      { name: 'On Time', value: onTimeProjects, color: '#10b981' },
      { name: 'Late', value: lateProjects, color: '#ef4444' }
    ];

    return {
      totalPlannedPorts,
      totalRealizedPorts,
      achievementRate: totalPlannedPorts > 0 ? Math.round((totalRealizedPorts / totalPlannedPorts) * 100) : 0,
      slaRate: (onTimeProjects + lateProjects) > 0 ? Math.round((onTimeProjects / (onTimeProjects + lateProjects)) * 100) : 0,
      avgDelayDays,
      velocityTrend,
      trendData,
      branchData,
      slaData,
      onTimeProjects,
      lateProjects
    };
  }, [initialProjects, granularity, areaFilter, branchFilter]);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 font-bold text-sm">
        Memuat grafik laporan...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Filters */}
      <ReportFilters
        granularity={granularity}
        setGranularity={setGranularity}
        areaFilter={areaFilter}
        setAreaFilter={setAreaFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        areaBranchMap={areaBranchMap}
      />

      {/* KPI Cards */}
      <ReportKpiGrid stats={stats} />

      {/* Main Charts Row */}
      <PerformanceCharts
        velocityTrend={stats.velocityTrend}
        slaData={stats.slaData}
        onTimeProjects={stats.onTimeProjects}
        lateProjects={stats.lateProjects}
        avgDelayDays={stats.avgDelayDays}
        slaRate={stats.slaRate}
        trendData={stats.trendData}
        granularity={granularity}
      />

      {/* Branch Table */}
      <BranchRanking branchData={stats.branchData} />
    </div>
  );
}
