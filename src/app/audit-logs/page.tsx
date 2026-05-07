import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AuditTimeline from '@/components/features/audit/AuditTimeline';

export default function AuditLogsPage() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar open={false} onClose={() => { }} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
        <Topbar onMenuClick={() => { }} title={''} />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                System Audit Logs
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                Monitor and review all activities across the Sumbagteng Project Dashboard.
                Ensure accountability and track changes in real-time.
              </p>
            </div>

            <AuditTimeline />
          </div>
        </div>
      </main>
    </div>
  );
}
