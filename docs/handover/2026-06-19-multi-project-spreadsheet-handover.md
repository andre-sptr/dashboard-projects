# Handover — Multi-Project Spreadsheet Integration (JPP / NodeB / HEM)

**Date:** 2026-06-19
**Status:** Discovery / grounding done. Design NOT finalized. Implementation NOT started.
**For:** the next agent (codex) continuing this work.
**Owner language:** the user communicates in Indonesian; domain terms kept verbatim below.

This document captures everything grounded and decided so far so work can continue cold. Read it fully before touching code. The brainstorming process (superpowers) was paused here at the user's request — the next step is to resolve the OPEN QUESTIONS, finish the design, then write an implementation plan.

---

## 1. The request (verbatim intent)

1. Change the data-source spreadsheet to a NEW one:
   `https://docs.google.com/spreadsheets/d/1VHoSTqa35ADiqkU6TGxQ7oJtB4QHNQiBO90xeQQOcvU/edit?gid=0#gid=0`
   - **gid=0 → JPP**
   - **gid=1703451476 → NodeB**
   - **gid=1708701845 → HEM**
2. Make **NodeB** and **HEM** projects live. Their pages should look **like JPP's "Projects Data" page**, but each field is sourced from a **different column** in that project's own sheet tab.
3. The user's raw column notes (Indonesian, intentionally rough — they said it is "rancu/membingungkan" and asked to ground the sheet first):
   ```
   NodeB
   1. golive   = AE
   2. komitmen = AK
   3. unik id  = E
   4. Filter kolom AI (tematik), bulan, tahun
   5. Batch diganti kolom U
   6. Chart perencanaan
   HEM
   1. Detail   = V
   2. unik id  = D
   ```

---

## 2. Spreadsheet grounding (VERIFIED against the live sheet)

All three tabs are **publicly readable via CSV export** (no auth needed). Re-fetch any tab with:
```
https://docs.google.com/spreadsheets/d/1VHoSTqa35ADiqkU6TGxQ7oJtB4QHNQiBO90xeQQOcvU/export?format=csv&gid=<GID>
```
Header row = **row 1** (CSV line 0) for all three tabs. Snapshots were saved (git-ignored scratch) at `.superpowers/sdd/sheets/{jpp,nodeb,hem}.csv` during grounding — they may be stale; re-fetch to be safe.

Column letter ↔ 0-based index: A=0, B=1, … Z=25, AA=26, …

### 2a. JPP tab (gid=0) — 32 columns, ~3541 data rows
Columns **A–AF match the app's CURRENT column config EXACTLY** (see `src/lib/sheet-columns.ts` `COLUMN_FIELDS`). Order: A TAHUN, B ID-IHLD, C NAMA LOP, D REGIONAL, E AREA, F STO, G REGION FMC, H BRANCH FMC, I BATCH PROGRAM, J ODP PLAN, K PORT PLAN, L CPP, M BOQ, N Mitra, O Status, P SUB STATUS KONS, Q DETAIL STATUS, R KOMITMEN GOLIVE, S TARGET GOLIVE APRIL, T Prioritas 1 by Tsel, U PID (Proactive), V KET, W WASPANG, X PROJECT ADMIN, Y STATUS GOLIVE, Z KENDALA GOLIVE, AA Progres MINOL, AB REAL JML ODP 8, AC REAL JML ODP 16, AD ID SW ABD, AE REAL JML PORT GOLIVE, AF TANGGAL GOLIVE.

**⚠️ The app's config expects 36 columns; the new JPP tab only has 32.** These 4 app fields DO NOT EXIST in the new tab (they were AG–AJ): `Nilai PRELIM`, `Nilai BOQ QE`, `BOQ Aanwijzing` (`BOQ Aandwidjzing`), `ODP Aanwijzing` (`ODP Aandwidjzing`). Any dashboard feature reading those will be empty/0 after switching URL. **OPEN QUESTION (see §5).**

