# Loading Fix, List Search & Overwrite Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unstyled "Memuat Data" flash, add a list searchbox to the BoQ Plan / AANWIJZING / Rekap UT pages, and confirm before overwriting an existing project's data.

**Architecture:** Frontend-only changes. The loading fallback gets inline styles so it renders correctly before Tailwind loads. Each list page gains a `useMemo`-filtered list plus a render-time pagination reset (mirroring `boq-tracking/page.tsx`). A shared pure helper detects duplicate `id_ihld`s; pages call the existing `useConfirm()` dialog before saving, and pass the existing entry's `id` so the server upsert replaces (not duplicates) the row.

**Tech Stack:** Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4, lucide-react, Vitest + @testing-library. No API/DB changes.

## Global Constraints

- No changes to API routes (`src/app/api/**`), repositories, or the database. BoQ already upserts server-side; UT/AANWIJZING overwrite by sending the existing row's `id`.
- Match existing UI patterns: search input style from `src/app/(main)/boq-tracking/page.tsx:441-449`; pagination reset pattern from `src/app/(main)/boq-tracking/page.tsx:268-275`.
- Confirmation uses the existing `useConfirm()` hook (`src/hooks/useConfirm.ts`) and `ConfirmContext` (`variant: 'warning'`, labels `Timpa` / `Batal`). Provider already wraps the app via `src/components/providers/Providers.tsx`.
- Duplicate detection matches on `id_ihld` (case-insensitive, trimmed) and excludes the entry currently being edited.
- Search matches `id_ihld` + `nama_lop` (BoQ also `project_name`), case-insensitive substring.
- Commit messages: end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit only the files listed in each task (the working tree has unrelated staged `docs/` deletions — do not include them; use `git commit -- <paths>`).
- Verify each task with `npm run lint` and `npm run typecheck` (and `npm run build` for the loading task). Vitest: `npm run test:run`.

---

### Task 1: Loading FOUC fix

Make the loading fallback render centered and blue from the first paint, before Tailwind CSS is applied, by adding inline styles alongside the existing Tailwind classes. No unit test: this is a purely presentational fallback; the meaningful verification is the production build compiling and a visual check (the existing test suite has no `loading.tsx` coverage and a render test would only restate the markup).

**Files:**
- Modify: `src/app/loading.tsx` (replace entire file)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace `src/app/loading.tsx` with the inline-styled version**

```tsx
// Full-screen loading fallback for navigation.
// Inline styles guarantee the loader is centered and blue from the first paint,
// even before Tailwind CSS is applied (prevents the unstyled black top-left flash).
export default function Loading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <div
          className="w-16 h-16 relative"
          style={{ width: '4rem', height: '4rem', position: 'relative' }}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800"
            style={{ position: 'absolute', inset: 0, borderRadius: '9999px', border: '4px solid #e5e7eb' }}
          ></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '9999px',
              border: '4px solid #2563eb',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
        <h2
          className="text-xl font-medium text-gray-700 dark:text-gray-300"
          style={{ fontSize: '1.25rem', fontWeight: 500, color: '#374151', margin: 0 }}
        >
          Memuat Data...
        </h2>
        <p
          className="text-sm text-gray-500 dark:text-gray-500"
          style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}
        >
          Harap tunggu sebentar
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint, types, and build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all succeed with no errors referencing `loading.tsx`.

- [ ] **Step 3: Commit**

```bash
git commit -m "fix: prevent unstyled loading flash with inline styles" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- src/app/loading.tsx
```

---

### Task 2: Shared duplicate-detection helper (TDD)

A pure helper used by all three pages to find an existing record that a save would overwrite. Built test-first.

**Files:**
- Create: `src/lib/duplicate-check.ts`
- Test: `tests/duplicate-check.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface IdentifiableRecord { id?: string; id_ihld: string }
  export function findDuplicateByIdIhld<T extends IdentifiableRecord>(
    list: T[],
    idIhld: string,
    excludeId?: string | null
  ): T | undefined
  ```
  Returns the first list entry whose `id_ihld` matches `idIhld` (case-insensitive, trimmed) and whose `id !== excludeId`; returns `undefined` when `idIhld` is blank or nothing matches.

- [ ] **Step 1: Write the failing test**

Create `tests/duplicate-check.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findDuplicateByIdIhld } from '../src/lib/duplicate-check';

