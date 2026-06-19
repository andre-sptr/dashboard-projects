'use client';

import { type SetStateAction, useMemo, useState } from 'react';
import {
  Save,
  RotateCcw,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Columns3,
  FileSpreadsheet,
  Info,
  Loader2,
} from 'lucide-react';
import { indexToLetter, letterToIndex } from '@/lib/sheet-columns';
import type { ProjectType } from '@/types/database';
import { PROJECT_TYPES } from '@/lib/project-types';

interface ColumnConfigRow {
  field_key: string;
  label: string;
  header_text: string;
  col_index: number;
  sort_order: number;
}

interface Props {
  initialConfig?: ColumnConfigRow[];
  initialConfigs?: Record<ProjectType, ColumnConfigRow[]>;
  initialProjectType?: ProjectType;
  projectOptions?: { type: ProjectType; label: string }[];
}

interface DetectedEntry {
  field_key: string;
  detected_index: number;
  matched_header: string | null;
}

type Banner = { type: 'success' | 'error' | 'info'; text: string } | null;

const DEFAULT_PROJECT_OPTIONS = PROJECT_TYPES.map((type) => ({ type, label: type === 'NODEB' ? 'NodeB' : type }));
const EMPTY_ROWS: ColumnConfigRow[] = [];

function createInitialConfigState(
  initialConfig?: ColumnConfigRow[],
  initialConfigs?: Record<ProjectType, ColumnConfigRow[]>
): Record<ProjectType, ColumnConfigRow[]> {
  return {
    JPP: initialConfigs?.JPP ?? initialConfig ?? [],
    NODEB: initialConfigs?.NODEB ?? [],
    HEM: initialConfigs?.HEM ?? [],
  };
}

