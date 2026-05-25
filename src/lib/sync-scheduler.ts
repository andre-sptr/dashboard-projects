import * as cron from 'node-cron';
import { SyncService } from './sync-service';

type SyncSchedulerGlobalState = {
  job: cron.ScheduledTask | null;
};

const syncSchedulerState = ((globalThis as typeof globalThis & {
  __dashboardSyncScheduler?: SyncSchedulerGlobalState;
}).__dashboardSyncScheduler ??= {
  job: null,
});

export class SyncScheduler {
  static start() {
    if (syncSchedulerState.job) {
      return;
    }

    const schedule = process.env.SYNC_CRON_SCHEDULE || '0 * * * *';
    syncSchedulerState.job = cron.schedule(schedule, async () => {
      try {
        await SyncService.syncProjects();
      } catch (error) {
        console.error('[SyncScheduler] Automatic background sync failed:', error);
      }
    });
  }

  static stop() {
    if (syncSchedulerState.job) {
      syncSchedulerState.job.stop();
      syncSchedulerState.job = null;
    }
  }

  static isRunning() {
    return !!syncSchedulerState.job;
  }
}
