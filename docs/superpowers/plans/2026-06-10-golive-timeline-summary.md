# Golive Timeline Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single timeline-total badge with an explicit committed-port and uncommitted-port breakdown.

**Architecture:** Add a pure summary helper beside the existing chart-data helper. Use it for the monthly view, selected-month drilldown, and equivalent PDF calculation without changing timeline data generation.

**Tech Stack:** TypeScript, React 19, Recharts, jsPDF, Vitest

---

### Task 1: Summary Calculation

**Files:**
- Modify: `tests/timeline-chart.test.ts`
- Modify: `src/components/features/recap/TimelineChart.tsx`

- [ ] **Step 1: Write the failing test**

Import `buildTimelineSummary` and assert:

```ts
expect(buildTimelineSummary(entries, 20_248)).toEqual({
  committedPorts: 16_192,
  uncommittedPorts: 4_056,
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `rtk npm test -- tests/timeline-chart.test.ts`

Expected: FAIL because `buildTimelineSummary` is not exported.

- [ ] **Step 3: Implement the pure helper**

Sum `entry.uncommittedPorts` and subtract it from the supplied total, clamping committed ports to zero.

- [ ] **Step 4: Render two badges**

Use all month entries in monthly view and the selected month as a one-entry list in drilldown. Render green committed and hatched-gray uncommitted badges.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `rtk npm test -- tests/timeline-chart.test.ts`

Expected: PASS.

### Task 2: PDF Summary

**Files:**
- Modify: `src/lib/export-pdf.ts`

- [ ] **Step 1: Derive PDF committed and uncommitted totals**

```ts
const uncommittedTimelinePorts = months.reduce(
  (sum, month) => sum + month.uncommittedPorts,
  0
);
const committedTimelinePorts =
  timelineSource.totalGolivePorts - uncommittedTimelinePorts;
```

- [ ] **Step 2: Render the breakdown**

Replace `total port timeline` with:

```text
16.192 port komitmen + 4.056 tanpa komitmen
```

using locale-formatted values.

### Task 3: Verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Run automated verification**

```powershell
rtk npm run test:run
rtk npm run typecheck
rtk npm run lint
rtk npm run build
```

- [ ] **Step 2: Verify the dashboard**

Confirm the monthly card displays `16.192 total port komitmen` and `+ 4.056 port tanpa komitmen`. Click January and confirm the summary changes to `0 total port komitmen` and `+ 3.712 port tanpa komitmen`.