export default function ColumnConfigClient({
  initialConfig,
  initialConfigs,
  initialProjectType = 'JPP',
  projectOptions = DEFAULT_PROJECT_OPTIONS,
}: Props) {
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>(initialProjectType);
  const [rowsByProject, setRowsByProject] = useState<Record<ProjectType, ColumnConfigRow[]>>(() =>
    createInitialConfigState(initialConfig, initialConfigs)
  );
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resync, setResync] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);
  const selectedProject = projectOptions.find((project) => project.type === selectedProjectType);
  const projectLabel = selectedProject?.label ?? selectedProjectType;
  const rows = rowsByProject[selectedProjectType] ?? EMPTY_ROWS;
  const setRows = (updater: SetStateAction<ColumnConfigRow[]>) => {
    setRowsByProject((prev) => {
      const currentRows = prev[selectedProjectType] ?? [];
      const nextRows = typeof updater === 'function'
        ? (updater as (value: ColumnConfigRow[]) => ColumnConfigRow[])(currentRows)
        : updater;
      return { ...prev, [selectedProjectType]: nextRows };
    });
  };
  const handleProjectChange = (value: ProjectType) => {
    setSelectedProjectType(value);
    setBanner(null);
  };

  // Detect duplicate indices so the user is warned before saving an ambiguous map.
  const duplicateIndices = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of rows) counts.set(r.col_index, (counts.get(r.col_index) || 0) + 1);
    return new Set(Array.from(counts.entries()).filter(([, c]) => c > 1).map(([i]) => i));
  }, [rows]);
  const configuredHeaders = useMemo(() => rows.filter((r) => r.header_text.trim().length > 0).length, [rows]);
  const duplicateFieldCount = useMemo(
    () => rows.filter((r) => duplicateIndices.has(r.col_index)).length,
    [duplicateIndices, rows]
  );
  const minColumnIndex = useMemo(() => (rows.length > 0 ? Math.min(...rows.map((r) => r.col_index)) : 0), [rows]);
  const maxColumnIndex = useMemo(() => (rows.length > 0 ? Math.max(...rows.map((r) => r.col_index)) : 0), [rows]);
  const headerCoverage = rows.length > 0 ? Math.round((configuredHeaders / rows.length) * 100) : 0;
  const hasDuplicates = duplicateFieldCount > 0;
  const firstColumn = rows.length > 0 ? indexToLetter(minColumnIndex) : '--';
  const lastColumn = rows.length > 0 ? indexToLetter(maxColumnIndex) : '--';

  const setLetter = (field_key: string, letter: string) => {
    const idx = letterToIndex(letter);
    setRows((prev) =>
      prev.map((r) => (r.field_key === field_key ? { ...r, col_index: idx >= 0 ? idx : r.col_index } : r))
    );
  };

  const setHeaderText = (field_key: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.field_key === field_key ? { ...r, header_text: value } : r)));
  };

  const handleAutoDetect = async () => {
    if (detecting) return;
    setDetecting(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/column-config/headers?projectType=${selectedProjectType}`);
      const data = await res.json();
      if (!data.success) {
        setBanner({ type: 'error', text: data.error || 'Gagal mengambil header dari spreadsheet.' });
        return;
      }
      const detected: DetectedEntry[] = data.data.detected;
      const byKey = new Map(detected.map((d) => [d.field_key, d]));
      const matchedKeys = new Set(detected.filter((d) => d.detected_index >= 0).map((d) => d.field_key));
      const matched = rows.filter((r) => matchedKeys.has(r.field_key)).length;
      const unmatched = rows.length - matched;
      setRows((prev) =>
        prev.map((r) => {
          const d = byKey.get(r.field_key);
          if (d && d.detected_index >= 0) {
            return { ...r, col_index: d.detected_index };
          }
          return r;
        })
      );
      setBanner({
        type: unmatched === 0 ? 'success' : 'info',
        text: `Deteksi selesai: ${matched} kolom cocok${unmatched > 0 ? `, ${unmatched} tidak ditemukan (cek teks header).` : '.'}`,
      });
    } catch {
      setBanner({ type: 'error', text: 'Terjadi kesalahan jaringan saat deteksi header.' });
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch('/api/column-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: selectedProjectType,
          entries: rows.map((r) => ({
            field_key: r.field_key,
            col_index: r.col_index,
            header_text: r.header_text,
          })),
          resync,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ type: 'success', text: data.message });
      } else {
        setBanner({ type: 'error', text: data.error || 'Gagal menyimpan konfigurasi.' });
      }
    } catch {
      setBanner({ type: 'error', text: 'Terjadi kesalahan jaringan saat menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (saving) return;
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch('/api/column-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType: selectedProjectType, reset: true, resync }),
      });
      const data = await res.json();
      if (data.success) {
        setRows(data.data.config);
        setBanner({ type: 'success', text: data.message });
      } else {
        setBanner({ type: 'error', text: data.error || 'Gagal mereset konfigurasi.' });
      }
    } catch {
      setBanner({ type: 'error', text: 'Terjadi kesalahan jaringan saat mereset.' });
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || detecting;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Konfigurasi Kolom
          </h1>
          <p className="text-slate-500 mt-1">
            Petakan field {projectLabel} ke kolom di Google Spreadsheet. Sesuaikan kolom sumber.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
            <span>Project</span>
            <select
              aria-label="Project"
              value={selectedProjectType}
              onChange={(event) => handleProjectChange(event.target.value as ProjectType)}
              className="bg-transparent text-slate-900 focus:outline-none"
            >
              {projectOptions.map((project) => (
                <option key={project.type} value={project.type}>
                  {project.label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleAutoDetect}
            disabled={busy}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              busy ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
            }`}
          >
            {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Detect
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
              busy ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95'
            }`}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in slide-in-from-top-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : banner.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-blue-50 border-blue-100 text-blue-700'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{banner.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Columns3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Field Terkonfigurasi</h3>
          </div>
          <div className="text-xl font-bold text-slate-800">{rows.length} field</div>
          <p className="text-xs text-slate-400 mt-2">Dipetakan ke kolom spreadsheet</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-700">Deteksi Header</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800">{configuredHeaders}</span>
            <span className="text-sm text-slate-400">dari {rows.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{headerCoverage}% header siap untuk auto-detect</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${hasDuplicates ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {hasDuplicates ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <h3 className="font-semibold text-slate-700">Status Mapping</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasDuplicates ? (
              <>
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span className="text-xl font-bold text-slate-800">{duplicateFieldCount} duplikat</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="text-xl font-bold text-slate-800">Unik</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Berdasarkan indeks kolom saat ini</p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileSpreadsheet className="w-32 h-32" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Detail Pemetaan Kolom
              </h3>
              <p className="text-sm text-slate-400 max-w-2xl">
                Mengubah pemetaan hanya berpengaruh setelah data dibaca ulang dari spreadsheet.
              </p>
            </div>

            <label className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resync}
                onChange={(e) => setResync(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-semibold">Sinkronkan ulang</span>
                <span className="block text-xs text-slate-400">Jalankan resync setelah simpan</span>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-left text-slate-400 text-sm mb-1">Kolom Awal</p>
              <p className="text-left text-3xl font-bold">{firstColumn}</p>
            </div>
            <div>
              <p className="text-left text-emerald-400 text-sm mb-1">Kolom Akhir</p>
              <p className="text-left text-3xl font-bold">{lastColumn}</p>
            </div>
            <div>
              <p className="text-left text-blue-400 text-sm mb-1">Header Text</p>
              <p className="text-left text-3xl font-bold">{configuredHeaders}</p>
            </div>
            <div>
              <p className="text-left text-red-400 text-sm mb-1">Duplikat</p>
              <p className="text-left text-3xl font-bold">{duplicateFieldCount}</p>
            </div>
          </div>

          {hasDuplicates && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
              Ada field yang memakai kolom sama. Periksa baris yang ditandai duplikat sebelum menyimpan.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Columns3 className="w-5 h-5 text-slate-400" />
            Pemetaan Field - Kolom
          </h3>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Showing {rows.length} fields
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Teks Header (untuk deteksi)
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Kolom</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const isDup = duplicateIndices.has(r.col_index);
                return (
                  <tr key={r.field_key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{r.label}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{r.field_key}</p>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={r.header_text}
                        onChange={(e) => setHeaderText(r.field_key, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="text"
                        value={indexToLetter(r.col_index)}
                        onChange={(e) => setLetter(r.field_key, e.target.value)}
                        className={`w-20 rounded-lg border px-3 py-1.5 text-center text-sm font-mono uppercase focus:outline-none focus:ring-2 ${
                          isDup
                            ? 'border-red-300 bg-red-50 focus:ring-red-400'
                            : 'border-slate-200 focus:ring-blue-400'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500 font-mono">
                      {r.col_index}
                      {isDup && (
                        <span className="ml-1 text-[10px] text-red-500 font-sans">duplikat</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleReset}
          disabled={busy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            busy ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Reset ke Default
        </button>
      </div>
    </div>
  );
}
