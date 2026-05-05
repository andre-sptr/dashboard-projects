export interface HistoryEntry {
  status: string;
  sub_status: string;
  duration_minutes: number;
  ended_at: string;
}

// Format minutes to readable duration (e.g., "2 Hari 3 Jam")
export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0;

  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = Math.floor(minutes % 60);

  const parts = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} Menit`);

  return parts.join(' ');
}

// Calculate duration from last change to now
export function calculateCurrentDuration(lastChangedAt: string): string {
  if (!lastChangedAt) return '0 Menit';

  let dateStr = lastChangedAt;
  if (!dateStr.includes('T')) {
    dateStr = dateStr.replace(' ', 'T') + 'Z';
  } else if (!dateStr.endsWith('Z')) {
    dateStr = dateStr + 'Z';
  }

  const last = new Date(dateStr);
  const now = new Date();

  const diffMs = Math.max(0, now.getTime() - last.getTime());
  const minutes = Math.floor(diffMs / 60000);

  return formatDuration(minutes);
}

// Format last 3 history entries for display
export function formatHistory(history: HistoryEntry[]): string {
  return history.slice(-3).map((h, i) =>
    `${i + 1}. ${h.status}: ${formatDuration(h.duration_minutes)}`
  ).join('\n');
}
