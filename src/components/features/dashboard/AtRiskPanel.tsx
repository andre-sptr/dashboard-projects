'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RiskyProjectDTO } from '@/types/dashboard';

interface Props {
  projects: RiskyProjectDTO[];
}

const BADGE_STYLES = {
  KRITIS: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  PERHATIAN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
} as const;

const CARD_BORDER = {
  KRITIS: 'border-l-4 border-l-red-500',
  PERHATIAN: 'border-l-4 border-l-yellow-400',
} as const;

export default function AtRiskPanel({ projects }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          Project Berisiko
        </h2>
        {projects.length > 0 && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {projects.length} project perlu perhatian
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 px-4 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Semua project aman — tidak ada yang perlu tindak lanjut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div
              key={p.uid}
              className={`rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${CARD_BORDER[p.risk_level]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                  {p.nama_lop}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${BADGE_STYLES[p.risk_level]}`}>
                  {p.risk_level}
                </span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Branch: <span className="font-medium text-gray-700 dark:text-gray-300">{p.branch || '-'}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Status: <span className="font-medium text-gray-700 dark:text-gray-300">{p.status || '-'}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tidak berubah:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {p.days_since_changed} hari
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
