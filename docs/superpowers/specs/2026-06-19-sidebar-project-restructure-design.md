# Design: Sidebar Restructure by Project + NodeB/HEM Scaffolding

**Date:** 2026-06-19
**Status:** Approved (pending spec review)
**Scope:** Frontend navigation only — `Sidebar.tsx`, `(main)/layout.tsx`, new placeholder pages, one shared placeholder component. **No data-model, repository, or API changes.**

## Problem / Motivation

The current sidebar groups pages by function (Project Tracking, Monitoring, KPI Report, Administration), but in reality every functional page (Projects Data, BoQ Plan, AANWIJZING, Rekap UT, Report) belongs to **Project JPP** — only Network Topology, BoQ Tracking, and Cek BoQ are shared/root tools. The user wants the sidebar reorganized **by project**, JPP's pages consolidated into one group, and parallel groups created for two new projects (**NodeB**, **HEM**) as navigation + placeholder pages (functionality to follow later). The "KPI Report" group and the "Administration" naming are wrong and need fixing.

## Decisions (confirmed with user)

- **NodeB/HEM scope:** menu restructure + **placeholder pages only**. No data separation, no DB/repository/API changes this phase.
- **KPI Report:** dissolve the standalone "KPI Report" group; each project group gets its own "KPI Report" item.
- **Engineering:** removed entirely from the sidebar; its stub route is deleted.
- **URLs:** JPP keeps its current routes (`/boq`, `/ut`, `/aanwijzing`, `/projects`, `/report`, `/kpi-report/jpp`) so working features are untouched. NodeB/HEM pages live under `/nodeb/*` and `/hem/*` (placeholders).
- **Administration → Settings**; the "Configuration" item is renamed to **"Column Config"** (it configures table columns). "Synchronization" kept.
- **Global group** named **"Monitoring"**: Network Topology, BoQ Tracking, Cek BoQ.
- **"Cek BOQ"** label casing corrected to **"Cek BoQ"**.

## Target Sidebar Structure

```
Dashboard                    /dashboard            (primary item, outside groups)

Project JPP                  (group)
  Projects Data              /projects
  BoQ Plan                   /boq
  AANWIJZING                 /aanwijzing
  Rekap UT                   /ut
  Report                     /report
  KPI Report                 /kpi-report/jpp

Project NodeB                (group — placeholder pages)
  Projects Data              /nodeb/projects
  BoQ Plan                   /nodeb/boq
  AANWIJZING                 /nodeb/aanwijzing
  Rekap UT                   /nodeb/ut
  Report                     /nodeb/report
  KPI Report                 /nodeb/kpi-report

Project HEM                  (group — placeholder pages)
  Projects Data              /hem/projects
  BoQ Plan                   /hem/boq
  AANWIJZING                 /hem/aanwijzing
  Rekap UT                   /hem/ut
  Report                     /hem/report
  KPI Report                 /hem/kpi-report

Monitoring                   (group)
  Network Topology           /topology
  BoQ Tracking               /boq-tracking
  Cek BoQ                    /cek-boq

Settings                     (group — formerly "Administration")
  Synchronization            /settings/sync
  Column Config              /settings/columns
```

## Design

### A. Sidebar restructure — `src/components/layout/Sidebar.tsx`

Replace the `NAV_GROUPS` array with the structure above. The existing component machinery (collapsible groups, `activeGroup` auto-expand, `isActiveRoute`, `renderNavLink`) stays as-is — only the data changes.

- Project groups (JPP/NodeB/HEM) use a shared project icon (`FolderKanban` from lucide-react — add to imports). Their sub-items reuse the existing icons: `Database` (Projects Data), `Receipt` (BoQ Plan), `Megaphone` (AANWIJZING), `ClipboardCheck` (Rekap UT), `BarChart3` (Report), `FileText` (KPI Report).
- "Monitoring" group keeps icon `Activity`; items: `Network` (Network Topology), `TrendingUp` (BoQ Tracking), `FileSearch` (Cek BoQ).
- "Settings" group keeps icon `Settings`; items: `RefreshCw` (Synchronization), `Columns3` (Column Config).
- Remove now-unused icon imports only if they become unused (verify before removing); otherwise leave imports intact.

Auto-expand still works: `activeGroup` is computed from whichever group contains the active route, so opening `/nodeb/boq` expands "Project NodeB". No logic change required.

### B. Shared placeholder component — `src/components/ui/ComingSoon.tsx` (new)

A small presentational (server) component for not-yet-built pages:

- Props: `{ title: string; description?: string }`.
- Renders a centered card: the `Construction` icon from lucide-react, the `title`, and a message defaulting to "Halaman ini belum tersedia." (overridable via `description`). Tailwind styling consistent with existing cards (`rounded-xl`, gray/blue palette, dark-mode classes).
- No client interactivity, no data fetching.

