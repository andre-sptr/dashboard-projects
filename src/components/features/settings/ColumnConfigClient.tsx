'use client';

import { useMemo, useState } from 'react';
import {
  Save,
  RotateCcw,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Columns3,
  Loader2,
} from 'lucide-react';
import { indexToLetter, letterToIndex } from '@/lib/sheet-columns';

interface ColumnConfigRow {
  field_key: string;
  label: string;
  header_text: string;
  col_index: number;
  sort_order: number;
}

interface Props {
  initialConfig: ColumnConfigRow[];
}

interface DetectedEntry {
  field_key: string;
  detected_index: number;
  matched_header: string | null;
}

type Banner = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function ColumnConfigClient({ initialConfig }: Props) {
  const [rows, setRows] = useState<ColumnConfigRow[]>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resync, setResync] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);

  // Detect duplicate indices so the user is warned before saving an ambiguous map.
  const duplicateIndices = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of rows) counts.set(r.col_index, (counts.get(r.col_index) || 0) + 1);
    return new Set(Array.from(counts.entries()).filter(([, c]) => c > 1).map(([i]) => i));
  }, [rows]);

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
      const res = await fetch('/api/column-config/headers');
      const data = await res.json();
      if (!data.success) {
        setBanner({ type: 'error', text: data.error || 'Gagal mengambil header dari spreadsheet.' });
        return;
      }
      const detected: DetectedEntry[] = data.data.detected;
      const byKey = new Map(detected.map((d) => [d.field_key, d]));
      let matched = 0;
      let unmatched = 0;
      setRows((prev) =>
        prev.map((r) => {
          const d = byKey.get(r.field_key);
          if (d && d.detected_index >= 0) {
            matched++;
            return { ...r, col_index: d.detected_index };
          }
          unmatched++;
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
        body: JSON.stringify({ reset: true, resync }),
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
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Konfigurasi Kolom
          </h1>
          <p className="text-slate-500 mt-1">
            Petakan setiap field ke kolom di Google Spreadsheet. Sesuaikan saat kolom sumber bertambah atau berkurang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={busy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
              busy ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Deteksi dari Header
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg ${
              busy ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
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

      <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>
          Mengubah pemetaan hanya berpengaruh setelah data dibaca ulang. Biarkan &quot;Sinkronkan ulang&quot; aktif agar
          dashboard langsung memakai pemetaan baru.
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Columns3 className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800">Pemetaan Field → Kolom</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Teks Header (untuk deteksi)
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Kolom</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const isDup = duplicateIndices.has(r.col_index);
                return (
                  <tr key={r.field_key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-800">{r.label}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{r.field_key}</p>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={r.header_text}
                        onChange={(e) => setHeaderText(r.field_key, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={indexToLetter(r.col_index)}
                        onChange={(e) => setLetter(r.field_key, e.target.value)}
                        className={`w-20 rounded-lg border px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 ${
                          isDup
                            ? 'border-red-300 bg-red-50 focus:ring-red-400'
                            : 'border-slate-200 focus:ring-blue-400'
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 font-mono">
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

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={resync}
            onChange={(e) => setResync(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Sinkronkan ulang data setelah menyimpan
        </label>
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
