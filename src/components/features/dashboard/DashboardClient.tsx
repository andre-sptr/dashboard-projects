// Dashboard table with filtering, pagination, and project rows
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Project, ProjectType } from '@/types/database';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { FilterSection } from './FilterSection';
import { ProjectRow } from './ProjectRow';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRouter } from 'next/navigation';
import { AREA_BRANCH_MAP } from '@/lib/constants';
import type { ColumnConfigEntry } from '@/lib/sheet-columns';
import { getProjectConfig } from '@/lib/project-config';
import { getFullDataArray } from '@/utils/project';
import { parseExcelDate } from '@/utils/date';
import { PlanningChart } from './PlanningChart';

interface Props {
  initialProjects: Project[];
  columnConfig?: ColumnConfigEntry[];
  projectType?: ProjectType;
}

const ITEMS_PER_PAGE = 10;
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];


export default function DashboardClient({ initialProjects, columnConfig, projectType = 'JPP' }: Props) {
  const router = useRouter();
  const { subscribe, unsubscribe } = useWebSocket();
  const projectConfig = getProjectConfig(projectType);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [tematikFilter, setTematikFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleSyncCompleted = () => {
      setIsRefreshing(true);
      router.refresh();
      // Reset refreshing state after a short delay
      setTimeout(() => setIsRefreshing(false), 2000);
    };

    subscribe('sync.completed', handleSyncCompleted);
    return () => {
      unsubscribe('sync.completed', handleSyncCompleted);
    };
  }, [subscribe, unsubscribe, router]);

  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const subStatuses = new Set<string>();
    const areas = new Set<string>();
    const branches = new Set<string>();
    const tematik = new Set<string>();
    const months = new Map<string, string>();
    const years = new Set<string>();

    initialProjects.forEach(p => {
      if (p.status) statuses.add(p.status);
      if (p.sub_status) subStatuses.add(p.sub_status);
      if (p.area) areas.add(p.area.toUpperCase());
      if (p.branch) branches.add(p.branch.toUpperCase());

      const fullData = getFullDataArray(p);
      if (projectConfig.dashboard.tematikColIndex !== undefined) {
        const value = fullData[projectConfig.dashboard.tematikColIndex];
        const text = value === null || value === undefined ? '' : String(value).trim();
        if (text) tematik.add(text);
      }

      if (projectConfig.dashboard.dateFilterColIndex !== undefined) {
        const date = parseExcelDate(fullData[projectConfig.dashboard.dateFilterColIndex]);
        if (date) {
          const monthValue = String(date.getMonth() + 1).padStart(2, '0');
          months.set(monthValue, MONTH_NAMES[date.getMonth()]);
          years.add(String(date.getFullYear()));
        }
      }
    });

    const sortedAreas = Array.from(areas).sort();

    let availableBranches = Array.from(branches).sort();
    if (areaFilter) {
      const mappedBranches = AREA_BRANCH_MAP[areaFilter.toUpperCase()];
      if (mappedBranches) {
        availableBranches = availableBranches.filter(b => mappedBranches.includes(b));
      }
    }

    return {
      statuses: Array.from(statuses).sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
        return b.localeCompare(a);
      }),
      subStatuses: Array.from(subStatuses).sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
        return b.localeCompare(a);
      }),
      areas: sortedAreas,
      branches: availableBranches,
      tematik: Array.from(tematik).sort(),
      months: Array.from(months.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([value, label]) => ({ value, label })),
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
    };
  }, [initialProjects, areaFilter, projectConfig.dashboard.dateFilterColIndex, projectConfig.dashboard.tematikColIndex]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleSubStatusFilterChange = (val: string) => {
    setSubStatusFilter(val);
    setCurrentPage(1);
  };

  const handleAreaFilterChange = (val: string) => {
    setAreaFilter(val);
    setBranchFilter('');
    setCurrentPage(1);
  };

  const handleBranchFilterChange = (val: string) => {
    setBranchFilter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setSubStatusFilter('');
    setAreaFilter('');
    setBranchFilter('');
    setTematikFilter('');
    setMonthFilter('');
    setYearFilter('');
    setCurrentPage(1);
  };

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        p.id_ihld.toLowerCase().includes(lowerQuery) ||
        p.batch_program.toLowerCase().includes(lowerQuery) ||
        p.nama_lop.toLowerCase().includes(lowerQuery) ||
        p.status.toLowerCase().includes(lowerQuery) ||
        p.sub_status.toLowerCase().includes(lowerQuery)
      );

      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesSubStatus = !subStatusFilter || p.sub_status === subStatusFilter;
      const matchesArea = !areaFilter || p.area === areaFilter;
      const matchesBranch = !branchFilter || p.branch === branchFilter;
      const fullData = getFullDataArray(p);

      const tematikValue = projectConfig.dashboard.tematikColIndex === undefined
        ? ''
        : String(fullData[projectConfig.dashboard.tematikColIndex] ?? '').trim();
      const matchesTematik = !tematikFilter || tematikValue === tematikFilter;

      const filterDate = projectConfig.dashboard.dateFilterColIndex === undefined
        ? null
        : parseExcelDate(fullData[projectConfig.dashboard.dateFilterColIndex]);
      const matchesMonth = !monthFilter || (
        filterDate !== null &&
        String(filterDate.getMonth() + 1).padStart(2, '0') === monthFilter
      );
      const matchesYear = !yearFilter || (
        filterDate !== null &&
        String(filterDate.getFullYear()) === yearFilter
      );

      return matchesSearch && matchesStatus && matchesSubStatus && matchesArea && matchesBranch && matchesTematik && matchesMonth && matchesYear;
    });
  }, [initialProjects, searchQuery, statusFilter, subStatusFilter, areaFilter, branchFilter, tematikFilter, monthFilter, yearFilter, projectConfig.dashboard.dateFilterColIndex, projectConfig.dashboard.tematikColIndex]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);


  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('complete') || s.includes('closed')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (s.includes('cancel') || s.includes('reject') || s.includes('drop')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    if (s.includes('progress') || s.includes('ongoing')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  };

  const getFieldLabel = (fieldKey: string, fallback: string) => {
    return columnConfig?.find((field) => field.field_key === fieldKey)?.label ?? fallback;
  };

  return (
    <div className="w-full space-y-6">
      <FilterSection
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        searchPlaceholder={projectConfig.dashboard.searchPlaceholder}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
        subStatusFilter={subStatusFilter}
        setSubStatusFilter={handleSubStatusFilterChange}
        areaFilter={areaFilter}
        setAreaFilter={handleAreaFilterChange}
        branchFilter={branchFilter}
        setBranchFilter={handleBranchFilterChange}
        showAreaBranchFilters={projectConfig.dashboard.showAreaBranchFilters}
        areaLabel={projectConfig.dashboard.areaLabel}
        branchLabel={projectConfig.dashboard.branchLabel}
        tematikFilter={tematikFilter}
        setTematikFilter={projectConfig.dashboard.tematikColIndex !== undefined ? (val) => { setTematikFilter(val); setCurrentPage(1); } : undefined}
        tematikLabel={projectConfig.dashboard.tematikLabel}
        monthFilter={monthFilter}
        setMonthFilter={projectConfig.dashboard.dateFilterColIndex !== undefined ? (val) => { setMonthFilter(val); setCurrentPage(1); } : undefined}
        yearFilter={yearFilter}
        setYearFilter={projectConfig.dashboard.dateFilterColIndex !== undefined ? (val) => { setYearFilter(val); setCurrentPage(1); } : undefined}
        resetFilters={handleResetFilters}
        filterOptions={filterOptions}
      />

      {isRefreshing && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Updating dashboard data in real-time...
        </div>
      )}

      {projectType !== 'JPP' && (
        <PlanningChart projects={filteredProjects} projectType={projectType} />
      )}

      <div className="glass-panel rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[8%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-gray-100/80 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getFieldLabel('ID_IHLD', 'ID IHLD')} / {getFieldLabel('NAMA_LOP', 'Nama LOP')}</th>
                <th scope="col" className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub Status</th>
                <th scope="col" className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getFieldLabel('KOMITMEN_GOLIVE', 'Komitmen')}</th>
                <th scope="col" className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getFieldLabel('TANGGAL_GOLIVE', 'Tgl Golive')}</th>
                <th scope="col" className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durasi</th>
                <th scope="col" className="px-2 py-3.5 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((project, idx) => (
                  <ProjectRow
                    key={project.uid}
                    project={project}
                    index={idx}
                    isExpanded={expandedRow === project.uid}
                    onToggle={() => toggleRow(project.uid)}
                    getStatusColor={getStatusColor}
                    columnConfig={columnConfig}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Tidak ada proyek yang sesuai dengan pencarian.' : 'Belum ada data proyek. Silakan sinkronisasi data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> hingga{' '}
              <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}</span> dari{' '}
              <span className="font-medium text-gray-900 dark:text-white">{filteredProjects.length}</span> proyek
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
