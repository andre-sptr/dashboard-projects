import * as cron from 'node-cron';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { computeProjectRisk, getDaysSinceChanged } from './risk-criteria';
import { buildAlertMessage, sendWahaAlert } from './waha-alert';
import type { RiskyProjectDTO } from '@/types/dashboard';

type AlertSchedulerGlobalState = {
  job: cron.ScheduledTask | null;
};

const alertSchedulerState = ((globalThis as typeof globalThis & {
  __dashboardAlertScheduler?: AlertSchedulerGlobalState;
}).__dashboardAlertScheduler ??= {
  job: null,
});

function getWahaConfig() {
  const url = process.env.WAHA_URL;
  const session = process.env.WAHA_SESSION;
  const apiKey = process.env.WAHA_API_KEY;
  const rawGroupIds = process.env.WAHA_GROUP_IDS ?? '';
  const groupIds = rawGroupIds.split(',').map(s => s.trim()).filter(Boolean);

  if (!url || !session || !apiKey || groupIds.length === 0) {
    return null;
  }
  return { url, session, apiKey, groupIds };
}

async function runDailyAlert() {
  const config = getWahaConfig();
  if (!config) {
    console.warn('[AlertScheduler] WAHA not configured — skipping alert.');
    return;
  }

  try {
    const projects = ProjectRepository.findAllByRegion('SUMBAGTENG');
    const riskyProjects: RiskyProjectDTO[] = [];

    for (const project of projects) {
      const risk = computeProjectRisk(project);
      if (risk === 'AMAN') continue;
      riskyProjects.push({
        uid: project.uid,
        nama_lop: project.nama_lop,
        branch: project.branch,
        status: project.status,
        risk_level: risk,
        days_since_changed: getDaysSinceChanged(project),
        golive_target: project.golive_target,
      });
    }

    const kritisCount = riskyProjects.filter(p => p.risk_level === 'KRITIS').length;
    const perhatianCount = riskyProjects.filter(p => p.risk_level === 'PERHATIAN').length;

    const message = buildAlertMessage({
      kritisCount,
      perhatianCount,
      projects: riskyProjects,
      totalProjects: projects.length,
    });

    await sendWahaAlert(config, message);
    console.log(`[AlertScheduler] ✅ Alert sent — ${kritisCount} KRITIS, ${perhatianCount} PERHATIAN`);
  } catch (err) {
    console.error('[AlertScheduler] ❌ Alert failed:', err);
  }
}

export class AlertScheduler {
  static start() {
    if (alertSchedulerState.job) {
      return;
    }

    // Runs daily at 08:00 by default, custom cron schedule supported
    const schedule = process.env.WAHA_ALERT_CRON_SCHEDULE || '0 8 * * *';
    alertSchedulerState.job = cron.schedule(schedule, runDailyAlert);
    console.log(`[AlertScheduler] Started — schedule: ${schedule}`);
  }

  static stop() {
    if (alertSchedulerState.job) {
      alertSchedulerState.job.stop();
      alertSchedulerState.job = null;
    }
  }

  static isRunning() {
    return !!alertSchedulerState.job;
  }

  // Manual trigger for testing via API route
  static async triggerNow() {
    await runDailyAlert();
  }
}
