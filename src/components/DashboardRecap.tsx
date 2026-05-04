'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/db';
import { calculateCurrentDuration } from '@/utils/duration';
import {
  Briefcase,
  CheckCircle2,
  Loader2,
  XCircle,
  TrendingUp,
  Calendar,
  Layers,
  Clock,
} from 'lucide-react';

interface Props {
  projects: Project[];
}

type StatusBucket = 'done' | 'progress' | 'cancelled' | 'other';

function classifyStatus(status: string): StatusBucket {
  const s = (status || '').toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('closed') || s.includes('golive'))
    return 'done';
  if (s.includes('cancel') || s.includes('reject') || s.includes('drop')) return 'cancelled';
  if (s.includes('progress') || s.includes('ongoing') || s.includes('running')) return 'progress';
  return 'other';
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function getPortCount(fd: unknown[]): number {
  // Index 10 is PORT PLAN, Index 29 is REAL JML PORT GOLIVE
  const plan = parseNumber(fd[10]);
  const real = parseNumber(fd[29]);
  return real > 0 ? real : plan;
}

function formatExcelDateShort(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || String(value).trim() === '#N/A')
    return null;
  const serial = Number(value);
  if (isNaN(serial) || serial < 1) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getFullDataArray(project: Project): unknown[] {
  try {
    const parsed = JSON.parse(project.full_data || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {sub && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{sub}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${accent} shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="font-medium text-gray-700 dark:text-gray-300 truncate" title={label}>
          {label || '-'}
        </span>
        <span className="text-gray-500 dark:text-gray-400 shrink-0 tabular-nums font-medium">
          {count.toLocaleString('id-ID')} <span className="text-gray-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
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
      if (goliveStr) {
        totalGolivePorts += ports;
        goliveMonthMap.set(goliveStr, (goliveMonthMap.get(goliveStr) || 0) + ports);
      }
    }

    const toSortedArr = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Generate chronological months for Golive
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

    return {
      total: projects.length,
      totalPorts,
      donePorts,
      progressPorts,
      cancelledPorts,
      otherPorts,
      statusList: toSortedArr(statusMap),
      subStatusList: toSortedArr(subStatusMap).slice(0, 10),
      totalGolivePorts,
      goliveMonthList: chronologicalGolive,
      recent,
    };
  }, [projects]);

  const { totalPorts } = stats;

  const statusColorMap: Record<string, string> = {
    done: 'bg-emerald-500',
    progress: 'bg-blue-500',
    cancelled: 'bg-red-500',
    other: 'bg-amber-500',
  };

  return (
    <div className="w-full space-y-6">
      {/* KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

      {/* Distribusi Status & Sub Status */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Distribusi Status (by Port)
            </h3>
          </div>
          {stats.statusList.length ? (
            <div className="space-y-3">
              {stats.statusList.map((s) => {
                const bucket = classifyStatus(s.name);
                return (
                  <BarRow
                    key={s.name}
                    label={s.name}
                    count={s.count}
                    total={totalPorts}
                    colorClass={statusColorMap[bucket]}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Belum ada data.</p>
          )}
        </div>

        <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Top Sub Status (by Port)
            </h3>
          </div>
          {stats.subStatusList.length ? (
            <div className="space-y-3">
              {stats.subStatusList.map((s) => (
                <BarRow
                  key={s.name}
                  label={s.name}
                  count={s.count}
                  total={totalPorts}
                  colorClass="bg-indigo-500"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Belum ada data.</p>
          )}
        </div>
      </section>

      {/* Golive Month */}
      <section className="w-full">
        <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tanggal Golive per Bulan (by Port)
            </h3>
            <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {stats.totalGolivePorts.toLocaleString('id-ID')} total ports golive
            </span>
          </div>
          {stats.goliveMonthList.some(m => m.count > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {stats.goliveMonthList.map((s) => (
                <BarRow
                  key={s.name}
                  label={s.name}
                  count={s.count}
                  total={stats.totalGolivePorts}
                  colorClass="bg-emerald-500"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Belum ada data tanggal golive tahun ini.
            </p>
          )}
        </div>
      </section>

      {/* Recent Changes */}
      <section className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Perubahan Terbaru
          </h3>
        </div>

        {stats.recent.length ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recent.map((p) => (
              <li
                key={p.uid}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {p.id_ihld}
                  </p>
                  <p
                    className="text-xs text-gray-500 dark:text-gray-400 truncate"
                    title={p.nama_lop}
                  >
                    {p.nama_lop || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {p.status || '-'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {p.sub_status || '-'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {calculateCurrentDuration(p.last_changed_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">Belum ada data project.</p>
        )}
      </section>
    </div>
  );
}
