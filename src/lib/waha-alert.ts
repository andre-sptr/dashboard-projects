import type { RiskyProjectDTO } from '@/types/dashboard';

export interface WahaAlertConfig {
  url: string;
  session: string;
  apiKey: string;
  groupIds: string[];
}

export interface AlertPayload {
  kritisCount: number;
  perhatianCount: number;
  projects: RiskyProjectDTO[];
  totalProjects: number;
}

const MAX_PROJECTS_IN_MESSAGE = 10;

export function buildAlertMessage(payload: AlertPayload): string {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  if (payload.kritisCount === 0 && payload.perhatianCount === 0) {
    return (
      `✅ *Alert Harian — Project Sumbagteng*\n` +
      `📅 ${today}\n\n` +
      `Semua project aman — tidak ada yang perlu tindak lanjut hari ini.`
    );
  }

  const lines: string[] = [
    `🚨 *Alert Project Berisiko — Sumbagteng*`,
    `📅 ${today}`,
    ``,
    `📊 *Ringkasan:*`,
    `🔴 KRITIS: ${payload.kritisCount} project`,
    `🟡 PERHATIAN: ${payload.perhatianCount} project`,
    `📌 Total berisiko: ${payload.kritisCount + payload.perhatianCount} dari ${payload.totalProjects} project`,
  ];

  const kritis = payload.projects.filter(p => p.risk_level === 'KRITIS');
  const perhatian = payload.projects.filter(p => p.risk_level === 'PERHATIAN');

  if (kritis.length > 0) {
    lines.push(``);
    lines.push(`🔴 *Project KRITIS:*`);
    kritis.slice(0, MAX_PROJECTS_IN_MESSAGE).forEach((p, i) => {
      const name = (p.nama_lop || '').replace(/[*_]/g, '');
      const branch = (p.branch || '-').replace(/[*_]/g, '');
      lines.push(`${i + 1}. ${name} (${branch}) — ${p.days_since_changed} hari`);
    });
    if (kritis.length > MAX_PROJECTS_IN_MESSAGE) {
      lines.push(`   _...dan ${kritis.length - MAX_PROJECTS_IN_MESSAGE} lainnya_`);
    }
  }

  if (perhatian.length > 0 && kritis.length < MAX_PROJECTS_IN_MESSAGE) {
    const remaining = MAX_PROJECTS_IN_MESSAGE - kritis.length;
    lines.push(``);
    lines.push(`🟡 *Project PERHATIAN:*`);
    perhatian.slice(0, remaining).forEach((p, i) => {
      const name = (p.nama_lop || '').replace(/[*_]/g, '');
      const branch = (p.branch || '-').replace(/[*_]/g, '');
      lines.push(`${i + 1}. ${name} (${branch}) — ${p.days_since_changed} hari`);
    });
    if (perhatian.length > remaining) {
      lines.push(`   _...dan ${perhatian.length - remaining} lainnya_`);
    }
  }

  lines.push(``);
  lines.push(`📲 _Cek dashboard untuk detail lengkap._`);

  return lines.join('\n');
}

export async function sendWahaAlert(config: WahaAlertConfig, message: string): Promise<void> {
  const url = `${config.url.replace(/\/$/, '')}/api/sendText`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Api-Key': config.apiKey,
  };

  const errors: string[] = [];

  for (const groupId of config.groupIds) {
    const payload = {
      session: config.session,
      chatId: groupId,
      text: message,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        errors.push(`Group ${groupId}: HTTP ${res.status} — ${body.slice(0, 200)}`);
      } else {
        console.log(`[WahaAlert] ✅ Sent to ${groupId}`);
      }
    } catch (err) {
      errors.push(`Group ${groupId}: ${(err as Error).message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[WahaAlert] Partial failure:\n${errors.join('\n')}`);
  }
}
