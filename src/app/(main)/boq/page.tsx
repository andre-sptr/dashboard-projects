'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface BoqRow {
  id_ihld: string;
  batch_program: string;
  full_data: string;
}

interface BoqData {
  id: string;
  nama_lop: string;
  id_ihld: string;
  sto: string;
  batch_program: string;
  project_name: string;
  region: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 5;

export default function BoqPage() {
  const [boqList, setBoqList] = useState<BoqData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBoq, setSelectedBoq] = useState<BoqData | null>(null);
  const [detailRows, setDetailRows] = useState<BoqRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/boq');
      const data = await res.json();
      setBoqList(data.boq || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showNotification('error', 'Format file harus .xlsx atau .xls');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/boq', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', data.message || 'File berhasil diupload');
        fetchData();
      } else {
        showNotification('error', data.error || 'Gagal upload file');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      showNotification('error', 'Gagal upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const res = await fetch(`/api/boq?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Data berhasil dihapus');
        fetchData();
      } else {
        showNotification('error', 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('error', 'Gagal menghapus data');
    }
  };

  const parseRowCount = (fullData: string): number => {
    try {
      const parsed = JSON.parse(fullData);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const handleViewDetails = (item: BoqData) => {
    try {
      const parsed = JSON.parse(item.full_data);
      setDetailRows(parsed);
      setSelectedBoq(item);
    } catch (error) {
      console.error('Error parsing detail data:', error);
      showNotification('error', 'Gagal memuat detail data');
    }
  };

  const handleCloseDetails = () => {
    setSelectedBoq(null);
    setDetailRows([]);
  };

  const totalPages = Math.ceil(boqList.length / ITEMS_PER_PAGE);
  const paginatedData = boqList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-right-4 ${
          notification.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bill of Quantity</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Import dan kelola data BoQ dari file Excel
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload size={18} className="text-blue-600" />
          Upload File Excel
        </h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-6 sm:p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files?.[0] as File)}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Mengupload file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Upload size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Klik atau drag file Excel ke sini
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: .xlsx atau .xls
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-400 mt-3">
          File Excel harus memiliki format: PROJECT: [nama] di cell A2, STO: [sto] di cell A3, dan tabel data di baris berikutnya.
        </p>
      </div>

      {/* Data List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {paginatedData.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project / STO</th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Data Rows</th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {item.project_name || item.nama_lop}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[200px] flex items-center gap-1">
                          <span className="font-medium">STO:</span> {item.sto || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                          {parseRowCount(item.full_data)} rows
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> dari <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Belum ada data BoQ. Upload file Excel untuk memulai.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBoq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseDetails}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBoq.project_name || selectedBoq.nama_lop}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  STO: {selectedBoq.sto} | {detailRows.length} Data Rows
                </p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-auto max-h-[calc(90vh-120px)] p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID IHLD</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch Program</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {detailRows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {row.id_ihld || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {row.batch_program || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={handleCloseDetails}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}