### C. NodeB/HEM placeholder pages (new)

12 server-component pages, each rendering `<ComingSoon title="…" />`:

- `src/app/(main)/nodeb/projects/page.tsx` → title "Projects Data — NodeB"
- `src/app/(main)/nodeb/boq/page.tsx` → "BoQ Plan — NodeB"
- `src/app/(main)/nodeb/aanwijzing/page.tsx` → "AANWIJZING — NodeB"
- `src/app/(main)/nodeb/ut/page.tsx` → "Rekap UT — NodeB"
- `src/app/(main)/nodeb/report/page.tsx` → "Report — NodeB"
- `src/app/(main)/nodeb/kpi-report/page.tsx` → "KPI Report — NodeB"
- `src/app/(main)/hem/projects/page.tsx` → "Projects Data — HEM"
- `src/app/(main)/hem/boq/page.tsx` → "BoQ Plan — HEM"
- `src/app/(main)/hem/aanwijzing/page.tsx` → "AANWIJZING — HEM"
- `src/app/(main)/hem/ut/page.tsx` → "Rekap UT — HEM"
- `src/app/(main)/hem/report/page.tsx` → "Report — HEM"
- `src/app/(main)/hem/kpi-report/page.tsx` → "KPI Report — HEM"

The existing JPP KPI stub `src/app/(main)/kpi-report/jpp/page.tsx` is changed from `return null` to render `<ComingSoon title="KPI Report — JPP" />` for consistency.

### D. Topbar metadata — `src/app/(main)/layout.tsx`

`PAGE_META` drives the Topbar title/subtitle by exact path (then `startsWith` fallback, then default). Update it:

- Remove the `/kpi-report/engineering` entry.
- Change `/kpi-report/nodeb` / `/kpi-report/hem` entries to the new routes `/nodeb/kpi-report` / `/hem/kpi-report` (or remove the old and add the new).
- Add entries for all 12 new routes with project-qualified titles, e.g. `'/nodeb/boq': { title: 'BoQ Plan — NodeB', subtitle: '' }`. (Subtitles may be empty; placeholders don't need them.)
- Keep all existing JPP entries unchanged.

Note: `pathname.startsWith(key)` would otherwise not map `/nodeb/boq` to `/boq` (it doesn't start with `/boq`), so explicit entries are required for a tidy Topbar.

### E. Deletions

Delete the now-unused stub routes (folders + `page.tsx`):

- `src/app/(main)/kpi-report/nodeb/`
- `src/app/(main)/kpi-report/hem/`
- `src/app/(main)/kpi-report/engineering/`

Keep `src/app/(main)/kpi-report/jpp/` (JPP's KPI Report route, now rendering `<ComingSoon>`).

## Components & Boundaries

- `Sidebar.tsx`: data-only change to `NAV_GROUPS`; rendering logic untouched.
- `ComingSoon.tsx`: single-responsibility presentational placeholder; each page depends only on it.
- Placeholder pages: thin wrappers (one line of JSX each), no logic.
- `layout.tsx`: presentational metadata map; no behavior change beyond added/removed entries.

## Error Handling / Edge Cases

- Visiting a NodeB/HEM placeholder route renders the ComingSoon card under the normal layout — no errors, no broken links.
- Active-route highlighting and group auto-expand work for the new routes via the existing `isActiveRoute`/`activeGroup` logic.
- No old links to deleted `/kpi-report/{nodeb,hem,engineering}` remain in code (only `Sidebar.tsx`, `layout.tsx`, and README reference them; the first two are updated here, README is docs-only).

## Testing

- `npm run lint`, `npm run typecheck`, `npm run build` clean (build must compile all new routes).
- Existing test suite (123 tests) still green — no touched files have tests, but run `npm run test:run` to confirm no regression.
- Manual: every sidebar item navigates to a real route; JPP items reach the existing working pages; NodeB/HEM items show the ComingSoon placeholder with the correct project-qualified Topbar title; the active group auto-expands; "Settings" replaces "Administration" with "Column Config"; "Cek BoQ" casing fixed.

## Files Touched

**New (13):**
- `src/components/ui/ComingSoon.tsx`
- 12 placeholder pages under `src/app/(main)/nodeb/*` and `src/app/(main)/hem/*` (listed in §C)

**Modified (3):**
- `src/components/layout/Sidebar.tsx`
- `src/app/(main)/layout.tsx`
- `src/app/(main)/kpi-report/jpp/page.tsx`

**Deleted (3):**
- `src/app/(main)/kpi-report/nodeb/page.tsx`
- `src/app/(main)/kpi-report/hem/page.tsx`
- `src/app/(main)/kpi-report/engineering/page.tsx`

No API routes, repositories, database, or business logic change.
