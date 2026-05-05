// Trend chart showing project progress over time
import React from 'react';
import { Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TimelineChartProps {
  goliveMonthList: any[];
  totalGolivePorts: number;
}

export const TimelineChart = ({ goliveMonthList, totalGolivePorts }: TimelineChartProps) => {
  return (
    <section className="w-full">
      <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Tanggal Golive per Bulan (by Port)
          </h3>
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {totalGolivePorts.toLocaleString('id-ID')} total ports golive
          </span>
        </div>
        {goliveMonthList.some(m => m.count > 0) ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goliveMonthList} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: any) => value.toLocaleString('id-ID')}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Ports"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Belum ada data tanggal golive tahun ini.
          </p>
        )}
      </div>
    </section>
  );
};
