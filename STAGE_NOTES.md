# Stage Notes — Decisions Log

Running log of what was built at each stage and why, so later stages (and
anyone else picking this up) don't have to re-derive the reasoning.

## Stage 4 Correction — Data grain & identity transition

Two issues from the original Stage 4 review, both corrected before any
dashboard work proceeds.

### 1. Data grain: `MonthlyMetric` → `AdvisorMetricSnapshot`

**Re-inspected the actual workbook** to answer the daily-vs-cumulative
question rather than assume. Finding: every one of the 12 fact sheets has
the identical header shape `Month, Branch, City, Employee Number, Name,
Designation, Grade, <metric...>` — **no date/day column exists anywhere**,
and nothing in the file distinguishes a daily figure from a cumulative
one. The file's structural grain is (advisor, calendar month), full stop.

Given daily uploads are now the real cadence, the only defensible design
is to treat each day's upload as a **snapshot** of the (advisor, month)
state as of that day — without assuming whether the current month's
number is cumulative-and-growing or a full replacement. New grain:

```
(advisor_id, period_year, period_month, snapshot_date)
```

Table renamed `advisor_metric_snapshots`, model class `AdvisorMetricSnapshot`.
Unique constraint on that 4-tuple means re-uploading the same day's file
upserts in place — never duplicates. This is a periodic-snapshot design,
not a daily-transaction design, because the source data gives no evidence
of daily transactions.

**How each requested rollup is derived (query-time, nothing pre-stored):**
| Rollup | Derivation |
|---|---|
| MTD (open month) | The latest `snapshot_date` within that `(advisor, period_month)` — already reflects everything up to that point, by definition |
| Monthly total (closed month) | That month's *final* snapshot — the last one recorded before the month rolled over — never a sum of that month's snapshots |
| Daily value for a specific day | `snapshot(day) − snapshot(previous available day, same month)`, computed at query time |
| Weekly | Sum of daily deltas across the week, equivalently `snapshot(week end) − snapshot(day before week start)` |
| YTD | Sum of each *closed* month's final snapshot + the current open month's latest snapshot — never a sum of every daily snapshot, which would double-count |
| Custom range | `snapshot(closest date ≤ range end) − snapshot(closest date < range start)`, computed per month and summed if the range spans multiple months |

