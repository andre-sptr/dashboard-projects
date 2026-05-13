'use client';

import type { BranchRankingEntry } from '@/types/dashboard';

interface Props {
  branchData: BranchRankingEntry[];
}

function getTrafficLevel(realization: number): 'AMAN' | 'PERHATIAN' | 'KRITIS' {
  if (realization >= 70) return 'AMAN';
  if (realization >= 40) return 'PERHATIAN';
  return 'KRITIS';
}

const LEVEL_STYLES = {
  AMAN: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  PERHATIAN: {
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    bar: 'bg-yellow-400',
  },
  KRITIS: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    bar: 'bg-red-500',
  },
};

export default function BranchTrafficLight({ branchData }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          Status Branch
        </h2>
        <span
          className="ml-auto text-xs text-gray-400 dark:text-gray-500 cursor-help"
          title="Berdasarkan % realisasi port (port_realized / port_planned). Berbeda dengan badge project yang menggunakan 3 kriteria (stuck, overdue, low-realization)."
        >
          ⓘ Skala: realisasi port per branch
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 shadow-sm overflow-hidden">
        {branchData.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            Tidak ada data branch.
          </p>
        ) : (
          branchData.map((branch) => {
            if (branch.planned === 0) {
              return (
                <div key={branch.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                    {branch.name}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                </div>
              );
            }

            const realization = Math.round((branch.actual / branch.planned) * 100);
            const level = getTrafficLevel(realization);
            const styles = LEVEL_STYLES[level];

            return (
              <div key={branch.name} className="flex items-center gap-3 px-4 py-3">
                <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                  {branch.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${styles.bar} transition-all`}
                    style={{ width: `${Math.min(realization, 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                  {realization}%
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${styles.badge}`}>
                  {level}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        AMAN ≥ 70% &nbsp;·&nbsp; PERHATIAN 40–69% &nbsp;·&nbsp; KRITIS &lt; 40%
      </p>
    </section>
  );
}