### 2b. NodeB tab (gid=1703451476) — 59 columns, ~1156 data rows
Tower/site rollout tracker. Full header map:
```
A(0)  ID                 P(15) BATCH  WO          AE(30) TGL COMMIT OA      AT(45) REAL TIANG
B(1)  REGION             Q(16) PLAN CATUAN FO     AF(31) TGL SLA HO         AU(46) REAL GALIAN
C(2)  BRANCH             R(17) CAT PLAN CATUAN FO  AG(32) TGL OA HO          AV(47) REAL FO
D(3)  STO                S(18) NILAI PLAN         AH(33) CAT SLA HO         AW(48) EVIDENCE
E(4)  SITE ID            T(19) KABEL FO PLAN      AI(34) CAT TEMATIK HO     AX(49) MAN POWER
F(5)  SITE NAME          U(20) KABEL FO DRM       AJ(35) CEK JPP TIF HO     AY(50) PROGRESS%
G(6)  TIKOR SITE         V(21) NILAI PRELIM       AK(36) TGL COMMIT OA FIX  AZ(51) SPEED (m)
H(7)  TP                 W(22) NILAI DRM          AL(37) VALID REPORT       BA(52) WASPANG
I(8)  ORDER NIM          X(23) APPROVAL           AM(38) UPDATED            BB(53) NODIN REQ UT / DROP
J(9)  TIPE ORDER         Y(24) START INSTALL      AN(39) PRIORITY A1        BC(54) TGL NODIN REQ UT / DROP
K(10) SOW PRE ORDER      Z(25) STATUS TOWER       AO(40) 6.1 OA             BD(55) NODIN UT
L(11) DASAR WO           AA(26) STATUS            AP(41) REKAP AGING        BE(56) TGL NODIN UT
M(12) TGL WO             AB(27) SUB STATUS        AQ(42) TGT TIANG          BF(57) TIM UT
N(13) MITRA              AC(28) DETIL PROGRESS    AR(43) TGT GALIAN         BG(58) x1
O(14) SUBCON             AD(29) REMARKS           AS(44) TGT FO
```
Sample values (3 rows): E `SITE ID`=[AGR030, AKN005, BKG037]; P `BATCH WO`=["TIF Batch 01"×3]; U `KABEL FO DRM`=[2.550, 15.600, 2.200] (cable meters); AA `STATUS`=["6. On Air","2. Perizinan","6. On Air"]; AE `TGL COMMIT OA`=[16/Jul/2026,20/Jun/2026,07/Jun/2026]; AI `CAT TEMATIK HO`=["New Link Regular"×3]; AK `TGL COMMIT OA FIX`=[17/Mar/2026,29/Agu/2026,03/Feb/2026].

### 2c. HEM tab (gid=1708701845) — 71 columns, ~802 data rows
Full header map (note: indices 51 `AZ` and 58 `BG` have EMPTY headers — gaps):
```
A(0)  REGION             O(14) NDE DARI RSO       AC(28) ODP Real          AQ(42) MONTH GOLIVE
B(1)  DISTRICT           P(15) NDE WORK ORDER KE TA AD(29) Port Real        AR(43) GOLIVE APRIL
C(2)  STO                Q(16) Mitra              AE(30) ODP GOLIVE         AS(44) WEEK COMM NEW
D(3)  IHLD               R(17) Subkon             AF(31) Tanggal Golive IHLD AT(45) TIPE PT3
E(4)  NAMA LOP           S(18) Progress Lapangan  AG(32) Tanggal Golive Real AU(46) CEK SC TIF (REKOMENDASI ODP)
F(5)  NDE KE BUSDEV      T(19) Sub Status         AH(33) Tanggal submit order nde AV(47) JUMLAH PORT IDLE
G(6)  WITEL              U(20) STATUS JT          AI(34) durasi order 2     AW(48) Tim Waspang
H(7)  SEGMEN             V(21) Detail Progres     AJ(35) klaf durasi order  AX(49) Tim UT
I(8)  UNSC/PROJECT       W(22) Komitmen Golive    AK(36) boq bantu          AY(50) CATATAN HOLD
J(9)  BATCH ORDER        X(23) Week Kom GL        AL(37) BULAN KOMITMEN     BA(52) STATUSSSUMSEL
K(10) PERUBAHAN DESIGN   Y(24) Hasil DRM          AM(38) TARGET GOLIVE      BB(53) SUMSEL1_TITIP
L(11) TIPE DESAIN        Z(25) BOQ AANWIDZJING    AN(39) WEEK COMM          BC(54) SUMSEL2_TITIP
M(12) TIPE DESAIN 2      AA(26) Selisih BoQ       AO(40) WEEK GOLIVE        BD(55) KET SUMSEL
N(13) BOQ                AB(27) % Kenaikan        AP(41) NO ORDER           BE(56) MITRA
                                                                            BF(57) HELP SMILE
BH(59) TOLONG JANGAN DIHAPUS ... | LAST UPDATE   BI(60) SERVICE   BJ(61) BANDWIDTH   BK(62) DURASI JT
BL(63) BOQ   BM(64) REVENEU   BN(65) KONTRAK   BO(66) STATUS PT1   BP(67) PRIORITY BY TIF
BQ(68) ID TELEGRAM WASPANG   BR(69) ID TELEGRAM TIM UT   BS(70) PJ KABEL SBU
```
Sample values: D `IHLD`=[12916231,11253179,12579102]; E `NAMA LOP`=project names; J `BATCH ORDER`=["1"]; V `Detail Progres`=long multi-line progress logs; W `Komitmen Golive`=[12/Jun/26,…]; AF `Tanggal Golive IHLD`=["Mei 17, 2026",…]; AG `Tanggal Golive Real`=["Juni 13, 2026",…]; AL `BULAN KOMITMEN`=[6,2,12].

