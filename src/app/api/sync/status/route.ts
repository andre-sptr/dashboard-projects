import { SyncLogRepository } from '@/repositories/SyncLogRepository';
import { SyncScheduler } from '@/lib/sync-scheduler';
import { successResponse } from '@/lib/response';

export async function GET() {
  const latestSync = SyncLogRepository.findLatest();
  const isRunning = SyncScheduler.isRunning();

  return successResponse({
    latestSync,
    isRunning,
    serverTime: new Date().toISOString(),
  });
}