describe('findDuplicateByIdIhld', () => {
  const list = [
    { id: 'A1', id_ihld: 'IHLD-001' },
    { id: 'A2', id_ihld: 'IHLD-002' },
  ];

  it('returns undefined when no entry matches', () => {
    expect(findDuplicateByIdIhld(list, 'IHLD-999')).toBeUndefined();
  });

  it('returns the matching entry (case-insensitive, trimmed)', () => {
    expect(findDuplicateByIdIhld(list, '  ihld-001 ')).toEqual({ id: 'A1', id_ihld: 'IHLD-001' });
  });

  it('excludes the entry being edited via excludeId', () => {
    expect(findDuplicateByIdIhld(list, 'IHLD-001', 'A1')).toBeUndefined();
  });

  it('returns undefined for a blank id_ihld', () => {
    expect(findDuplicateByIdIhld(list, '   ')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:run -- tests/duplicate-check.test.ts`
Expected: FAIL — cannot resolve module `../src/lib/duplicate-check`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/duplicate-check.ts`:

```ts
// Detects an existing record that a save for the given id_ihld would overwrite.
// Shared by the BoQ Plan, AANWIJZING, and Rekap UT pages to confirm before overwriting.

export interface IdentifiableRecord {
  id?: string;
  id_ihld: string;
}

export function findDuplicateByIdIhld<T extends IdentifiableRecord>(
  list: T[],
  idIhld: string,
  excludeId?: string | null
): T | undefined {
  const target = (idIhld || '').trim().toLowerCase();
  if (!target) return undefined;
  return list.find(
    (item) => (item.id_ihld || '').trim().toLowerCase() === target && item.id !== excludeId
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:run -- tests/duplicate-check.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add findDuplicateByIdIhld helper for overwrite confirmation" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- src/lib/duplicate-check.ts tests/duplicate-check.test.ts
```

---

### Task 3: BoQ Plan page — searchbox + overwrite confirm

**Files:**
- Modify: `src/app/(main)/boq/page.tsx`

**Interfaces:**
- Consumes: `findDuplicateByIdIhld` (Task 2); `useConfirm` (`src/hooks/useConfirm.ts`).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Update imports**

Change line 4:
```tsx
import React, { useState, useEffect, useRef } from 'react';
```
to:
```tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
```

Change line 5:
```tsx
import { Upload, Trash2, FileText, ChevronLeft, ChevronRight, X, Loader2, Eye, Plus, Save, ChevronDown } from 'lucide-react';
```
to:
```tsx
import { Upload, Trash2, FileText, ChevronLeft, ChevronRight, X, Loader2, Eye, Plus, Save, ChevronDown, Search } from 'lucide-react';
```

Add after line 6 (`import { normalizeBoqItems } from '@/lib/boq-items';`):
```tsx
import { findDuplicateByIdIhld } from '@/lib/duplicate-check';
import { useConfirm } from '@/hooks/useConfirm';
```

- [ ] **Step 2: Add the confirm hook and search state**

After line 68-69:
```tsx
  const [searchLop, setSearchLop] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
```
add:
```tsx
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
```

- [ ] **Step 3: Filter the list and reset pagination on search**

Replace lines 323-327:
```tsx
  const totalPages = Math.ceil(boqList.length / ITEMS_PER_PAGE);
  const paginatedData = boqList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```
with:
```tsx
  const filteredBoqList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return boqList;
    return boqList.filter((b) =>
      (b.id_ihld || '').toLowerCase().includes(keyword) ||
      (b.nama_lop || '').toLowerCase().includes(keyword) ||
      (b.project_name || '').toLowerCase().includes(keyword)
    );
  }, [boqList, search]);

  // Reset to the first page when the search keyword changes.
  // Adjusting state during render avoids the extra render pass an effect would cause.
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredBoqList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredBoqList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```

- [ ] **Step 4: Insert the searchbox above the list table**

Directly before line 498 (`      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">`), insert:

```tsx
      {boqList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredBoqList.length} dari {boqList.length} data
          </p>
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID IHLD atau Nama LOP..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
```

- [ ] **Step 5: Add the overwrite confirmation in `handleSubmit`**

Replace lines 124-131:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      showNotification('error', 'Pilih file Excel terlebih dahulu');
      return;
    }

    setIsUploading(true);
```
with:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      showNotification('error', 'Pilih file Excel terlebih dahulu');
      return;
    }

    const existing = findDuplicateByIdIhld(boqList, formData.id_ihld);
    if (existing) {
      const ok = await confirm({
        title: 'Project sudah ada',
        message: `Project "${formData.nama_lop}" (ID IHLD: ${formData.id_ihld}) sudah memiliki data BoQ Plan. Timpa data yang lama?`,
        confirmLabel: 'Timpa',
        cancelLabel: 'Batal',
        variant: 'warning',
      });
      if (!ok) return;
    }

    setIsUploading(true);
```

- [ ] **Step 6: Verify lint and types**

Run: `npm run lint && npm run typecheck`
Expected: no errors in `boq/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add list search and overwrite confirm to BoQ Plan page" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- "src/app/(main)/boq/page.tsx"
```

---

### Task 4: Rekap UT page — searchbox + overwrite confirm

On overwrite, send the existing entry's `id` so `UtRepository.upsert` replaces the row instead of generating a new one.

**Files:**
- Modify: `src/app/(main)/ut/page.tsx`

**Interfaces:**
- Consumes: `findDuplicateByIdIhld` (Task 2); `useConfirm`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Update imports**

Change line 4:
```tsx
import React, { useState, useEffect } from 'react';
```
to:
```tsx
import React, { useState, useEffect, useMemo } from 'react';
```

Change line 5:
```tsx
import { ChevronDown, Save, Trash2, Edit3, Plus, X, FileText, ChevronLeft, ChevronRight, Upload, Loader2, Eye } from 'lucide-react';
```
to:
```tsx
import { ChevronDown, Save, Trash2, Edit3, Plus, X, FileText, ChevronLeft, ChevronRight, Upload, Loader2, Eye, Search } from 'lucide-react';
```

Add the helper + hook imports immediately after the `lucide-react` import line (line 5):
```tsx
import { findDuplicateByIdIhld } from '@/lib/duplicate-check';
import { useConfirm } from '@/hooks/useConfirm';
```

- [ ] **Step 2: Add the confirm hook and search state**

After lines 74-75:
```tsx
  const [searchLop, setSearchLop] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
```
add:
```tsx
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
```

- [ ] **Step 3: Filter the list and reset pagination on search**

Replace lines 319-323:
```tsx
  const totalPages = Math.ceil(utList.length / ITEMS_PER_PAGE);
  const paginatedData = utList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```
with:
```tsx
  const filteredUtList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return utList;
    return utList.filter((u) =>
      (u.id_ihld || '').toLowerCase().includes(keyword) ||
      (u.nama_lop || '').toLowerCase().includes(keyword)
    );
  }, [utList, search]);

  // Reset to the first page when the search keyword changes (render-time adjustment, no effect).
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredUtList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredUtList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```

- [ ] **Step 4: Insert the searchbox above the list table**

Directly before line 700 (`      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">`), insert:

```tsx
      {utList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredUtList.length} dari {utList.length} data
          </p>
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID IHLD atau Nama LOP..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
```

- [ ] **Step 5: Add the overwrite confirmation in `handleSubmit` and send the existing id**

Replace lines 203-221:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const temuanData = getSerializedTemuan();
      const res = await fetch('/api/ut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          temuan: temuanData.temuan,
          jumlah_odp: Number(formData.jumlah_odp) || 0,
          jumlah_port: Number(formData.jumlah_port) || 0,
          jumlah_temuan: Number(temuanData.jumlah_temuan) || 0,
          boq_data: boqRows.length > 0 ? boqRows : null,
          id: editingId ?? undefined,
        }),
      });
```
with:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const existing = findDuplicateByIdIhld(utList, formData.id_ihld, editingId);
    let overwriteId: string | null = editingId;
    if (existing) {
      const ok = await confirm({
        title: 'Project sudah ada',
        message: `Project "${formData.nama_lop}" (ID IHLD: ${formData.id_ihld}) sudah memiliki data UT. Timpa data yang lama?`,
        confirmLabel: 'Timpa',
        cancelLabel: 'Batal',
        variant: 'warning',
      });
      if (!ok) return;
      overwriteId = existing.id ?? null;
    }

    setIsSubmitting(true);

    try {
      const temuanData = getSerializedTemuan();
      const res = await fetch('/api/ut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          temuan: temuanData.temuan,
          jumlah_odp: Number(formData.jumlah_odp) || 0,
          jumlah_port: Number(formData.jumlah_port) || 0,
          jumlah_temuan: Number(temuanData.jumlah_temuan) || 0,
          boq_data: boqRows.length > 0 ? boqRows : null,
          id: overwriteId ?? undefined,
        }),
      });
```

- [ ] **Step 6: Verify lint and types**

Run: `npm run lint && npm run typecheck`
Expected: no errors in `ut/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add list search and overwrite confirm to Rekap UT page" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- "src/app/(main)/ut/page.tsx"
```

---

### Task 5: AANWIJZING page — searchbox + overwrite confirm

The project-duplicate check runs in `handleSubmit` before the existing port-allocation conflict flow. The overwrite target `id` is stored in state so it survives the port-conflict "Overwrite" retry.

**Files:**
- Modify: `src/app/(main)/aanwijzing/page.tsx`

**Interfaces:**
- Consumes: `findDuplicateByIdIhld` (Task 2); `useConfirm`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Update imports**

Line 4 already imports `useMemo` — leave it. Change line 5:
```tsx
import { ChevronDown, Save, Trash2, Edit3, Plus, X, FileText, ChevronLeft, ChevronRight, Upload, Loader2, Eye } from 'lucide-react';
```
to:
```tsx
import { ChevronDown, Save, Trash2, Edit3, Plus, X, FileText, ChevronLeft, ChevronRight, Upload, Loader2, Eye, Search } from 'lucide-react';
```

Add the helper + hook imports immediately after the `lucide-react` import line (line 5):
```tsx
import { findDuplicateByIdIhld } from '@/lib/duplicate-check';
import { useConfirm } from '@/hooks/useConfirm';
```

- [ ] **Step 2: Add the confirm hook, search state, and overwrite-target state**

After lines 84-85:
```tsx
  const [searchLop, setSearchLop] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
```
add:
```tsx
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
  const [overwriteTargetId, setOverwriteTargetId] = useState<string | null>(null);
```

- [ ] **Step 3: Clear the overwrite target in `resetForm`**

In `resetForm`, after line 321 (`    setPendingOverwrite(false);`), add:
```tsx
    setOverwriteTargetId(null);
```

- [ ] **Step 4: Thread the target id through `submitAanwijzing`**

Change the signature on line 195:
```tsx
  const submitAanwijzing = async (allowOverwrite: boolean) => {
```
to:
```tsx
  const submitAanwijzing = async (allowOverwrite: boolean, targetId: string | null) => {
```

Change the body `id` field on line 211:
```tsx
          id: editingId ?? undefined,
```
to:
```tsx
          id: targetId ?? undefined,
```

- [ ] **Step 5: Add the duplicate check in `handleSubmit`**

Replace lines 241-244:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAanwijzing(false);
  };