None of these derivations are implemented yet (no reporting/query service
exists — that's Stage 5+ scope); this section documents the rule they
must follow so it isn't reinvented incorrectly later.

**Flagging honestly:** the sample file only contains complete, closed
months (Jan–Jun), so there was no way to directly observe mid-month
cumulative behavior from the data itself. The snapshot design is safe
either way (cumulative or full-replacement), but if the business can
confirm which one it actually is, the delta-computation logic in Stage 5
can be simplified/validated against that.

### 2. Advisor identity transition (name → employee number)

New `app/services/advisor_resolution.py`, DB-aware, sits above the pure
`identity.py` functions (which are unchanged and still correct as the
base rule). Handles: an advisor first seen with no Employee Number later
receiving one.

- **Unambiguous transition** (exactly one existing name-only advisor with
  a matching normalized name): that advisor's row is promoted in place —
  `employee_number` set, `identity_key` updated to it — same `advisor_id`,
  so all prior history stays attached. Verified by
  `test_identity_transition_name_then_employee_number_unambiguous`.
- **Ambiguous case** (multiple existing advisors share the normalized
  name): explicitly NOT auto-merged. A new advisor row is created and the
  result is flagged (`ambiguous=True`) for the ingestion layer to surface
  for manual review — silently guessing which person the number belongs
  to would risk attributing one person's history to someone else.
  Verified by `test_identity_transition_does_not_merge_when_ambiguous`
  and the reverse case
  `test_ambiguous_reverse_case_numbered_candidates_not_merged`.
- Also handles the reverse ordering (employee number appears before a
  later name-only row for the same person) via the same candidate-lookup
  logic, so upload order doesn't matter.

### 3. `ImportBatch` metadata expanded

Added `business_date` / `business_date_end` (the data date the file
represents — distinct from `uploaded_at`, the wall-clock upload time,
since these diverge once uploads are daily), `rows_parsed`, and renamed
`rows_failed` → `rows_rejected` for clarity. `error_summary` unchanged in
purpose (short human-readable summary; full row-level validation detail
stays a preview-time API response, not persisted, to avoid unbounded
table growth).

### Verification performed
- 13/13 backend tests pass (6 pure identity tests + 7 new DB-backed
  resolution tests covering create, repeat-upload, name-formatting
  variance, unambiguous transition, and both ambiguous directions).
- Fresh DB boot confirms 3 tables with the corrected schema:
  `advisor_metric_snapshots` (with `period_year`/`period_month`/
  `snapshot_date`), `advisors` (unchanged), `import_batches` (expanded).
- `/api/health` returns `database_connected: true` against the rebuilt schema.

## Stage 4 — Project Setup (original delivery)

### What was created
- Backend: FastAPI app, SQLAlchemy models (`Advisor`, `MonthlyMetric` —
  since superseded by `AdvisorMetricSnapshot`, see correction section
  above — `ImportBatch`), config/env handling, `/api/health` endpoint,
  identity resolution service with unit tests.
- Frontend: Vite + React + TypeScript + Tailwind, React Router with the 6
  confirmed pages (currently placeholders), typed API client, app shell
  layout (sidebar desktop / bottom nav mobile) per the Stage 3 design.
- Both verified running together: backend health check returns
  `database_connected: true`, frontend build and type-check are clean,
  frontend successfully calls the live backend.

### Business rules already encoded (confirmed in Stage 2/3 discussion)
- **Identity**: `app/services/identity.py` — Employee Number wins when
  present; otherwise normalized Service Advisor Name (trimmed, whitespace
  collapsed, case-folded). No artificial IDs. Original display name is
  kept separately from the normalized matching value. Unit-tested.
- **Schema reflects "raw counts, not pre-computed percentages"**:
  `AdvisorMetricSnapshot` stores GUS, PM, NPS Promoters/Neutral/Detractors/
  Sample, etc. as raw numbers — never a stored PM Conv % or NPS %. Still
  true after the grain correction; if anything more important now, since
  YTD/MTD are derived from these raw numbers per the snapshot rules above.
- **TKM VOC**: column exists in the schema (`tkm_voc`) but is a known dead
  field in the source data — kept for future use, intentionally not
  wired into any Stage 5+ chart until real data exists.
- **Currency columns** (`vas_value`, `diy_value`, `accessories_value`) use
  SQL `Numeric(12,2)`, not float, to avoid rounding drift on money.
- **Branch/Grade/Designation** are stored per-snapshot on
  `AdvisorMetricSnapshot`, not just once on `Advisor` — an advisor's
  branch/grade can change over time and history must not be silently
  rewritten.

### Engineering decisions made without asking (non-business-critical)
- SQLite file lives at `backend/sa_tracker.db`, gitignored.
- Python venv (`backend/.venv`) rather than global install.
- Tailwind CSS v3 (stable pairing with the installed Vite version — v4's
  new PostCSS plugin setup wasn't worth the churn for this stage).
- `Base.metadata.create_all()` used for dev-time table creation. This is
  explicitly a placeholder — it only adds missing tables, never alters
  existing ones, so **Alembic must be introduced before the schema
  changes again after real data exists** (flagging this now so Stage 5+
  doesn't silently corrupt data with a schema change).
- Single wide `advisor_metric_snapshots` table instead of mirroring the
  workbook's 12 separate sheets as 12 tables — avoids a 12-way join for
  every chart.

### Known follow-ups for later stages
- CORS origins in `.env.example` assume default Vite port 5173 — update
  if the frontend is later deployed elsewhere.
- No authentication yet (flagged in Stage 2 architecture as a real
  requirement for a company app) — out of scope until a stage explicitly
  covers it.
- Rank column: still waiting on confirmation of tie-breaking behavior
  when advisors are equal on PM Conv % (the confirmed default ranking
  metric) before the ranking endpoint is built.
