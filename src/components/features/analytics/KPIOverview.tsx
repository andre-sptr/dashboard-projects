'use client';

import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  Percent
} from 'lucide-react';

interface KPIOverviewProps {
  data: {
    totalProjects: number;
    completedProjects: number;
    onTrackProjects: number;
    atRiskProjects: number;
    slaComplianceRate: number;
    totalBoqValue: number;
    avgCompletionPercentage: number;
  };
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ data }) => {
  const kpis = [
    {
      title: 'Total Projects',
      value: data.totalProjects,
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      label: 'Overall active & completed'
    },
    {
      title: 'Completed',
      value: data.completedProjects,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      label: 'Projects GOLIVE/DONE'
    },
    {
      title: 'On Track',
      value: data.onTrackProjects,
      icon: Target,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      label: 'Following SLA schedule'
    },
    {
      title: 'At Risk',
      value: data.atRiskProjects,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      label: 'Delayed or near deadline'
    },
    {
      title: 'SLA Compliance',
      value: `${data.slaComplianceRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      label: 'Meeting target golive'
    },
    {
      title: 'Avg. Progress',
      value: `${data.avgCompletionPercentage.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      label: 'Total aggregate progress'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => (
        <div 
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {kpi.title}
              </p>
              <h3 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                {kpi.value}
              </h3>
            </div>
            <div className={`rounded-xl p-3 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{kpi.label}</span>
          </div>
          
          {/* Subtle decoration */}
          <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${kpi.bg}`} />
        </div>
      ))}
    </div>
  );
};