```
with:
```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetId: string | null = editingId;
    const existing = findDuplicateByIdIhld(aanwijzingList, formData.id_ihld, editingId);
    if (existing) {
      const ok = await confirm({
        title: 'Project sudah ada',
        message: `Project "${formData.nama_lop}" (ID IHLD: ${formData.id_ihld}) sudah memiliki data AANWIJZING. Timpa data yang lama?`,
        confirmLabel: 'Timpa',
        cancelLabel: 'Batal',
        variant: 'warning',
      });
      if (!ok) return;
      targetId = existing.id ?? null;
    }

    setOverwriteTargetId(targetId);
    await submitAanwijzing(false, targetId);
  };
```

- [ ] **Step 6: Pass the stored target id through the port-conflict retry button**

Change line 713:
```tsx
                  onClick={() => submitAanwijzing(true)}
```
to:
```tsx
                  onClick={() => submitAanwijzing(true, overwriteTargetId)}
```

- [ ] **Step 7: Filter the list and reset pagination on search**

Replace lines 325-329:
```tsx
  const totalPages = Math.ceil(aanwijzingList.length / ITEMS_PER_PAGE);
  const paginatedData = aanwijzingList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```
with:
```tsx
  const filteredAanwijzingList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return aanwijzingList;
    return aanwijzingList.filter((a) =>
      (a.id_ihld || '').toLowerCase().includes(keyword) ||
      (a.nama_lop || '').toLowerCase().includes(keyword)
    );
  }, [aanwijzingList, search]);

  // Reset to the first page when the search keyword changes (render-time adjustment, no effect).
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredAanwijzingList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAanwijzingList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
```

- [ ] **Step 8: Insert the searchbox above the list table**

Directly before line 737 (`      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">`), insert:

```tsx
      {aanwijzingList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredAanwijzingList.length} dari {aanwijzingList.length} data
          </p>
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID IHLD atau Nama LOP..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
```

- [ ] **Step 9: Verify lint and types**

Run: `npm run lint && npm run typecheck`
Expected: no errors in `aanwijzing/page.tsx`. (Confirm no stray `submitAanwijzing(false)` / `submitAanwijzing(true)` single-arg calls remain.)

- [ ] **Step 10: Commit**

```bash
git commit -m "feat: add list search and overwrite confirm to AANWIJZING page" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- "src/app/(main)/aanwijzing/page.tsx"
```

---

### Task 6: Full verification

- [ ] **Step 1: Run the whole test suite, lint, types, and build**

Run: `npm run test:run && npm run lint && npm run typecheck && npm run build`
Expected: all green, no regressions.

- [ ] **Step 2: Manual smoke test (`npm run dev`)**

- First load (`/` → `/dashboard`): only the blue centered "Memuat Data..." appears — no black top-left flash.
- BoQ Plan / Rekap UT / AANWIJZING: a searchbox appears above each list once ≥1 entry exists; typing filters the table, the "X dari Y" count updates, and pagination resets to page 1.
- Save for an `id_ihld` that already has data on each page → "Project sudah ada" dialog appears. "Timpa" overwrites the existing entry (no new duplicate row on UT/AANWIJZING); "Batal" aborts with the form intact.
- Save for a new `id_ihld` → no dialog; saves normally.
- Edit an existing entry (UT/AANWIJZING) and save → no false "sudah ada" dialog.
- AANWIJZING port-conflict path: when the "Overwrite" button appears, clicking it still overwrites the correct existing entry (not a new row).

## Self-Review

**Spec coverage:**
- Loading FOUC fix → Task 1. ✓
- Searchbox on BoQ / AANWIJZING / UT → Tasks 3, 4, 5 (steps 3-4 / 3-4 / 7-8). ✓
- Overwrite confirmation, replace existing (1 per project), applied to all three → Tasks 3 (step 5), 4 (step 5), 5 (steps 4-6). BoQ relies on existing server upsert; UT/AANWIJZING send the existing `id`. ✓
- Confirm excludes the entry being edited → `findDuplicateByIdIhld(..., editingId)` in Tasks 4 & 5; BoQ has no edit flow. ✓
- AANWIJZING duplicate check runs before port-conflict flow and survives the retry → Task 5 steps 4-6. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N"; every code step shows complete code. ✓

**Type consistency:** `findDuplicateByIdIhld<T extends IdentifiableRecord>(list, idIhld, excludeId?)` defined in Task 2 and called with the same signature in Tasks 3-5. `BoqData`, `UTData`, `AanwijzingData` each have `id: string` and `id_ihld: string`, satisfying `IdentifiableRecord`. `submitAanwijzing(allowOverwrite, targetId)` is updated at its definition and both call sites (Task 5 steps 4-6). ✓
