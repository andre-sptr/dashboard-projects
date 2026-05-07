import cron from 'node-cron';
import { SyncService } from './sync-service';

export class SyncScheduler {
  private static job: cron.ScheduledTask | null = null;

  static start() {
    if (this.job) {
      console.log('[SyncScheduler] Job already running');
      return;
    }

    // Schedule sync every hour
    this.job = cron.schedule('0 * * * *', async () => {
      console.log('[SyncScheduler] Starting scheduled sync...');
      try {
        const result = await SyncService.syncProjects();
        console.log('[SyncScheduler] Sync completed:', result);
      } catch (error) {
        console.error('[SyncScheduler] Sync failed:', error);
      }
    });

    console.log('[SyncScheduler] Job started (Hourly)');
  }

  static stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('[SyncScheduler] Job stopped');
    }
  }

  static isRunning() {
    return !!this.job;
  }
}
