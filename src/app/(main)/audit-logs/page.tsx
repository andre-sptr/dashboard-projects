import AuditTimeline from '@/components/features/audit/AuditTimeline';

export default function AuditLogsPage() {
  return (
    <div className="space-y-8">
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
  );
}
