// Search bar and filter dropdowns for dashboard
import React from 'react';
import { Search } from 'lucide-react';

interface FilterOptions {
  statuses: string[];
  subStatuses: string[];
  areas: string[];
  branches: string[];
  tematik?: string[];
  months?: { value: string; label: string }[];
  years?: string[];
}

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchPlaceholder?: string;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  subStatusFilter: string;
  setSubStatusFilter: (val: string) => void;
  areaFilter: string;
  setAreaFilter: (val: string) => void;
  branchFilter: string;
  setBranchFilter: (val: string) => void;
  showAreaBranchFilters?: boolean;
  areaLabel?: string;
  branchLabel?: string;
  tematikFilter?: string;
  setTematikFilter?: (val: string) => void;
  tematikLabel?: string;
  monthFilter?: string;
  setMonthFilter?: (val: string) => void;
  yearFilter?: string;
  setYearFilter?: (val: string) => void;
  resetFilters: () => void;
  filterOptions: FilterOptions;
}

export const FilterSection = ({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = 'Cari ID IHLD, Nama LOP, Status...',
  statusFilter,
  setStatusFilter,
  subStatusFilter,
  setSubStatusFilter,
  areaFilter,
  setAreaFilter,
  branchFilter,
  setBranchFilter,
  showAreaBranchFilters = true,
  areaLabel = 'Area',
  branchLabel = 'Branch',
  tematikFilter = '',
  setTematikFilter,
  tematikLabel = 'Tematik',
  monthFilter = '',
  setMonthFilter,
  yearFilter = '',
  setYearFilter,
  resetFilters,
  filterOptions
}: Props) => {
  const hasActiveFilters = statusFilter || subStatusFilter || areaFilter || branchFilter || tematikFilter || monthFilter || yearFilter || searchQuery;
  const visibleFilterCount = 2
    + (showAreaBranchFilters ? 2 : 0)
    + (setTematikFilter && filterOptions.tematik ? 1 : 0)
    + (setMonthFilter && filterOptions.months ? 1 : 0)
    + (setYearFilter && filterOptions.years ? 1 : 0);
  const desktopGridClass: Record<number, string> = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  };
  const filterGridClass = desktopGridClass[visibleFilterCount] ?? 'lg:grid-cols-6';
  const filterItemClass = 'min-w-0 space-y-1';


  return (
    <div className="glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Cari proyek"
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
        />
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${filterGridClass} gap-3`}>
        <div className={filterItemClass}>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
            className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="">Semua</option>
            {filterOptions.statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={filterItemClass}>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Sub Status</label>
          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value)}
            aria-label="Filter sub status"
            className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="">Semua</option>
            {filterOptions.subStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {showAreaBranchFilters && (
          <div className={filterItemClass}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">{areaLabel}</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              aria-label={`Filter ${areaLabel.toLowerCase()}`}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.areas.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {showAreaBranchFilters && (
          <div className={filterItemClass}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">{branchLabel}</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              aria-label={`Filter ${branchLabel.toLowerCase()}`}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.branches.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {setTematikFilter && filterOptions.tematik && (
          <div className={filterItemClass}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">{tematikLabel}</label>
            <select
              value={tematikFilter}
              onChange={(e) => setTematikFilter(e.target.value)}
              aria-label={`Filter ${tematikLabel.toLowerCase()}`}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.tematik.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {setMonthFilter && filterOptions.months && (
          <div className={filterItemClass}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Bulan</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter bulan"
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        )}

        {setYearFilter && filterOptions.years && (
          <div className={filterItemClass}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Tahun</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              aria-label="Filter tahun"
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
};
