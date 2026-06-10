# Golive Actual-Date Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group completed projects by actual golive date, retain commitment-based status colors, and show actual golive records without commitments as a neutral gray category.

**Architecture:** Resolve one timeline date and one category per project inside `buildDashboardStats`. Carry a fourth `uncommittedPorts` value through the shared timeline types, chart rendering, daily drilldown, and PDF export.

**Tech Stack:** TypeScript, React 19, Recharts, jsPDF, Vitest

---

### Task 1: Regression Tests

**Files:**
- Modify: `tests/dashboard-stats-column-config.test.ts`
- Modify: `tests/timeline-chart.test.ts`

- [ ] **Step 1: Add a failing dashboard-statistics test**

Add cases for actual-without-commitment, actual/commitment in different months, pending commitment, and overdue commitment. Assert the resolved month, day, category, and total ports.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `rtk npm test -- tests/dashboard-stats-column-config.test.ts`

Expected: FAIL because `uncommittedPorts` is missing and records are still grouped by commitment date.

- [ ] **Step 3: Add a failing chart-label test**

Extend the timeline fixture with `uncommittedPorts` and assert that `uncommittedLabel` receives the total when no red segment is present.

- [ ] **Step 4: Run the chart test and verify RED**

Run: `rtk npm test -- tests/timeline-chart.test.ts`

Expected: FAIL because `uncommittedLabel` does not exist.

### Task 2: Timeline Data Model and Builder

**Files:**
- Modify: `src/types/dashboard.ts`
- Modify: `src/lib/dashboard-stats.ts`

- [ ] **Step 1: Add `uncommittedPorts` to month and day entries**

Add the numeric field to `GoliveTimelineEntry` and `GoliveTimelineDayEntry`, initialized to zero.

- [ ] **Step 2: Resolve date and category**

Implement these rules:

```ts
const timelineDate = actualDate ?? targetDate;

if (actualDate && !targetDate) return 'uncommittedPorts';
if (actualDate && targetDate) {
  return actualDate <= targetDate ? 'onTimePorts' : 'latePorts';
}
return targetDate >= today ? 'pendingPorts' : 'latePorts';
```

Exclude projects where `timelineDate` is null.

- [ ] **Step 3: Run the dashboard-statistics test and verify GREEN**

Run: `rtk npm test -- tests/dashboard-stats-column-config.test.ts`

Expected: PASS.

### Task 3: Interactive Chart

**Files:**
- Modify: `src/components/features/recap/TimelineChart.tsx`

- [ ] **Step 1: Add the fourth stack and label**

Add `uncommittedLabel`, update top-label precedence, and render a `Tanpa Komitmen` bar between pending and late.

- [ ] **Step 2: Add the neutral visual treatment**

Define an SVG diagonal hatch pattern using `#9ca3af`. Use the same gray in the legend with a CSS repeating-linear-gradient preview.

- [ ] **Step 3: Correct chart copy**

Change the badge to `total port timeline` and make the empty state refer to actual or commitment dates.

- [ ] **Step 4: Run chart tests and verify GREEN**

Run: `rtk npm test -- tests/timeline-chart.test.ts`

Expected: PASS.

### Task 4: PDF Export

**Files:**
- Modify: `src/lib/export-pdf.ts`

- [ ] **Step 1: Add the uncommitted segment**

Render `uncommittedPorts` with a lighter gray segment after pending gray and before red.

- [ ] **Step 2: Correct PDF summary copy**

Change the chart total from `total port komitmen` to `total port timeline`.

### Task 5: Verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Run focused tests**

Run: `rtk npm test -- tests/dashboard-stats-column-config.test.ts tests/timeline-chart.test.ts`

- [ ] **Step 2: Run full automated checks**

Run:

```powershell
rtk npm run test:run
rtk npm run typecheck
rtk npm run lint
rtk npm run build
```

- [ ] **Step 3: Verify the dashboard visually**

Open the local dashboard in the in-app browser. Confirm January appears, the hatched gray category is legible, tooltips are correct, and monthly drilldown works.

