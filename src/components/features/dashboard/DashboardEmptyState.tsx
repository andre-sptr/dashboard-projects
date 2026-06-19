import { FolderKanban, LayoutDashboard } from 'lucide-react';

export default function DashboardEmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <LayoutDashboard size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Pilih menu project di sidebar untuk melihat data operasional, report, atau KPI report.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <FolderKanban size={18} className="text-blue-600 dark:text-blue-400" />
          Project JPP, NodeB, dan HEM tersedia dari navigasi kiri.
        </div>
      </div>
    </div>
  );
}
