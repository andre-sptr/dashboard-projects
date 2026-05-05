// List or chart ranking branches by performance metrics
import React from 'react';
import { MapPin } from 'lucide-react';

interface BranchData {
  name: string;
  planned: number;
  actual: number;
  achievement: number;
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-gray-900">
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4 text-center">Port Plan</th>
              <th className="px-6 py-4 text-center">Realized</th>
              <th className="px-6 py-4">Achievement %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {branchData.map((branch, i) => (
              <tr key={branch.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{branch.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500" suppressHydrationWarning>
                  {branch.planned.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white" suppressHydrationWarning>
                  {branch.actual.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${branch.achievement >= 90 ? 'bg-emerald-500' :
                          branch.achievement >= 70 ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`}
                        style={{ width: `${Math.min(100, branch.achievement)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-10 text-right">
                      {branch.achievement}%
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
