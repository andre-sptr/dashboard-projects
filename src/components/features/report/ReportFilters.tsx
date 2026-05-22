// Specialized filters for generating reports
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const now = new Date();

// A month is "future" (and thus not selectable) when, combined with the chosen
// year, it refers to a period that hasn't arrived yet.
function isFutureMonth(monthIndex: number, year: number | 'all'): boolean {
  if (year === 'all') return false;
  if (year > now.getFullYear()) return true;
  if (year < now.getFullYear()) return false;
  return monthIndex > now.getMonth();
}

interface ReportFiltersProps {
  month: number | 'all';
  setMonth: (m: number | 'all') => void;
  year: number | 'all';
  setYear: (y: number | 'all') => void;
  years: number[];
  areaFilter: string;
  setAreaFilter: (a: string) => void;
  branchFilter: string;
  setBranchFilter: (b: string) => void;
  areaBranchMap: Record<string, string[]>;
}

export const ReportFilters = ({
  month,
  setMonth,
  year,
  setYear,
  years,
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
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Komitmen Golive:
        </span>
        <select
          value={String(month)}
          onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i} disabled={isFutureMonth(i, year)}>{name}</option>
          ))}
        </select>
        <select
          value={String(year)}
          onChange={(e) => {
            const nextYear = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setYear(nextYear);
            if (month !== 'all' && isFutureMonth(month, nextYear)) setMonth('all');
          }}
          className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
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
