// Pie/Bar charts showing project distribution by category
import React from 'react';
import { TrendingUp, Layers } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface BarRowProps {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}

export const BarRow = ({
  label,
  count,
  total,
  colorClass,
}: BarRowProps) => {
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
};

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface SubStatusEntry {
  name: string;
  count: number;
}

interface DistributionChartsProps {
  pieData: PieEntry[];
  statusList: SubStatusEntry[];
  totalPorts: number;
}

export const DistributionCharts = ({ pieData, statusList, totalPorts }: DistributionChartsProps) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm flex flex-col min-h-87.5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Distribusi Status (by Port)
          </h3>
        </div>
        {pieData.length ? (
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ cx, x, y, percent }) => (
                    <text
                      x={x}
                      y={y}
                      fill="currentColor"
                      className="text-[11px] font-bold text-gray-600 dark:text-gray-400"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${((percent || 0) * 100).toFixed(0)}%`}
                    </text>
                  )}
                  labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Belum ada data.</p>
        )}
      </div>

      <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm flex flex-col max-h-87.5">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Layers size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Status
          </h3>
        </div>
        {statusList.length ? (
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {statusList.map((s) => (
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
  );
};
