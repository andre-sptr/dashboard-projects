// Analytics charts for regional performance reports
import React from 'react';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

interface VelocityTrendEntry {
  name: string;
  cumulative: number;
}

interface SlaEntry {
  name: string;
  value: number;
  color: string;
}

interface TrendEntry {
  name: string;
  actual: number;
}

interface PerformanceChartsProps {
  velocityTrend: VelocityTrendEntry[];
  slaData: SlaEntry[];
  onTimeProjects: number;
  lateProjects: number;
  avgDelayDays: number;
  slaRate: number;
  trendData: TrendEntry[];
  granularity: string;
}

export const PerformanceCharts = ({
  velocityTrend,
  slaData,
  onTimeProjects,
  lateProjects,
  avgDelayDays,
  slaRate,
  trendData,
  granularity
}: PerformanceChartsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Production Velocity Trend (Cumulative Ports)
            </h3>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={350} minWidth={1}>
              <AreaChart data={velocityTrend}>
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
                  formatter={(v: number) => v.toLocaleString('id-ID')}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" name="Cumulative Ports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            SLA Adherence
          </h3>
          <div className="flex-1 relative">
            {onTimeProjects + lateProjects > 0 ? (
              <ResponsiveContainer width="100%" height={250} minWidth={1}>
                <PieChart>
                  <Pie
                    data={slaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} Proyek`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Clock size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No SLA Data Found</p>
                <p className="text-[9px] mt-1 text-center px-4 italic opacity-60">Pastikan &quot;Target Golive&quot; &amp; &quot;Golive Date&quot; terisi di database</p>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Avg. Delay</span>
              <span className="text-sm font-black text-rose-600">{avgDelayDays} Hari</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">On-Time Ratio</span>
              <span className="text-sm font-black text-emerald-600">{slaRate}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Golive Distribution (Ports per Period)
          </h3>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={350} minWidth={1}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(v: number) => v.toLocaleString('id-ID')}
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
    </div>
  );
};
