'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/webhook', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        router.refresh();
      } else {
        alert('Gagal sinkronisasi: ' + data.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat sinkronisasi.');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
    >
      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
      {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
    </button>
  );
}
