'use client';

import React from 'react';
import { Sparkles, TrendingUp, Calendar, Zap } from 'lucide-react';

interface PredictivePanelProps {
  data: {
    avgMonthlyCompletion: string;
    remainingProjects: number;
    estimatedMonthsToFinish: string;
    confidenceScore: number;
  };
}

export const PredictivePanel: React.FC<PredictivePanelProps> = ({ data }) => {
  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-blue-950/20 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-indigo-600 p-2 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Predictive Insights
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-powered forecasting based on historical completion rates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Laju Penyelesaian</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {data.avgMonthlyCompletion} <span className="text-sm font-normal text-slate-500">proj/bulan</span>
          </div>
          <p className="text-xs text-slate-500">Rata-rata 6 bulan terakhir</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Selesai</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            ~{data.estimatedMonthsToFinish} <span className="text-sm font-normal text-slate-500">bulan</span>
          </div>
          <p className="text-xs text-slate-500">Untuk {data.remainingProjects} proyek tersisa</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Confidence Score</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {(data.confidenceScore * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-purple-600 h-full transition-all duration-1000" 
              style={{ width: `${data.confidenceScore * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-indigo-50 dark:border-indigo-900/20 text-sm text-slate-600 dark:text-slate-300">
        <strong className="text-indigo-600 dark:text-indigo-400">💡 Rekomendasi:</strong> Berdasarkan data di atas, tim perlu meningkatkan laju penyelesaian sebesar 15% untuk memenuhi target akhir tahun. Fokus pada bottleneck di status dengan durasi &gt; 30 hari.
      </div>
    </div>
  );
};
