// Specialized filters for generating reports
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ReportFiltersProps {
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  areaFilter: string;
  setAreaFilter: (a: string) => void;
  branchFilter: string;
  setBranchFilter: (b: string) => void;
  areaBranchMap: Record<string, string[]>;
}

export const ReportFilters = ({
  granularity,
  setGranularity,
  areaFilter,
  setAreaFilter,
  branchFilter,
  setBranchFilter,
  areaBranchMap
}: ReportFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-blue-600" />
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${granularity === g
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-indigo-600" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ALL AREAS</option>
            <option value="RIDAR">RIDAR</option>
            <option value="RIKEP">RIKEP</option>
            <option value="SUMBAR">SUMBAR</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">ALL BRANCH</option>
            {(areaFilter ? areaBranchMap[areaFilter.toUpperCase()] || [] : Object.values(areaBranchMap).flat()).sort().map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
