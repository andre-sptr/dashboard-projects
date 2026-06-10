import { describe, expect, it } from 'vitest';
import { buildTimelineChartData } from '@/components/features/recap/TimelineChart';
import type { GoliveTimelineDayEntry } from '@/types/dashboard';

const createEntry = (
  overrides: Partial<GoliveTimelineDayEntry>
): GoliveTimelineDayEntry => ({
  name: '1',
  day: 1,
  dateKey: '2026-06-01',
  onTimePorts: 0,
  pendingPorts: 0,
  latePorts: 0,
  totalPorts: 0,
  ...overrides,
});

describe('buildTimelineChartData', () => {
  it('places the total label on the highest non-zero stack', () => {
    const chartData = buildTimelineChartData([
      createEntry({ name: 'green', onTimePorts: 12, totalPorts: 12 }),
      createEntry({ name: 'gray', onTimePorts: 8, pendingPorts: 5, totalPorts: 13 }),
      createEntry({ name: 'red', onTimePorts: 7, pendingPorts: 4, latePorts: 3, totalPorts: 14 }),
    ]);

    expect(chartData).toMatchObject([
      { onTimeLabel: 12, pendingLabel: null, lateLabel: null },
      { onTimeLabel: null, pendingLabel: 13, lateLabel: null },
      { onTimeLabel: null, pendingLabel: null, lateLabel: 14 },
    ]);
  });
});
