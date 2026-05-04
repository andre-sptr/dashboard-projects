'use client';

import React, { useState, useMemo } from 'react';
import { Project } from '@/lib/db';
import { calculateCurrentDuration, formatDuration, formatHistory, HistoryEntry } from '@/utils/duration';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface Props {
  initialProjects: Project[];
}

const ITEMS_PER_PAGE = 10;

export const RAW_DATA_HEADERS = [
  'TAHUN', 'ID-IHLD', 'NAMA LOP', 'REGIONAL', 'AREA', 'STO', 'REGION FMC', 'BRANCH FMC',
  'BATCH PROGRAM', 'ODP PLAN', 'PORT PLAN', 'CPP', 'BOQ', 'Mitra', 'Status', 'SUB STATUS',
  'DETAIL STATUS', 'KOMITMEN GOLIVE', 'TARGET GOLIVE', 'Prioritas 1 by Tsel', 'PID (PROACTIVE)', 'WASPANG', 'PROJECT ADMIN', 'STATUS GOLIVE',
  'KENDALA GOLIVE', 'Progres MINOL', 'REAL JML ODP 8', 'REAL JML ODP 16', 'ID SW ABD', 'REAL JML PORT GOLIVE', 'TANGGAL GOLIVE', 'KET'
];

const DATE_COLUMN_INDICES = new Set([17, 18, 30]);
const NUMBER_COLUMN_INDICES = new Set([12]);

function formatExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === '' || String(value).trim() === '#N/A') return '-';
  const serial = Number(value);
  if (isNaN(serial) || serial < 1) return String(value);
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function DashboardClient({ initialProjects }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');

  const areaBranchMap: Record<string, string[]> = {
    'RIDAR': ['DUMAI', 'PEKANBARU'],
    'RIKEP': ['BATAM'],
    'SUMBAR': ['BUKIT TINGGI', 'PADANG']
  };

  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const subStatuses = new Set<string>();
    const areas = new Set<string>();
    const branches = new Set<string>();

    initialProjects.forEach(p => {
      if (p.status) statuses.add(p.status);
      if (p.sub_status) subStatuses.add(p.sub_status);

      try {
        const fd = JSON.parse(p.full_data || '[]');
        if (Array.isArray(fd)) {
          if (fd[4]) areas.add(String(fd[4]).toUpperCase());
          if (fd[7]) branches.add(String(fd[7]).toUpperCase());
        }
      } catch { }
    });

    const sortedAreas = Array.from(areas).sort();

    let availableBranches = Array.from(branches).sort();
    if (areaFilter) {
      const mappedBranches = areaBranchMap[areaFilter.toUpperCase()];
      if (mappedBranches) {
        availableBranches = availableBranches.filter(b => mappedBranches.includes(b));
      }
    }

    return {
      statuses: Array.from(statuses).sort(),
      subStatuses: Array.from(subStatuses).sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
        return b.localeCompare(a);
      }),
      areas: sortedAreas,
      branches: availableBranches,
    };
  }, [initialProjects, areaFilter]);

  React.useEffect(() => {
    if (areaFilter && branchFilter) {
      const mappedBranches = areaBranchMap[areaFilter.toUpperCase()];
      if (mappedBranches && !mappedBranches.includes(branchFilter.toUpperCase())) {
        setBranchFilter('');
      }
    }
  }, [areaFilter]);

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

      let fd: unknown[] = [];
      try {
        fd = JSON.parse(p.full_data || '[]');
      } catch { }

      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesSubStatus = !subStatusFilter || p.sub_status === subStatusFilter;
      const matchesArea = !areaFilter || String(fd[4]) === areaFilter;
      const matchesBranch = !branchFilter || String(fd[7]) === branchFilter;

      return matchesSearch && matchesStatus && matchesSubStatus && matchesArea && matchesBranch;
    });
  }, [initialProjects, searchQuery, statusFilter, subStatusFilter, areaFilter, branchFilter]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, subStatusFilter, areaFilter, branchFilter]);

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

  const DurationCounter = ({ lastChangedAt }: { lastChangedAt: string }) => {
    const [duration, setDuration] = useState(() => calculateCurrentDuration(lastChangedAt));

    React.useEffect(() => {
      const interval = setInterval(() => {
        setDuration(calculateCurrentDuration(lastChangedAt));
      }, 60000);
      return () => clearInterval(interval);
    }, [lastChangedAt]);

    return <>{duration}</>;
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Filter Section */}
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
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sub Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Sub Status</label>
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.subStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>


          {/* Area Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Area</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.areas.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="block w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Semua</option>
              {filterOptions.branches.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {(statusFilter || subStatusFilter || areaFilter || branchFilter || searchQuery) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setSubStatusFilter('');
                setAreaFilter('');
                setBranchFilter('');
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID IHLD / Nama LOP</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal Golive</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durasi Sub Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((project) => {
                  const isExpanded = expandedRow === project.uid;
                  let parsedHistory: HistoryEntry[] = [];
                  let fullData: unknown[] = [];

                  try {
                    parsedHistory = JSON.parse(project.history || '[]');
                  } catch { }

                  try {
                    const parsed = JSON.parse(project.full_data || '[]');
                    fullData = Array.isArray(parsed) ? parsed : [];
                  } catch { }

                  const displayTanggalGolive = formatExcelDate(fullData[30]);

                  return (
                    <React.Fragment key={project.uid}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onClick={() => toggleRow(project.uid)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{project.id_ihld}</div>
                          {project.batch_program && (
                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-wide">
                              {project.batch_program}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs" title={project.nama_lop}>
                            {project.nama_lop || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                            {project.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                          {project.sub_status || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {displayTanggalGolive !== '-' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              {displayTanggalGolive}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            <DurationCounter lastChangedAt={project.last_changed_at} />
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(project.uid);
                            }}
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Content */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-6">
                                  {/* Riwayat Status */}
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                      <Info size={16} className="text-blue-500" />
                                      Riwayat Perubahan Status
                                    </h4>
                                    <div className="max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                                      {(() => {
                                        const statusGroups = parsedHistory.reduce<{ status: string; duration_minutes: number; ended_at: string }[]>((acc, h) => {
                                          const last = acc[acc.length - 1];
                                          if (last && last.status === h.status) {
                                            last.duration_minutes += h.duration_minutes;
                                            last.ended_at = h.ended_at;
                                          } else {
                                            acc.push({ status: h.status, duration_minutes: h.duration_minutes, ended_at: h.ended_at });
                                          }
                                          return acc;
                                        }, []);

                                        const hasRealStatusChange = statusGroups.some(
                                          (g) => g.status !== project.status
                                        );

                                        return hasRealStatusChange ? (
                                          <ul className="space-y-2">
                                            {statusGroups.map((h, i) => (
                                              <li key={i} className="flex flex-col text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{h.status}</span>
                                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                                                    {formatDuration(h.duration_minutes)}
                                                  </span>
                                                </div>
                                                {h.ended_at && (
                                                  <span className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                                                    Berubah: {new Date(h.ended_at.includes('T') ? h.ended_at : h.ended_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-500 italic">Belum ada riwayat perubahan status.</p>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Riwayat Sub Status */}
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                      <Info size={16} className="text-indigo-500" />
                                      Riwayat Perubahan Sub Status
                                    </h4>
                                    <div className="max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                                      {parsedHistory.length > 0 ? (
                                        <ul className="space-y-2">
                                          {parsedHistory.map((h, i) => (
                                            <li key={i} className="flex flex-col text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{h.sub_status || '-'}</span>
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shrink-0">
                                                  {formatDuration(h.duration_minutes)}
                                                </span>
                                              </div>
                                              {h.ended_at && (
                                                <span className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                                                  Berubah: {new Date(h.ended_at.includes('T') ? h.ended_at : h.ended_at.replace(' ', 'T') + 'Z').toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">Belum ada riwayat perubahan sub status.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Raw Data A-AF */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Info size={16} className="text-purple-500" />
                                    Data Kolom Mentah (Raw)
                                  </h4>
                                  <div className="flex-1 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
                                    {fullData.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                        {RAW_DATA_HEADERS.map((headerName, idx) => {
                                          const val = fullData[idx];
                                          const isEmpty = val === null || val === undefined || val === '' || String(val).trim() === '#N/A';
                                          const displayVal = DATE_COLUMN_INDICES.has(idx)
                                            ? formatExcelDate(val)
                                            : NUMBER_COLUMN_INDICES.has(idx)
                                              ? isEmpty ? '-' : (isNaN(Number(val)) ? String(val) : Number(val).toLocaleString('en-US'))
                                              : isEmpty ? '-' : String(val);
                                          const isGolive = idx === 30;
                                          return (
                                            <div
                                              key={idx}
                                              className={`flex flex-col border-b pb-1 ${isGolive
                                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 rounded'
                                                : 'border-gray-100 dark:border-gray-700'
                                                }`}
                                            >
                                              <span className={`font-semibold text-[10px] tracking-wider uppercase ${isGolive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                                                }`}>
                                                {isGolive ? '★ ' : ''}{headerName}
                                              </span>
                                              <span
                                                className={`truncate font-medium ${isGolive
                                                  ? 'text-emerald-800 dark:text-emerald-300'
                                                  : 'text-gray-800 dark:text-gray-300'
                                                  }`}
                                                title={displayVal}
                                              >
                                                {displayVal}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 italic">Data mentah tidak tersedia.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Tidak ada proyek yang sesuai dengan pencarian.' : 'Belum ada data proyek. Silakan sinkronisasi data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