---

## 3. DECISIONS LOCKED (confirmed with the user)

| Field (JPP concept) | NodeB column | HEM column | Notes |
|---|---|---|---|
| Unique id (row key) | **E** `SITE ID` | **D** `IHLD` | confirmed |
| Batch | **U** `KABEL FO DRM` | (J `BATCH ORDER` is the obvious one; NOT yet confirmed for HEM) | ⚠️ User EXPLICITLY chose NodeB col **U** for "Batch" even after being shown U = cable-length numbers (2.550, …). The natural batch column is P `BATCH WO` ("TIF Batch 01"). Implement U as instructed, but DOUBLE-CHECK with the user — likely a slip. |
| Golive (actual) | **AE** `TGL COMMIT OA` | (likely AG `Tanggal Golive Real`; unconfirmed) | NodeB confirmed = AE. User said headers are "just reference", use the LETTER. |
| Komitmen (commitment) | **AK** `TGL COMMIT OA FIX` | (likely W `Komitmen Golive`; unconfirmed) | NodeB confirmed = AK. |
| Detail | (NodeB AC `DETIL PROGRESS`?) | **V** `Detail Progres` | HEM confirmed = V. NodeB detail column not specified. |

NodeB-specific UI requirements (from notes):
- **Filter by `CAT TEMATIK HO` (AI/34)** — e.g. "New Link Regular" — plus **bulan (month)** and **tahun (year)** filters.
- **"Chart perencanaan" (planning chart)** — meaning UNDEFINED. Must clarify what it plots (likely golive plan vs realisasi over time/month). OPEN.

Other locked context:
- New spreadsheet URL/ID + the 3 gids (§1).
- Approach is **placeholder-free**: NodeB/HEM "Projects Data" should mirror JPP's, sourced from each tab.

---

## 4. Current architecture (how the app works today — single-project)

Key files:
- `src/lib/env.ts` — `SPREADSHEET_ID` + `SHEET_ID` (single gid) from env; helpers `getSpreadsheetId()`, `getSheetId()`, `hasGoogleSheetsConfig()`.
- `src/lib/google-sheets.ts` — `GoogleSheetsClient.getRowsFromGid(gid, range)` (uses `googleapis`; needs `GOOGLE_CREDENTIALS`/`GOOGLE_APPLICATION_CREDENTIALS`).
- `src/lib/sheet-columns.ts` — `COL` defaults + `COLUMN_FIELDS` (36 JPP fields), `ColumnMap` type, `indexToLetter`/`letterToIndex`, `normalizeHeader`. **These are DEFAULTS only**; the live map is in the DB.
- `src/repositories/ColumnConfigRepository.ts` — `getMap()` / `getAll()`; live editable column map (table `column_config`). Editable in UI at **Settings → Column Config** (`/settings/columns`, `ColumnConfigClient.tsx`), incl. "auto-detect from header".
- `src/lib/sync-service.ts` — `SyncService.syncProjects()`: reads ONE gid (`getSheetId()`), range `A4:<widest col>`, uses `ColumnConfigRepository.getMap()`. **Filters `REGION_FMC === 'SUMBAGTENG'`**, skips rows `< 16` cols, key **`uid = id_ihld::batch_program`**, writes table `projects` (fields: nama_lop, region, status, sub_status, area, branch, mitra, sto, odp_planned, port_planned, port_realized, golive_target=`KOMITMEN_GOLIVE`, golive_actual=`TANGGAL_GOLIVE`, plus `full_data` = JSON of the whole row slice, plus status-change `history`). Has a "golive target deadline-day" rejection rule.
- `src/app/(main)/projects/page.tsx` — server page: `ProjectRepository.findAllByRegion('SUMBAGTENG')` + `ColumnConfigRepository.getAll()` → renders `DashboardClient`.
- `src/components/features/dashboard/DashboardClient.tsx` — the actual table + filters + charts (renders columns via the column config; `full_data` lets it show any column). **This is the component to reuse per-project.**
- Sync routes: `src/app/api/sync/*`; scheduler `src/lib/sync-scheduler.ts`; webhook `src/app/api/webhook`.

