'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { KPIOverview } from '@/components/features/analytics/KPIOverview';
import { StatusChart } from '@/components/features/analytics/StatusChart';
import { TrendChart } from '@/components/features/analytics/TrendChart';
import { DurationChart } from '@/components/features/analytics/DurationChart';
import { PredictivePanel } from '@/components/features/analytics/PredictivePanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { RefreshCw, Download } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AnalyticsData {
  kpis: React.ComponentProps<typeof KPIOverview>['data'];
  distribution: React.ComponentProps<typeof StatusChart>['data'];
  trends: React.ComponentProps<typeof TrendChart>['data'];
  durations: React.ComponentProps<typeof DurationChart>['data'];
  predictions: React.ComponentProps<typeof PredictivePanel>['data'];
}

const EMPTY_ANALYTICS: AnalyticsData = {
  kpis: {
    totalProjects: 0,
    completedProjects: 0,
    onTrackProjects: 0,
    atRiskProjects: 0,
    slaComplianceRate: 0,
    totalBoqValue: 0,
    avgCompletionPercentage: 0,
  },
  distribution: [],
  trends: [],
  durations: [],
  predictions: {
    avgMonthlyCompletion: '0',
    remainingProjects: 0,
    estimatedMonthsToFinish: '0',
    confidenceScore: 0,
  },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { subscribe, unsubscribe } = useWebSocket();

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  useEffect(() => {
    const handleSyncCompleted = () => {
      void fetchData();
    };

    subscribe('sync.completed', handleSyncCompleted);
    return () => {
      unsubscribe('sync.completed', handleSyncCompleted);
    };
  }, [fetchData, subscribe, unsubscribe]);

  const handleRefresh = () => {
    void fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-112.5 w-full rounded-2xl" />
          <Skeleton className="h-112.5 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 p-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Visualisasi data mendalam, analisis durasi, dan prediksi penyelesaian proyek.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <KPIOverview data={data.kpis} />

      {/* Predictive Insights */}
      <PredictivePanel data={data.predictions} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <StatusChart data={data.distribution} />
        </div>

        {/* Trends */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <TrendChart data={data.trends} />
        </div>

        {/* Durations */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <DurationChart data={data.durations} />
        </div>
      </div>
    </div>
  );
}
