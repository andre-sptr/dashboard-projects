# Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group sidebar navigation into collapsible categories while keeping Dashboard directly accessible.

**Architecture:** Update the existing client-side `Sidebar` component only. Replace the flat `NAV_ITEMS` array with a top-level item plus route-aware category groups managed by local React state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, lucide-react.

---

### Task 1: Sidebar Navigation Groups

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Define grouped navigation data**

Replace the flat `NAV_ITEMS` with a `PRIMARY_NAV_ITEM` and `NAV_GROUPS` data structure using existing lucide icons.

- [ ] **Step 2: Add route-aware open state**

Use `useMemo`, `useState`, and `useEffect` so the category containing the active route opens automatically when `pathname` changes.

- [ ] **Step 3: Render Dashboard and collapsible groups**

Render Dashboard as a normal link, then render category buttons with chevrons and child links.

- [ ] **Step 4: Preserve mobile close behavior**

Keep `onClose` on link clicks so selecting a route closes the mobile sidebar.

- [ ] **Step 5: Verify**

Run `npm run lint` and fix any TypeScript or JSX issues.
