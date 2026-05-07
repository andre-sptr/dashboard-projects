import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T]) => string;
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Transform data
  const exportData = data.map(row => {
    const exportRow: Record<string, unknown> = {};
    columns.forEach(col => {
      const value = row[col.key];
      exportRow[col.label] = col.format ? col.format(value) : value;
    });
    return exportRow;
  });

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = columns.map(col => ({
    wch: Math.min(col.label.length + 5, maxWidth)
  }));
  ws['!cols'] = colWidths;

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Transform data
  const exportData = data.map(row => {
    const exportRow: Record<string, unknown> = {};
    columns.forEach(col => {
      const value = row[col.key];
      exportRow[col.label] = col.format ? col.format(value) : value;
    });
    return exportRow;
  });

  // Create CSV
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Made with Bob
