import { normalizeBoqItems } from '@/lib/boq-items';

interface BoqPreviewTableProps {
  rows: unknown[];
}

function formatIdrOrDash(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '-';
  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

// The file's per-row TOTAL (column J) is often blank even when the totals
// material/jasa (H/I) are filled, so derive it: prefer J, then H+I, then
// fall back to unit price x volume.
function rowTotal(item: ReturnType<typeof normalizeBoqItems>[number]): number {
  if (item.total > 0) return item.total;
  const fromParts = item.total_material + item.total_jasa;
  if (fromParts > 0) return fromParts;
  return (item.harga_satuan_material + item.harga_satuan_jasa) * item.volume;
}

export default function BoqPreviewTable({ rows }: BoqPreviewTableProps) {
  const items = normalizeBoqItems(rows);

  if (items.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Tidak ada baris BoQ yang bisa ditampilkan.
      </div>
    );
  }

  const grandTotalMaterial = items.reduce((sum, r) => sum + r.total_material, 0);
  const grandTotalJasa = items.reduce((sum, r) => sum + r.total_jasa, 0);
  const grandTotalAll = items.reduce((sum, r) => sum + (r.is_section ? 0 : rowTotal(r)), 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-gray-700/50">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-yellow-400 dark:bg-yellow-500">
            <th rowSpan={2} className="px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">NO</th>
            <th rowSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">DESIGNATOR</th>
            <th rowSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">URAIAN PEKERJAAN</th>
            <th rowSpan={2} className="px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">SATUAN</th>
            <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">HARGA SATUAN (PAKET-2)</th>
            <th rowSpan={2} className="px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">VOL</th>
            <th colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">TOTAL HARGA (Rp.)</th>
            <th rowSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400 align-middle">KETERANGAN</th>
          </tr>
          <tr className="bg-yellow-400 dark:bg-yellow-500">
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">MATERIAL</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">JASA</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">MATERIAL</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">JASA</th>
            <th className="px-4 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border border-gray-400">TOTAL</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {items.map((row, rowIndex) => {
            if (row.is_section) {
              return (
                <tr key={`${row.designator}-${rowIndex}`} className="bg-red-500 dark:bg-red-600">
                  <td className="px-3 py-2 text-sm font-bold text-white text-center border border-gray-400">
                    {row.no || '-'}
                  </td>
                  <td colSpan={10} className="px-4 py-2 text-sm font-bold text-white border border-gray-400">
                    {row.designator !== '-' ? row.designator : ''}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={`${row.designator}-${rowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white text-center border border-gray-300 dark:border-gray-600">
                  {row.no || '-'}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                  {row.designator}
                </td>
                <td 
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 max-w-[320px] whitespace-normal"
                  title={row.uraian_pekerjaan || '-'}
                >
                  <div className="line-clamp-3">
                    {row.uraian_pekerjaan || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 text-center border border-gray-300 dark:border-gray-600">
                  {row.satuan || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right border border-gray-300 dark:border-gray-600 tabular-nums">
                  {formatIdrOrDash(row.harga_satuan_material)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right border border-gray-300 dark:border-gray-600 tabular-nums">
                  {formatIdrOrDash(row.harga_satuan_jasa)}
                </td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-center border border-gray-300 dark:border-gray-600 tabular-nums">
                  {row.volume > 0 ? row.volume.toLocaleString('id-ID') : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right border border-gray-300 dark:border-gray-600 tabular-nums bg-red-50/40 dark:bg-red-900/10">
                  {formatIdrOrDash(row.total_material)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right border border-gray-300 dark:border-gray-600 tabular-nums bg-blue-50/40 dark:bg-blue-900/10">
                  {formatIdrOrDash(row.total_jasa)}
                </td>
                <td className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-white text-right border border-gray-300 dark:border-gray-600 tabular-nums bg-yellow-50/50 dark:bg-yellow-900/20">
                  {formatIdrOrDash(rowTotal(row))}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                  {row.keterangan === '-' ? '' : row.keterangan || '-'}
                </td>
              </tr>
            );
          })}

          <tr className="bg-gray-100 dark:bg-gray-700/60">
            <td colSpan={6} className="px-4 py-2 text-sm text-right font-bold border border-gray-400 text-gray-900 dark:text-white uppercase tracking-wider">MATERIAL</td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white">{formatIdrOrDash(grandTotalMaterial)}</td>
            <td className="px-4 py-2 border border-gray-400 bg-red-50/60 dark:bg-red-900/20"></td>
            <td className="px-4 py-2 border border-gray-400 bg-blue-50/60 dark:bg-blue-900/20"></td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white bg-yellow-50/60 dark:bg-yellow-900/20">{formatIdrOrDash(grandTotalMaterial)}</td>
            <td className="border border-gray-400"></td>
          </tr>
          <tr className="bg-gray-100 dark:bg-gray-700/60">
            <td colSpan={6} className="px-4 py-2 text-sm text-right font-bold border border-gray-400 text-gray-900 dark:text-white uppercase tracking-wider">JASA</td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white">{formatIdrOrDash(grandTotalJasa)}</td>
            <td className="px-4 py-2 border border-gray-400 bg-red-50/60 dark:bg-red-900/20"></td>
            <td className="px-4 py-2 border border-gray-400 bg-blue-50/60 dark:bg-blue-900/20"></td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white bg-yellow-50/60 dark:bg-yellow-900/20">{formatIdrOrDash(grandTotalJasa)}</td>
            <td className="border border-gray-400"></td>
          </tr>
          <tr className="bg-gray-100 dark:bg-gray-700/60">
            <td colSpan={6} className="px-4 py-2 text-sm text-right font-bold border border-gray-400 text-gray-900 dark:text-white uppercase tracking-wider">TOTAL</td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white">{formatIdrOrDash(grandTotalAll)}</td>
            <td className="px-4 py-2 border border-gray-400 bg-red-50/60 dark:bg-red-900/20"></td>
            <td className="px-4 py-2 border border-gray-400 bg-blue-50/60 dark:bg-blue-900/20"></td>
            <td className="px-4 py-2 text-sm text-right font-bold border border-gray-400 tabular-nums text-gray-900 dark:text-white bg-yellow-50/60 dark:bg-yellow-900/20">{formatIdrOrDash(grandTotalAll)}</td>
            <td className="border border-gray-400"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
