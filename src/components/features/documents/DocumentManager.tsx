'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  File, 
  Upload, 
  Trash2, 
  Download, 
  Plus, 
  X, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  FileCode,
  AlertCircle
} from 'lucide-react';

interface Document {
  id: string;
  project_uid: string;
  category: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  upload_date: string;
  notes: string;
}

interface Props {
  projectUid: string;
}

export default function DocumentManager({ projectUid }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: 'General',
    notes: '',
    file: null as File | null
  });
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?projectUid=${projectUid}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [projectUid]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDocuments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('projectUid', projectUid);
    formData.append('category', uploadData.category);
    formData.append('notes', uploadData.notes);
    formData.append('uploadedBy', 'User'); // In real app, get from auth

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      await fetchDocuments();
      setShowUploadModal(false);
      setUploadData({ category: 'General', notes: '', file: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv')) return <FileCode className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <File size={16} className="text-blue-500" />
          Project Documents
        </h4>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          Upload
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-800">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm">Loading documents...</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
                  {getFileIcon(doc.mime_type)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                    {doc.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded uppercase font-semibold">
                      {doc.category}
                    </span>
                    <span>•</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.upload_date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={doc.file_path} 
                  download 
                  className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
          <File size={32} strokeWidth={1} />
          <p className="text-sm font-medium">No documents yet</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Upload your first document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  File
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {uploadData.file ? uploadData.file.name : 'Click or drag to upload'}
                    </span>
                    <span className="text-xs text-gray-400">PDF, Excel, Images (Max 10MB)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>General</option>
                    <option>Design / Drawing</option>
                    <option>BOQ / Price</option>
                    <option>Handover / BAST</option>
                    <option>Permit</option>
                    <option>Photo / Evidence</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Notes
                </label>
                <textarea
                  value={uploadData.notes}
                  onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                  placeholder="Add details about this document..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadData.file}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
