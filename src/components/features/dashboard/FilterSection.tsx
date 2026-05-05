// Search bar and filter dropdowns for dashboard
import React from 'react';
import { Search } from 'lucide-react';

interface FilterOptions {
  statuses: string[];
  subStatuses: string[];
  areas: string[];
  branches: string[];
}

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  subStatusFilter: string;
  setSubStatusFilter: (val: string) => void;
  areaFilter: string;
  setAreaFilter: (val: string) => void;
  branchFilter: string;
  setBranchFilter: (val: string) => void;
  filterOptions: FilterOptions;
}

export const FilterSection = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  subStatusFilter,
  setSubStatusFilter,
  areaFilter,
  setAreaFilter,
  branchFilter,
  setBranchFilter,
  filterOptions
}: Props) => {
  const hasActiveFilters = statusFilter || subStatusFilter || areaFilter || branchFilter || searchQuery;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setSubStatusFilter('');
    setAreaFilter('');
    setBranchFilter('');
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Cari ID IHLD, Nama LOP, Status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Cari proyek"
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
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

        <div className="space-y-1">
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

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Area</label>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            aria-label="Filter area"
            className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="">Semua</option>
            {filterOptions.areas.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Branch</label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            aria-label="Filter branch"
            className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="">Semua</option>
            {filterOptions.branches.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
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
