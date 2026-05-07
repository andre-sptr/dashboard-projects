'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DurationChartProps {
  data: {
    status: string;
    avgDays: number;
    minDays: number;
    maxDays: number;
  }[];
}

export const DurationChart: React.FC<DurationChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full min-h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Rata-rata Durasi per Status (Hari)
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <YAxis 
              dataKey="status" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value) => {
                const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                return [`${numericValue.toFixed(1)} Hari`, 'Rata-rata'];
              }}
            />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.avgDays > 30 ? '#ef4444' : entry.avgDays > 15 ? '#f59e0b' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">
        * Status dengan durasi &gt; 30 hari ditandai warna merah (Bottleneck).
      </p>
    </div>
  );
};
