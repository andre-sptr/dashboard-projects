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

    // Schedule sync every hour
    syncSchedulerState.job = cron.schedule('0 * * * *', async () => {
      try {
        const result = await SyncService.syncProjects();
      } catch (error) {
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
