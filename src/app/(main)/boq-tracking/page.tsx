// BoQ designator inventory and cost tracking page
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Layers,
  Package,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import type { ApiResponse } from '@/lib/response';

interface ProjectOption {
  nama_lop: string;
  id_ihld: string;
}

interface TrackingRow {
  designator: string;
  jumlah_project?: number;
  aanwijzing_vol: number;
  aanwijzing_cost: number;
  ut_vol: number;
  ut_cost: number;
  remaining_vol: number;
  remaining_cost: number;
}

interface TrackingResponse {
  type: 'global' | 'project';
  id_ihld?: string;
  tracking: TrackingRow[];
}

interface BoqResponse {
  projects: ProjectOption[];
}

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
  onClick?: () => void;
}

function truncateDesignator(text: string, maxLen = 18): string {
  if (!text || text.length <= maxLen) return text || '-';
  return text.slice(0, maxLen) + '…';
}

const ITEMS_PER_PAGE = 15;

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return numberFormatter.format(value);
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return 'Rp0';
  return currencyFormatter.format(value);
}

function getStatus(row: TrackingRow) {
  if (row.remaining_vol < 0 || row.remaining_cost < 0) {
    return {
      label: 'Selisih AANWIJZING',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
  }

  if (row.ut_vol === 0) {
    return {
      label: 'Belum Terpakai',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
  }

  if (row.remaining_vol === 0) {
    return {
      label: 'Habis',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    };
  }

  return {
    label: 'Tersisa',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
}

function KpiCard({ icon: Icon, label, value, sub, color, onClick }: KpiCardProps) {
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm ${
        interactive
          ? 'cursor-pointer transition hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500'
          : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ${color} text-white flex items-center justify-center shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums truncate">
            {value}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BoqTrackingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [search, setSearch] = useState('');
  const [searchProject, setSearchProject] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const res = await fetch('/api/boq');
        const response = (await res.json()) as ApiResponse<BoqResponse>;

        if (!active) return;

        if (!response.success) {
          setError(response.error || response.message || 'Gagal mengambil daftar project.');
          return;
        }

        setProjects(response.data?.projects || []);
      } catch (err) {
        if (active) {
          console.error('Failed to load BoQ projects:', err);
          setError('Gagal mengambil daftar project.');
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTracking() {
      setLoadingTracking(true);
      setError(null);

      try {
        const params = selectedProject
          ? `?id_ihld=${encodeURIComponent(selectedProject)}`
          : '';
        const res = await fetch(`/api/boq/tracking${params}`);
        const response = (await res.json()) as ApiResponse<TrackingResponse>;

        if (!active) return;

        if (!response.success) {
          setRows([]);
          setError(response.error || response.message || 'Gagal mengambil tracking BoQ.');
          return;
        }

        setRows(response.data?.tracking || []);
      } catch (err) {
        if (active) {
          console.error('Failed to load BoQ tracking:', err);
          setRows([]);
          setError('Gagal mengambil tracking BoQ.');
        }
      } finally {
        if (active) setLoadingTracking(false);
      }
    }

    loadTracking();

    return () => {
      active = false;
    };
  }, [refreshKey, selectedProject]);

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProject) return 'Semua Project';
    const project = projects.find((item) => item.id_ihld === selectedProject);
    return project ? `${project.nama_lop} (${project.id_ihld})` : selectedProject;
  }, [projects, selectedProject]);

  const filteredProjects = useMemo(() => {
    const keyword = searchProject.toLowerCase();
    return projects.filter(p =>
      p.nama_lop.toLowerCase().includes(keyword) ||
      p.id_ihld.toLowerCase().includes(keyword)
    );
  }, [projects, searchProject]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => row.designator.toLowerCase().includes(keyword));
  }, [rows, search]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // Reset page when search or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProject]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        aanwijzingVol: acc.aanwijzingVol + row.aanwijzing_vol,
        aanwijzingCost: acc.aanwijzingCost + row.aanwijzing_cost,
        utVol: acc.utVol + row.ut_vol,
        utCost: acc.utCost + row.ut_cost,
        remainingVol: acc.remainingVol + row.remaining_vol,
        remainingCost: acc.remainingCost + row.remaining_cost,
        overAanwijzing: acc.overAanwijzing + (row.remaining_vol < 0 || row.remaining_cost < 0 ? 1 : 0),
      }),
      {
        aanwijzingVol: 0,
        aanwijzingCost: 0,
        utVol: 0,
        utCost: 0,
        remainingVol: 0,
        remainingCost: 0,
        overAanwijzing: 0,
      }
    );
  }, [rows]);

  const refreshTracking = () => {
    setRefreshKey((current) => current + 1);
  };

  const isLoading = loadingProjects || loadingTracking;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Tracking Designator
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {selectedProjectLabel}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative min-w-0 sm:min-w-[400px]">
            <div className="relative">
              <input
                type="text"
                value={showProjectDropdown ? searchProject : (selectedProject ? selectedProjectLabel : '')}
                onChange={(e) => {
                  setSearchProject(e.target.value);
                  setShowProjectDropdown(true);
                  if (!e.target.value) {
                    setSelectedProject('');
                  }
                }}
                onFocus={() => setShowProjectDropdown(true)}
                onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
                disabled={loadingProjects}
                className="w-full h-10 px-3 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                placeholder="Semua Project..."
                autoComplete="off"
              />
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
            </div>

            {showProjectDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject('');
                    setSearchProject('');
                    setShowProjectDropdown(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white">Semua Project</div>
                </button>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedProject(p.id_ihld);
                        setSearchProject(p.nama_lop);
                        setShowProjectDropdown(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{p.nama_lop}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.id_ihld}</div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada hasil
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={refreshTracking}
            disabled={loadingTracking}
            className="inline-flex h-10 items-center justify-center gap-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={16} className={loadingTracking ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Layers}
          label="Total Designator"
          value={formatNumber(rows.length)}
          sub={`AANWIJZING ${formatNumber(totals.aanwijzingVol)} qty`}
          color="bg-blue-600"
        />
        <KpiCard
          icon={ClipboardList}
          label="Sisa Qty"
          value={formatNumber(totals.remainingVol)}
          sub={`Terpakai ${formatNumber(totals.utVol)} qty`}
          color="bg-emerald-600"
        />
        <KpiCard
          icon={Wallet}
          label="Cost Keluar"
          value={formatCurrency(totals.utCost)}
          sub={`AANWIJZING ${formatCurrency(totals.aanwijzingCost)}`}
          color="bg-indigo-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Selisih AANWIJZING"
          value={formatNumber(totals.overAanwijzing)}
          sub={`Nilai sisa ${formatCurrency(totals.remainingCost)}`}
          color="bg-rose-600"
          onClick={() => router.push('/boq-tracking/selisih-aanwijzing')}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Detail Designator
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {formatNumber(filteredRows.length)} dari {formatNumber(rows.length)} designator
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari designator..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto h-9 w-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Memuat tracking BoQ...
            </p>
          </div>
        ) : filteredRows.length > 0 ? (
          <>
          <div>
            <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="w-[22%] px-3 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Designator
                  </th>
                  {!selectedProject && (
                    <th className="w-[7%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Project
                    </th>
                  )}
                  <th className="w-[10%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    AANW. Qty
                  </th>
                  <th className="w-[9%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Terpakai
                  </th>
                  <th className="w-[9%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Sisa Qty
                  </th>
                  <th className="w-[14%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Cost Keluar
                  </th>
                  <th className="w-[14%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Nilai Sisa
                  </th>
                  <th className="w-[15%] px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {paginatedRows.map((row) => {
                  const status = getStatus(row);
                  const usedPercent = row.aanwijzing_vol > 0
                    ? Math.min(100, Math.max(0, (row.ut_vol / row.aanwijzing_vol) * 100))
                    : row.ut_vol > 0
                      ? 100
                      : 0;

                  return (
                    <tr key={row.designator} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                            <Package size={15} />
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate" title={row.designator || '-'}>
                              {truncateDesignator(row.designator)}
                            </div>
                            <div className="mt-1 h-1 w-24 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${row.remaining_vol < 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${usedPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      {!selectedProject && (
                        <td className="px-3 py-3 text-center text-xs text-gray-700 dark:text-gray-300 tabular-nums">
                          {formatNumber(row.jumlah_project || 0)}
                        </td>
                      )}
                      <td className="px-3 py-3 text-center text-xs text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatNumber(row.aanwijzing_vol)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatNumber(row.ut_vol)}
                      </td>
                      <td className={`px-3 py-3 text-center text-xs font-bold tabular-nums ${row.remaining_vol < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatNumber(row.remaining_vol)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-700 dark:text-gray-300 tabular-nums truncate">
                        {formatCurrency(row.ut_cost)}
                      </td>
                      <td className={`px-3 py-3 text-center text-xs font-semibold tabular-nums truncate ${row.remaining_cost < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(row.remaining_cost)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Menampilkan{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * ITEMS_PER_PAGE) + 1}
                </span>{' '}hingga{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)}
                </span>{' '}dari{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {filteredRows.length}
                </span>{' '}designator
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
          </>
        ) : (
          <div className="px-6 py-14 text-center">
            <Package size={42} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Belum ada data tracking BoQ.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Import BoQ AANWIJZING dan BoQ UT agar sisa designator dapat dihitung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
