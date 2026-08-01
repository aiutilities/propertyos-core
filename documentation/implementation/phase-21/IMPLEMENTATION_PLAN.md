# Phase 21B Frontend Core Implementation Plan

## Baseline

- Phase 21A6 commit: `89e152cd91b74cd9a6f13976766da013141b9479`
- Routes reviewed: 11
- Defects recorded: 6
- Visual direction: approved
- Pilot readiness: blocked

## Checkpoints

### Phase 21B2 — API Error Foundation
Create `ApiError`, safe parsing, status classification and tests.

### Phase 21B3 — Session Lifecycle Foundation
Add `propertyos:session-expired`, idempotent invalidation and tests.

### Phase 21B4 — Authentication Integration
Integrate authenticated 401 handling, login exemption and download behavior.

### Phase 21B5 — Protected Route and Login Integration
Suppress protected content, redirect deterministically and show safe messages.

### Phase 21B6 — Property Error-State Integration
Add visible Property errors, retries and remove silent blank states.

### Phase 21B7 — Regression and Browser Re-audit
Run typecheck, build, tests, stale-token scenario and Wave 1 re-audit.

## Rules

- One checkpoint per commit.
- No database migration.
- No backend change unless separately justified.
- No module-specific 401 redirect duplication.
- No raw response-body rendering.
- No defect closure without browser evidence.
