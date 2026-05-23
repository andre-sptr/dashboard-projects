// List or chart ranking branches by performance metrics
import React from 'react';
import { MapPin } from 'lucide-react';

const STATUS_COLS = [
  '0. DROP',
  '1. AANWIJZING',
  '2. DONE AANWIJZING',
  '3. PERIZINAN',
  '4. MATDEL',
  '5. INSTALASI',
  '6. FINISH INSTALASI',
  '7. GOLIVE',
  '8. UJI TERIMA',
] as const;

type StatusCol = typeof STATUS_COLS[number];

const SHORT_LABELS: Record<StatusCol, string> = {
  '0. DROP': 'DROP',
  '1. AANWIJZING': 'AANWIJZING',
  '2. DONE AANWIJZING': 'DONE AANWJ',
  '3. PERIZINAN': 'PERIZINAN',
  '4. MATDEL': 'MATDEL',
  '5. INSTALASI': 'INSTALASI',
  '6. FINISH INSTALASI': 'FINISH INST',
  '7. GOLIVE': 'GOLIVE',
  '8. UJI TERIMA': 'UJI TERIMA',
};

interface BranchData {
  name: string;
  planned: number;
  actual: number;
  achievement: number;
  statusCounts: Record<StatusCol, number>;
}

interface BranchRankingProps {
  branchData: BranchData[];
}

export const BranchRanking = ({ branchData }: BranchRankingProps) => {
  return (
    <div className="glass-panel rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          Branch Performance Ranking
        </h3>
      </div>
      <div className="w-full">
        <table className="w-full table-fixed text-left border-collapse">
          <colgroup>
            <col className="w-[13%]" />
            {STATUS_COLS.map(s => (
              <col key={s} className="w-[8%]" />
            ))}
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-tight text-gray-400 bg-white dark:bg-gray-900">
              <th className="px-2 py-3 whitespace-nowrap">Branch</th>
              {STATUS_COLS.map(s => (
                <th key={s} className="px-1 py-3 text-center whitespace-nowrap">{SHORT_LABELS[s]}</th>
              ))}
              <th className="px-2 py-3 text-center whitespace-nowrap">Achievement %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {branchData.map((branch, i) => (
              <tr key={branch.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate" title={branch.name}>{branch.name}</span>
                  </div>
                </td>
                {STATUS_COLS.map(s => (
                  <td key={s} className="px-1 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 tabular-nums" suppressHydrationWarning>
                    {(branch.statusCounts?.[s] ?? 0).toLocaleString('id-ID')}
                  </td>
                ))}
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${branch.achievement >= 90 ? 'bg-emerald-500' :
                          branch.achievement >= 70 ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`}
                        style={{ width: `${Math.min(100, branch.achievement)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-12 text-right tabular-nums shrink-0">
                      {branch.achievement.toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
