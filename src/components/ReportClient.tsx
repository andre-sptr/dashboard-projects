'use client';

import React, { useMemo, useState } from 'react';
import { Project } from '@/lib/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  initialProjects: Project[];
}

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '' || String(value).trim() === '#N/A') return null;

  const strVal = String(value).trim().toUpperCase();

  const serial = Number(strVal);
  if (!isNaN(serial) && serial > 1000) {
    return new Date((serial - 25569) * 86400 * 1000);
  }

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIdx = months.indexOf(strVal);
  if (monthIdx !== -1) {
    const now = new Date();
    return new Date(now.getFullYear(), monthIdx, 1);
  }
  if (strVal.includes('/')) {
    const parts = strVal.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) return date;
    }
  }

  const date = new Date(strVal);
  if (!isNaN(date.getTime())) return date;

  return null;
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
      try {
        const fd = JSON.parse(p.full_data || '[]');
        const matchesArea = !areaFilter || fd[4] === areaFilter;
        const matchesBranch = !branchFilter || fd[7] === branchFilter;
        return matchesArea && matchesBranch;
      } catch { return false; }
    });

    let totalPlannedPorts = 0;
    let totalRealizedPorts = 0;
    let totalLeadTimeDays = 0;
    let lateProjects = 0;
    let onTimeProjects = 0;

    const timeSeriesMap = new Map<string, { name: string; actual: number; planned: number; timestamp: number }>();
    const branchMap = new Map<string, { name: string; planned: number; actual: number }>();

    projects.forEach(p => {
      let fd: unknown[] = [];
      try {
        fd = JSON.parse(p.full_data || '[]');
      } catch { }

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
        } else {
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

  const KpiCard = ({ icon: Icon, label, value, sub, color, suppressHydrationWarning }: any) => (
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
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly', 'yearly'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${granularity === g
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {g.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-indigo-600" />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ALL AREAS</option>
              <option value="RIDAR">RIDAR</option>
              <option value="RIKEP">RIKEP</option>
              <option value="SUMBAR">SUMBAR</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="">ALL BRANCH</option>
              {(areaFilter ? areaBranchMap[areaFilter.toUpperCase()] || [] : Object.values(areaBranchMap).flat()).sort().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Production Velocity Trend (Cumulative Ports)
            </h3>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={350} minWidth={1}>
              <AreaChart data={stats.velocityTrend}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => v.toLocaleString('id-ID')}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" name="Cumulative Ports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Distribution Card */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            SLA Adherence
          </h3>
          <div className="flex-1 relative">
            {stats.onTimeProjects + stats.lateProjects > 0 ? (
              <ResponsiveContainer width="100%" height={250} minWidth={1}>
                <PieChart>
                  <Pie
                    data={stats.slaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v} Proyek`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Clock size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No SLA Data Found</p>
                <p className="text-[9px] mt-1 text-center px-4 italic opacity-60">Pastikan "Target Golive" (Index 18) & "Golive Date" (Index 30) terisi di database</p>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Avg. Delay</span>
              <span className="text-sm font-black text-rose-600">{stats.avgDelayDays} Hari</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">On-Time Ratio</span>
              <span className="text-sm font-black text-emerald-600">{stats.slaRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Golive Distribution (Ports per Period)
          </h3>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={350} minWidth={1}>
            <BarChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(v: any) => v.toLocaleString('id-ID')}
              />
              <Bar
                dataKey="actual"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Ports Golive"
                barSize={granularity === 'daily' ? 10 : granularity === 'weekly' ? 20 : 40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Table */}
      <div className="glass-panel rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" />
            Branch Performance Ranking
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-gray-900">
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4 text-center">Port Plan</th>
                <th className="px-6 py-4 text-center">Realized</th>
                <th className="px-6 py-4">Achievement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.branchData.map((branch, i) => (
                <tr key={branch.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{branch.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-gray-500" suppressHydrationWarning>
                    {branch.planned.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white" suppressHydrationWarning>
                    {branch.actual.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${branch.achievement >= 90 ? 'bg-emerald-500' :
                            branch.achievement >= 70 ? 'bg-blue-500' :
                              'bg-amber-500'
                            }`}
                          style={{ width: `${Math.min(100, branch.achievement)}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-10 text-right">
                        {branch.achievement}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
