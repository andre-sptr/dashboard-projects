# Design: Loading Fix, List Searchbox, & Overwrite Confirmation

**Date:** 2026-06-19
**Status:** Approved (pending spec review)
**Scope:** Frontend only — `loading.tsx` + three list/form pages (BoQ Plan, AANWIJZING, Rekap UT). No API/DB changes.

## Problem / Motivation

Three independent improvements requested by the user:

1. **Double "Memuat Data" loading screen.** On first load, a black "Memuat Data..." flashes top-left, then a blue centered one appears. Only the blue centered one is wanted.
2. **No search on the saved lists.** BoQ Plan, AANWIJZING, and Rekap UT each show a paginated table of saved entries but offer no way to search it.
3. **Silent / duplicate saves.** Saving for an `id_ihld` that already has data either silently overwrites (BoQ) or creates a duplicate row (UT, AANWIJZING), with no confirmation.

## Root Cause: Double Loading

Only one loading file exists: `src/app/loading.tsx` (the blue, centered one). The text "Memuat Data..." appears nowhere else in the codebase. The black top-left instance is the **same** `loading.tsx` rendered before Tailwind CSS is applied — a flash of unstyled content (FOUC). Without the `flex / items-center / justify-center / text-blue` classes, the text renders as plain black, top-left. Once CSS loads it becomes the centered blue version. This explains "black first, then blue, not simultaneous," and is typical of `npm run dev`.

## Decisions (confirmed with user)

- **Overwrite semantics:** When an `id_ihld` already exists and the user confirms, **replace the existing entry** (one entry per project), consistent across all three pages.
- **AANWIJZING scope:** Duplicate detection applies to AANWIJZING too, same as BoQ & UT (even though a project may span multiple ODC/port ranges — the user decides per save whether to overwrite).
- **Search fields:** Match on **ID IHLD + Nama LOP** (BoQ also `project_name`), case-insensitive substring.
- Confirmation appears only when creating a new entry whose `id_ihld` matches an existing *different* entry. Editing an entry in place does not trigger it.

## Design

### A. Loading FOUC fix — `src/app/loading.tsx`

Add inline `style` attributes (alongside existing Tailwind classes) so the fallback is correctly centered and colored from the very first paint, before Tailwind loads:

- Outer container: inline `minHeight: '100vh'`, `display: 'flex'`, `flexDirection: 'column'`, `alignItems: 'center'`, `justifyContent: 'center'`.
- Spinner ring + text: inline color (blue spinner, gray text) so no black-text flash.

Tailwind classes stay for dark-mode/theming. Result: no top-left black flash; blue centered fallback from first paint. No other files change.

### B. List searchbox — BoQ / AANWIJZING / UT pages

Reuse the existing pattern from `boq-tracking/page.tsx` (lucide-react `Search` icon, `type="search"` input, `useMemo` filter, render-time pagination reset). For each of the three pages:

1. Import `Search` from `lucide-react`.
2. Add `const [search, setSearch] = useState('')`.
3. Compute filtered list via `useMemo`:
   - BoQ: match `id_ihld`, `nama_lop`, `project_name`.
   - UT / AANWIJZING: match `id_ihld`, `nama_lop`.
   - Case-insensitive `includes` on trimmed lowercase keyword; empty keyword returns full list.
4. Derive `totalPages` and `paginatedData` from the **filtered** list instead of the raw list.
5. Reset to page 1 when the keyword changes, using the render-time state-adjustment pattern (no effect):
   ```ts
   const [prevSearch, setPrevSearch] = useState(search);
   if (search !== prevSearch) {
     setPrevSearch(search);
     setCurrentPage(1);
   }
   ```
6. Render the search input above the list table (shown when there is ≥1 saved entry), with a "X dari Y" count.

### C. Overwrite confirmation — BoQ / UT / AANWIJZING pages

Use the existing `useConfirm()` hook (`src/hooks/useConfirm.ts`) + `ConfirmContext` dialog. Dialog options: `variant: 'warning'`, `confirmLabel: 'Timpa'`, `cancelLabel: 'Batal'`, message like:
> Project "«nama_lop»" (ID IHLD: «id_ihld») sudah memiliki data {BoQ Plan|AANWIJZING|UT}. Timpa data yang lama?

**BoQ Plan** (`boq/page.tsx`): In `handleSubmit`, after the file check, find `existing = boqList.find(b => b.id_ihld === formData.id_ihld)`. If found, `await confirm(...)`; if declined, return. If confirmed, proceed with the existing POST — the server already upserts by project, so the old BoQ is overwritten. No API change.

**Rekap UT** (`ut/page.tsx`): In `handleSubmit`, find `existing = utList.find(u => u.id_ihld === formData.id_ihld && u.id !== editingId)`. If found, confirm; if declined, return. If confirmed, send `id: editingId ?? existing.id` in the POST body so `UtRepository.upsert` replaces the existing row instead of generating a new id. If multiple legacy entries share the `id_ihld`, target the most recent.

**AANWIJZING** (`aanwijzing/page.tsx`): In `handleSubmit`, run the project-duplicate check **before** the existing port-allocation conflict flow. Find `existing = aanwijzingList.find(a => a.id_ihld === formData.id_ihld && a.id !== editingId)`. If found, confirm; if declined, return. If confirmed, pass the target id into `submitAanwijzing` so the body uses `id: editingId ?? existing.id` (overwriting the existing entry). The separate port-conflict `allow_overwrite` flow remains unchanged and runs after.

## Components & Boundaries

- `loading.tsx`: presentational only; self-contained.
- Each page owns its own `search` state and duplicate-check logic; no shared module needed (the filter + confirm are small and page-specific). No new files.
- Confirmation reuses the existing context/hook; no new UI primitive.

## Error Handling / Edge Cases

- Empty search keyword → full list.
- Editing an entry in place → duplicate check excludes `editingId`, so no false confirm.
- Cancelling the confirm → save aborts, `isSubmitting`/`isUploading` reset, form state untouched.
- Legacy multiple entries for one `id_ihld` (UT/AANWIJZING) → overwrite the most recent match.

## Testing

- `npm run lint` and `npm run build` clean.
- Manual verification:
  - First load shows only the blue centered loader (no black top-left flash).
  - Typing in each page's searchbox filters the table and resets to page 1.
  - Saving for an existing `id_ihld` shows the confirm dialog; "Timpa" replaces the entry, "Batal" aborts; saving a new `id_ihld` saves without a dialog.
  - Editing an existing entry does not trigger the confirm.

## Files Touched

- `src/app/loading.tsx`
- `src/app/(main)/boq/page.tsx`
- `src/app/(main)/ut/page.tsx`
- `src/app/(main)/aanwijzing/page.tsx`

No API routes, repositories, or database migrations change.
