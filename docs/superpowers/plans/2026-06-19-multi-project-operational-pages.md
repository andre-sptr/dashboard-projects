# Multi-Project Operational Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable JPP, NodeB, and HEM across sync/config and operational pages while leaving `/dashboard` empty.

**Architecture:** Keep one shared implementation for each JPP operational page and pass `projectType` from route wrappers. Store runtime column mappings by project type, and scope operational API calls by `projectType` so existing JPP data remains isolated from NodeB/HEM.

**Tech Stack:** Next.js app router, React client components, better-sqlite3 migrations/repositories, Vitest, Testing Library.

---

### Task 1: Test the Required Multi-Project Behavior

**Files:**
- Create: `tests/multi-project-operational-pages.test.tsx`
- Modify: none

- [ ] Add tests that assert `ColumnConfigRepository.getAll('NODEB')` returns NodeB defaults and does not mutate JPP when NodeB is updated.
- [ ] Add tests that assert `ProjectRepository.getForSelect('NODEB')` excludes JPP projects.
- [ ] Add tests that assert `AanwijzingRepository.findAllWithBoq('NODEB')` and `UtRepository.findAllWithBoq('HEM')` filter by `project_type`.
- [ ] Add a component test that `ColumnConfigClient` calls `/api/column-config/headers?projectType=NODEB` and sends `projectType: 'NODEB'` on save.
- [ ] Add a component test that `/dashboard` empty state copy renders.
- [ ] Run `npm test -- tests/multi-project-operational-pages.test.tsx` and verify it fails before implementation.

### Task 2: Multi-Project Column Config

**Files:**
- Modify: `src/lib/migrations.ts`
- Modify: `src/repositories/ColumnConfigRepository.ts`
- Modify: `src/app/api/column-config/route.ts`
- Modify: `src/app/api/column-config/headers/route.ts`
- Modify: `src/components/features/settings/ColumnConfigClient.tsx`
- Modify: `src/app/(main)/settings/columns/page.tsx`

- [ ] Add migration `25` that rebuilds `column_config` with `project_type` and seeds JPP, NodeB, HEM.
- [ ] Update repository methods to accept `projectType`, fallback to seeded defaults, and reset per project.
- [ ] Update API routes to parse `projectType` from query/body.
- [ ] Update client UI with project selector tabs/cards and project-scoped save/reset/detect.
- [ ] Run the column config tests and fix until green.

### Task 3: Synchronization Breakdown

**Files:**
- Modify: `src/lib/sync-service.ts`
- Modify: `src/app/(main)/settings/sync/page.tsx`

- [ ] Use runtime `ColumnConfigRepository.getMap(config.type)` for all three project sources.
- [ ] Persist `byProject` and `total` into `sync_logs.details`.
- [ ] Parse `latestSync.details` and history row details in Sync UI.
- [ ] Add three project breakdown cards for JPP, NodeB, HEM.

### Task 4: Project-Scoped Operational APIs

**Files:**
- Modify: `src/lib/migrations.ts`
- Modify: `src/repositories/ProjectRepository.ts`
- Modify: `src/repositories/BoqRepository.ts`
- Modify: `src/repositories/AanwijzingRepository.ts`
- Modify: `src/repositories/UtRepository.ts`
- Modify: `src/app/api/boq/route.ts`
- Modify: `src/app/api/aanwijzing/route.ts`
- Modify: `src/app/api/ut/route.ts`

- [ ] Add `project_type` columns to `aanwijzing` and `ut`, defaulting existing rows to JPP.
- [ ] Scope repository list/select/upsert methods by `projectType`.
- [ ] Scope API GET/POST payloads by `projectType`.
- [ ] Keep delete by unique id unchanged.
- [ ] Run repository/API tests and fix until green.

### Task 5: Route NodeB/HEM Pages to JPP Implementations

**Files:**
- Modify: `src/app/(main)/boq/page.tsx`
- Modify: `src/app/(main)/aanwijzing/page.tsx`
- Modify: `src/app/(main)/ut/page.tsx`
- Modify: `src/app/(main)/nodeb/boq/page.tsx`
- Modify: `src/app/(main)/nodeb/aanwijzing/page.tsx`
- Modify: `src/app/(main)/nodeb/ut/page.tsx`
- Modify: `src/app/(main)/hem/boq/page.tsx`
- Modify: `src/app/(main)/hem/aanwijzing/page.tsx`
- Modify: `src/app/(main)/hem/ut/page.tsx`
- Modify: `src/app/(main)/nodeb/report/page.tsx`
- Modify: `src/app/(main)/hem/report/page.tsx`

- [ ] Add optional `projectType` prop to JPP BoQ/AANWIJZING/UT clients.
- [ ] Append `projectType` to fetch URLs and POST bodies.
- [ ] Replace NodeB/HEM `ComingSoon` pages with wrappers passing the target project type.
- [ ] Implement NodeB/HEM report pages with `ReportClient`, project-specific projects, and project-specific column maps.

### Task 6: Dashboard and KPI Reports

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`
- Modify: `src/app/(main)/kpi-report/jpp/page.tsx`
- Modify: `src/app/(main)/nodeb/kpi-report/page.tsx`
- Modify: `src/app/(main)/hem/kpi-report/page.tsx`
- Modify: `src/components/features/dashboard/DashboardRecap.tsx`

- [ ] Replace dashboard data fetch with empty state.
- [ ] Render `DashboardRecap` from KPI report pages.
- [ ] Pass JPP runtime column map to JPP and project config maps to NodeB/HEM.
- [ ] Add optional project label copy to `DashboardRecap`.

### Task 7: Verification

**Files:**
- No direct file edits.

- [ ] Run targeted Vitest suites.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Check `git diff --stat` and summarize changed surfaces.
