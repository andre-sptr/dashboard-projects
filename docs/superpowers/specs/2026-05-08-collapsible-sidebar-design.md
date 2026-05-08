# Collapsible Sidebar Design

## Goal

Reduce sidebar visual density by grouping secondary navigation into collapsible categories while keeping Dashboard immediately accessible.

## Navigation Structure

- Top-level item: Dashboard.
- Monitoring: Analytics, Report, Audit Timeline.
- Project Tracking: Projects Data, BoQ Plan, Catatan AANWIJZING, Rekap UT.
- Network Inventory: Topology, OLT Inventory, ODC Inventory.
- Administration: Vendor Management, Settings.

## Behavior

- Each category can be expanded or collapsed with a chevron button.
- A category containing the current route opens automatically on initial render and when the route changes.
- The active child item keeps the existing active styling.
- Clicking a child item closes the sidebar on mobile, matching current behavior.
- Dashboard remains outside the collapsible groups for fast access.

## Scope

The implementation is limited to `src/components/layout/Sidebar.tsx`. The main layout width, topbar behavior, routes, and page metadata are unchanged.

## Testing

- Run lint to catch TypeScript and JSX issues.
- Build or run the app if needed to verify route-aware sidebar rendering.