Data shape note: `projects` table + `column_config` are **single-tenant / JPP-shaped** — no `project_type` dimension exists.

---

## 5. OPEN QUESTIONS (resolve these before finalizing the design)

1. **Scope of pages for NodeB/HEM this phase.** The user did not confirm (answered "something else" then asked for this handover). The notes only describe the **"Projects Data" page** (table + filters + planning chart). Likely scope = Projects Data for NodeB & HEM only; BoQ Plan / AANWIJZING / Rekap UT / Report / KPI Report stay as the placeholders built earlier (see `docs/superpowers/specs/2026-06-19-sidebar-project-restructure-design.md`). **CONFIRM with user.**
2. **JPP's 4 missing columns** (Nilai PRELIM, Nilai BOQ QE, BOQ Aanwijzing, ODP Aanwijzing). Leave empty / remove from JPP display / re-check the sheet? **UNRESOLVED.**
3. **NodeB "Batch" = column U** (cable length) — confirm it is not a slip for P `BATCH WO`.
4. **"Chart perencanaan"** — define exactly what it shows.
5. **Per-project ROW FILTER** — JPP filters `REGION_FMC == 'SUMBAGTENG'`. NodeB/HEM have no such column; decide each project's row-inclusion rule (probably "all rows with a non-empty unique id").
6. **Per-project uid & batch** — NodeB uid=`SITE ID`, batch=`U`; HEM uid=`IHLD`, batch=`J?`. Decide uid composition per project (JPP uses `id_ihld::batch`).
7. **HEM full field mapping** — only `IHLD`(D) and `Detail Progres`(V) confirmed; map the remaining JPP-equivalent fields (nama_lop=E, batch=J?, komitmen=W?, golive=AG?, bulan=AL?, etc.) WITH the user.
8. **Which env/credentials** are configured in the deploy (Google service account) — needed for live sync of the new spreadsheet.

---

## 6. Recommended architecture (proposal — not yet approved)

Add a **`project_type`** dimension (`JPP` | `NODEB` | `HEM`) rather than new tables:
- Add `project_type` column to `projects` and to `column_config` (so each project has its own editable column map). Migration via `src/lib/migrations.ts`.
- Generalize `SyncService.syncProjects()` into a per-project sync: parameterize by `(gid, project_type, columnMap, rowFilter, uidComposer)`. Run it once per project (3 gids of ONE spreadsheet → so `SHEET_ID` env becomes a per-project gid map, or store gids in config).
- **Reuse** `DashboardClient` + the Projects page, parameterized by `project_type` (the NodeB/HEM placeholder routes `/nodeb/projects`, `/hem/projects` created earlier become real pages that pass their `project_type`). `full_data` already stores whole rows, so the table renders each project's columns from its own `column_config`.
- NodeB extras (tematik/bulan/tahun filters, planning chart) layer on top of the NodeB Projects Data page.
- Settings → Column Config UI extended to pick the project whose map you're editing (lets the user fix mappings themselves instead of hard-coding — especially useful given the messy headers).

This is **too large for one spec** — decompose, e.g.:
- **Phase 0:** switch to new spreadsheet for JPP (+ handle the 4 missing cols). Smallest, keeps JPP working.
- **Phase 1:** `project_type` infra (migrations, per-project column_config, parameterized sync, per-project Projects page).
- **Phase 2:** NodeB Projects Data (mapping U/E/AE/AK + tematik/bulan/tahun filters + planning chart).
- **Phase 3:** HEM Projects Data (mapping D/V + full field map).

---

## 7. Suggested next steps for codex

1. Re-confirm the OPEN QUESTIONS (§5) with the user — especially scope (#1), JPP missing columns (#2), NodeB Batch=U (#3), and the HEM full mapping (#7).
2. Re-ground the sheet if needed via the CSV export URLs in §2 (no auth required for reading).
3. Resume the superpowers brainstorming flow: finish the design, write it to `docs/superpowers/specs/`, then `writing-plans`.
4. Verify the deploy's Google credentials/env before relying on live sync.

## 8. Pointers
- Sidebar/routes already have NodeB/HEM placeholder pages (`/nodeb/*`, `/hem/*`) and per-project groups — see `src/components/layout/Sidebar.tsx` and `docs/superpowers/specs/2026-06-19-sidebar-project-restructure-design.md`.
- Column letter helpers: `indexToLetter` / `letterToIndex` in `src/lib/sheet-columns.ts`.
- Grounding CSV snapshots (may be stale, git-ignored): `.superpowers/sdd/sheets/{jpp,nodeb,hem}.csv`.
