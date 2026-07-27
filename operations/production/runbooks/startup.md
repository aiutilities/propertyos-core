# PropertyOS Production Startup Runbook

## Purpose

Start the approved PropertyOS production runtime in a controlled, fail-closed sequence.

## Preconditions

- Explicit human production authorization is recorded.
- Repository is on the approved release commit.
- Working tree is clean.
- Production environment variables are present.
- Secret values are supplied outside version control.
- PostgreSQL is available.
- Required backup evidence exists.
- Migration preflight has passed.
- Previous deployable artifact is available.

## Startup Sequence

1. Validate production environment configuration.
2. Validate PostgreSQL connectivity.
3. Run migration static preflight.
4. Run database migration preflight.
5. Confirm migration execution authorization separately.
6. Start PostgreSQL if it is not already running.
7. Start the compiled backend.
8. Start the compiled scheduler worker.
9. Start the Next.js production frontend.
10. Verify backend liveness.
11. Verify backend readiness.
12. Verify Prometheus scraping.
13. Verify Grafana dashboard availability.
14. Verify alert-rule loading.
15. Record startup evidence.

## Required Runtime Entries

- Backend: backend/dist/main.js
- Scheduler: backend/dist/scheduler-worker.js
- Frontend: Next.js production server

## Health Gates

- GET /api/v1/health/live returns HTTP 200.
- GET /api/v1/health/ready returns HTTP 200.
- Readiness response status equals ok.
- Database check equals ok.
- Scheduler check equals ok.
- Storage check equals ok.
- Event-bus check equals ok.
- Workflow check equals ok.
- Plugin check contains no failed plugins.

## Failure Handling

If any health gate fails:

- Do not continue rollout.
- Do not expose the deployment to users.
- Preserve logs and health responses.
- Stop newly started application processes.
- Keep PostgreSQL intact.
- Follow the incident or rollback runbook.

## Safety Boundary

This runbook does not authorize production execution, migration execution, database mutation, or secret disclosure.
