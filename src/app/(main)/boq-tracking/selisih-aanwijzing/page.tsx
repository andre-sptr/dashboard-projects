'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, AlertCircle } from 'lucide-react';
import type { ApiResponse } from '@/lib/response';

interface SelisihAanwijzingSummaryRow {
  branch_fmc: string;
  port_plan: number;
  boq_plan: number;
  cpp_plan: number;
  port_aanwijzing: number;
  boq_aanwijzing: number;
  cpp_aanwijzing: number;
  kenaikan_boq: number;
  persen_kenaikan: number;
}

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0,00%';
  return percentFormatter.format(value / 100);
}

export default function SelisihAanwijzingPage() {
  const router = useRouter();
  const [data, setData] = useState<SelisihAanwijzingSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Week filter
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        let query = '';
        if (selectedWeek) {
          const [yearStr, weekStr] = selectedWeek.split('-W');
          const year = Number(yearStr);
          const week = Number(weekStr);
          
          if (!isNaN(year) && !isNaN(week)) {
            const d = new Date(year, 0, 1);
            const days = d.getDay() || 7;
            d.setDate(d.getDate() + 4 - days);
            d.setDate(d.getDate() + (week - 1) * 7);
            
            const start = new Date(d);
            start.setDate(start.getDate() - 3);
            
            const end = new Date(d);
            end.setDate(end.getDate() + 3);

            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            query = `?startDate=${startDate}&endDate=${endDate}`;
          }
        }

        const res = await fetch(`/api/boq/selisih-aanwijzing${query}`);
        const response = (await res.json()) as ApiResponse<SelisihAanwijzingSummaryRow[]>;

        if (!active) return;

        if (!response.success) {
          setError(response.error || response.message || 'Gagal mengambil data.');
          return;
        }

        setData(response.data || []);
      } catch (err) {
        if (active) {
          console.error('Failed to load selisih aanwijzing:', err);
          setError('Terjadi kesalahan saat mengambil data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [selectedWeek]);

  const totals = useMemo(() => {
    const agg = data.reduce(
      (acc, row) => {
        acc.port_plan += row.port_plan;
        acc.boq_plan += row.boq_plan;
        acc.port_aanwijzing += row.port_aanwijzing;
        acc.boq_aanwijzing += row.boq_aanwijzing;
        return acc;
      },
      { port_plan: 0, boq_plan: 0, port_aanwijzing: 0, boq_aanwijzing: 0 }
    );

    const cpp_plan = agg.port_plan > 0 ? agg.boq_plan / agg.port_plan : 0;
    const cpp_aanwijzing = agg.port_aanwijzing > 0 ? agg.boq_aanwijzing / agg.port_aanwijzing : 0;
    const kenaikan_boq = agg.boq_aanwijzing - agg.boq_plan;
    const persen_kenaikan = agg.boq_plan > 0 ? (kenaikan_boq / agg.boq_plan) * 100 : 0;

    return {
      ...agg,
      cpp_plan,
      cpp_aanwijzing,
      kenaikan_boq,
      persen_kenaikan,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Selisih AANWIJZING
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Perbandingan nilai BoQ Plan dengan BoQ Aanwijzing per Branch FMC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Calendar size={16} />
            </div>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto h-9 w-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Memuat data selisih...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    BRANCH FMC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Port Plan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    BOQ Plan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    CPP Plan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Port Aanwijzing
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    BOQ Aanwijzing
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    CPP Aanwijzing
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Kenaikan BoQ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    % kenaikan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {data.length > 0 ? (
                  data.map((row) => (
                    <tr key={row.branch_fmc} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {row.branch_fmc}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.port_plan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.boq_plan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.cpp_plan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.port_aanwijzing)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.boq_aanwijzing)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.cpp_aanwijzing)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700 dark:text-gray-300">
                        {formatNumber(row.kenaikan_boq)}
                      </td>
                      <td 
                        className={`px-4 py-3 text-sm text-center tabular-nums font-semibold
                          ${row.persen_kenaikan > 10 
                            ? 'bg-red-600 text-white dark:bg-red-600 dark:text-white' 
                            : 'text-gray-900 dark:text-white'
                          }`}
                      >
                        {formatPercent(row.persen_kenaikan)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Tidak ada data untuk ditampilkan.
                    </td>
                  </tr>
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-800/80 border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                      Grand Total
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.port_plan)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.boq_plan)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.cpp_plan)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.port_aanwijzing)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.boq_aanwijzing)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.cpp_aanwijzing)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatNumber(totals.kenaikan_boq)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center tabular-nums font-bold text-gray-900 dark:text-white">
                      {formatPercent(totals.persen_kenaikan)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
