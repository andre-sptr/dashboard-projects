// Feed of recent project updates or log entries
import React from 'react';
import { Clock } from 'lucide-react';
import type { Project } from '@/types/database';
import { calculateCurrentDuration } from '@/utils/duration';
import { classifyStatus, type StatusBucket } from '@/utils/project';

interface RecentChangesProps {
  recent: Project[];
}

// Status badge colors mirror the semantic buckets used across the dashboard.
const STATUS_BADGE: Record<StatusBucket, string> = {
  done: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
  progress: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30',
  other: 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
};

const STATUS_DOT: Record<StatusBucket, string> = {
  done: 'bg-emerald-500',
  progress: 'bg-blue-500',
  cancelled: 'bg-red-500',
  other: 'bg-slate-400',
};

export const RecentChanges = ({ recent }: RecentChangesProps) => {
  return (
    <section className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Perubahan Terbaru
        </h3>
      </div>

      {recent.length ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {recent.map((p) => (
            <li
              key={p.uid}
              className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {p.id_ihld}
                </p>
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 truncate"
                  title={p.nama_lop}
                >
                  {p.nama_lop || '-'}
                </p>
              </div>
              <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-2 sm:gap-3 sm:w-[440px]">
                <span
                  className="block w-full text-left px-2.5 py-1 rounded-md text-[11px] font-medium leading-snug text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 truncate"
                  title={p.sub_status || '-'}
                >
                  {p.sub_status || '-'}
                </span>
                {(() => {
                  const bucket = classifyStatus(p.status);
                  return (
                    <span
                      className={`flex w-full min-w-0 items-center justify-start gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold leading-snug ring-1 ring-inset ${STATUS_BADGE[bucket]}`}
                      title={p.status || '-'}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[bucket]}`} />
                      <span className="truncate">{p.status || '-'}</span>
                    </span>
                  );
                })()}
                <span
                  className="flex w-full min-w-0 items-center justify-start gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold leading-snug tabular-nums bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30"
                  title={calculateCurrentDuration(p.last_changed_at)}
                >
                  <Clock size={11} className="shrink-0" />
                  <span className="truncate">{calculateCurrentDuration(p.last_changed_at)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic">Belum ada data project.</p>
      )}
    </section>
  );
};
