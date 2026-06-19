# Multi-Project Operational Pages Spec

## Context

Workspace ini sudah menyimpan tiga project type: JPP, NodeB, dan HEM. Project data page untuk NodeB/HEM sudah memakai `project_type`, tetapi halaman operasional BoQ Plan, AANWIJZING, Rekap UT, Report, KPI Report, Synchronization, dan Column Config masih dominan JPP atau placeholder.

## Current State

| Area | Current behavior | Gap |
| --- | --- | --- |
| Dashboard | `/dashboard` render `DashboardRecap` JPP | Harus kosong dulu |
| KPI JPP | `/kpi-report/jpp` masih `ComingSoon` | Harus memakai isi dashboard lama |
| NodeB/HEM operational pages | BoQ, AANWIJZING, UT, Report, KPI masih `ComingSoon` | Harus memakai referensi JPP |
| Column Config | Satu tabel config global JPP | Harus selectable JPP, NodeB, HEM |
| Synchronization | Sync service sudah sync 3 sumber, UI belum menampilkan breakdown 3 project | UI harus eksplisit menampilkan JPP/NodeB/HEM |
| BoQ Plan | `boq.project_uid` ada, API global | API/UI harus filter per project |
| AANWIJZING/UT | Tabel belum punya `project_type` | Data harus terpisah per project |

## Proposed Change

1. Jadikan `column_config` multi-project dengan primary key `(project_type, field_key)`.
2. Seed default column config untuk JPP, NodeB, HEM dari `project-config`.
3. Update sync agar memakai runtime column config untuk semua project dan menyimpan breakdown per project di `sync_logs.details`.
4. Tambahkan `project_type` ke `aanwijzing` dan `ut`, default data lama sebagai JPP.
5. Scope API BoQ, AANWIJZING, dan UT dengan `projectType`.
6. Reuse halaman JPP untuk route NodeB/HEM dengan prop `projectType`.
7. Pindahkan dashboard recap lama ke KPI Report JPP/NodeB/HEM, sedangkan dashboard menjadi empty state.

## Acceptance Criteria

1. `/dashboard` tidak lagi render KPI recap JPP dan menampilkan empty state.
2. `/kpi-report/jpp` render KPI recap JPP dengan data JPP.
3. `/nodeb/kpi-report` dan `/hem/kpi-report` render KPI recap sesuai project type.
4. `/nodeb/boq`, `/nodeb/aanwijzing`, `/nodeb/ut`, `/nodeb/report` tidak lagi `ComingSoon` dan memakai data NodeB.
5. `/hem/boq`, `/hem/aanwijzing`, `/hem/ut`, `/hem/report` tidak lagi `ComingSoon` dan memakai data HEM.
6. `/settings/columns` bisa memilih JPP, NodeB, HEM; save/reset/detect header berjalan per project.
7. `/settings/sync` menampilkan breakdown JPP, NodeB, HEM dari sync terakhir bila tersedia.
8. Existing JPP flow tetap berjalan dan data lama default ke JPP.
9. Targeted tests untuk repository/config/page behavior lulus.

## Testing Plan

| Layer | What |
| --- | --- |
| Unit | `ColumnConfigRepository` isolates JPP/NodeB/HEM config |
| Unit | `ProjectRepository.getForSelect(projectType)` filters select options |
| Unit | `AanwijzingRepository` and `UtRepository` filter by `project_type` |
| Component | `ColumnConfigClient` sends selected `projectType` to detect/save |
| Component | Dashboard empty state renders without KPI recap |
| Integration smoke | Typecheck and targeted Vitest suite |

## Out of Scope

- Creating separate physical tables per project.
- Reworking topology master data per project.
- Changing spreadsheet IDs beyond the existing env/config mechanism.
