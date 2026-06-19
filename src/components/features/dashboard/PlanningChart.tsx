'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Project, ProjectType } from '@/types/database';
import { buildPlanningChartData } from '@/lib/project-planning-stats';

interface Props {
  projects: Project[];
  projectType: ProjectType;
}

export function PlanningChart({ projects, projectType }: Props) {
  const data = useMemo(
    () => buildPlanningChartData(projects, projectType),
    [projects, projectType]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chart Perencanaan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah row berdasarkan komitmen dan OA/golive.</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              formatter={(value, name) => [
                `${Number(value ?? 0).toLocaleString('id-ID')} row`,
                name === 'plannedRows' ? 'Rencana' : 'OA/Golive',
              ]}
            />
            <Legend formatter={(value) => value === 'plannedRows' ? 'Rencana' : 'OA/Golive'} />
            <Bar dataKey="plannedRows" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualRows" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
