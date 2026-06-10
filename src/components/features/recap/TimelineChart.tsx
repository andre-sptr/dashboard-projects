'use client';

// Trend chart showing project progress over time
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { GoliveTimelineDayEntry, GoliveTimelineEntry } from '@/types/dashboard';

type TimelineEntry = GoliveTimelineEntry | GoliveTimelineDayEntry;
type TimelineChartEntry = TimelineEntry & {
  onTimeLabel: number | null;
  pendingLabel: number | null;
  uncommittedLabel: number | null;
  lateLabel: number | null;
};

interface TimelineChartProps {
  goliveMonthList: GoliveTimelineEntry[];
  totalGolivePorts: number;
}

const STACKS = [
  { key: 'onTimePorts', name: 'Sesuai komitmen', color: '#10b981' },
  { key: 'pendingPorts', name: 'Belum lewat', color: '#9ca3af' },
  { key: 'uncommittedPorts', name: 'Tanpa Komitmen', color: '#9ca3af', patterned: true },
  { key: 'latePorts', name: 'Melewati komitmen', color: '#ef4444' },
] as const;

const UNCOMMITTED_PATTERN_ID = 'golive-uncommitted-pattern';

const formatNumber = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
  return numericValue.toLocaleString('id-ID');
};

const formatLabel = (value: unknown) => value == null ? '' : formatNumber(value);

const hasPorts = (entry: TimelineEntry) => entry.totalPorts > 0;

export function buildTimelineChartData(entries: TimelineEntry[]): TimelineChartEntry[] {
  return entries.map((entry) => ({
    ...entry,
    onTimeLabel: entry.latePorts === 0
      && entry.uncommittedPorts === 0
      && entry.pendingPorts === 0
      && entry.onTimePorts > 0
      ? entry.totalPorts
      : null,
    pendingLabel: entry.latePorts === 0
      && entry.uncommittedPorts === 0
      && entry.pendingPorts > 0
      ? entry.totalPorts
      : null,
    uncommittedLabel: entry.latePorts === 0 && entry.uncommittedPorts > 0
      ? entry.totalPorts
      : null,
    lateLabel: entry.latePorts > 0 ? entry.totalPorts : null,
  }));
}

function getPayload(value: unknown): TimelineEntry | null {
  if (!value || typeof value !== 'object') return null;
  const payload = (value as { payload?: unknown }).payload;
  if (!payload || typeof payload !== 'object') return null;
  return payload as TimelineEntry;
}

export const TimelineChart = ({ goliveMonthList, totalGolivePorts }: TimelineChartProps) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  const selectedMonth = useMemo(
    () => goliveMonthList.find((month) => month.monthKey === selectedMonthKey) ?? null,
    [goliveMonthList, selectedMonthKey]
  );
  const timelineEntries: TimelineEntry[] = selectedMonth ? selectedMonth.days : goliveMonthList;
  const chartData = buildTimelineChartData(timelineEntries);
  const hasData = chartData.some(hasPorts);

  const handleBarClick = (value: unknown) => {
    if (selectedMonth) return;
    const payload = getPayload(value);
    if ('monthKey' in (payload ?? {}) && payload?.totalPorts) {
      setSelectedMonthKey((payload as GoliveTimelineEntry).monthKey);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {selectedMonth ? (
          <button
            type="button"
            onClick={() => setSelectedMonthKey(null)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={14} />
          </button>
        ) : (
          <Calendar size={18} className="text-emerald-600" />
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {selectedMonth ? `Tanggal Golive ${selectedMonth.name} (by Port)` : 'Tanggal Golive per Bulan (by Port)'}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {STACKS.map((stack) => (
              <span key={stack.key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{
                    backgroundColor: stack.color,
                    backgroundImage: 'patterned' in stack
                      ? 'repeating-linear-gradient(135deg, transparent 0 2px, rgba(255,255,255,0.85) 2px 3px)'
                      : undefined,
                  }}
                />
                {stack.name}
              </span>
            ))}
          </div>
        </div>
        <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {(selectedMonth?.totalPorts ?? totalGolivePorts).toLocaleString('id-ID')} total port timeline
        </span>
      </div>
      {hasData ? (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={350} minWidth={1}>
            <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <pattern
                  id={UNCOMMITTED_PATTERN_ID}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill="#9ca3af" fillOpacity="0.35" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="2" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                fontSize={selectedMonth ? 9 : 10}
                axisLine={false}
                tickLine={false}
                interval={selectedMonth ? 0 : undefined}
              />
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toLocaleString()}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value, name) => [formatNumber(value), name]}
                labelFormatter={(label) => selectedMonth ? `Tanggal ${label} ${selectedMonth.name}` : String(label)}
              />
              <Bar
                dataKey="onTimePorts"
                stackId="golive"
                fill="#10b981"
                name="Sesuai komitmen"
                barSize={selectedMonth ? 14 : 40}
                onClick={handleBarClick}
                cursor={selectedMonth ? 'default' : 'pointer'}
              >
                <LabelList
                  dataKey="onTimeLabel"
                  position="top"
                  formatter={formatLabel}
                  className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
                />
              </Bar>
              <Bar
                dataKey="pendingPorts"
                stackId="golive"
                fill="#9ca3af"
                name="Belum lewat"
                barSize={selectedMonth ? 14 : 40}
                onClick={handleBarClick}
                cursor={selectedMonth ? 'default' : 'pointer'}
              >
                <LabelList
                  dataKey="pendingLabel"
                  position="top"
                  formatter={formatLabel}
                  className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
                />
              </Bar>
              <Bar
                dataKey="uncommittedPorts"
                stackId="golive"
                fill={`url(#${UNCOMMITTED_PATTERN_ID})`}
                name="Tanpa Komitmen"
                barSize={selectedMonth ? 14 : 40}
                onClick={handleBarClick}
                cursor={selectedMonth ? 'default' : 'pointer'}
              >
                <LabelList
                  dataKey="uncommittedLabel"
                  position="top"
                  formatter={formatLabel}
                  className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
                />
              </Bar>
              <Bar
                dataKey="latePorts"
                stackId="golive"
                fill="#ef4444"
                name="Melewati komitmen"
                barSize={selectedMonth ? 14 : 40}
                onClick={handleBarClick}
                cursor={selectedMonth ? 'default' : 'pointer'}
              >
                <LabelList
                  dataKey="lateLabel"
                  position="top"
                  formatter={formatLabel}
                  className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Belum ada data tanggal golive atau komitmen golive pada periode ini.
        </p>
      )}
    </div>
  );
};
