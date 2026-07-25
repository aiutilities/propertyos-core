# PropertyOS v1.0.1 Release Manifest

## Identity

- Product: PropertyOS
- Version: `v1.0.1`
- Release name: `PropertyOS v1.0.1 — First Certified Release`
- Release date: `2026-07-25`
- Manifest generated at: `2026-07-25T07:27:58Z`
- Branch: `feature/phase-15c3-lease-specialist`
- Audited source HEAD: `3509d053b58c24b8f0426c3dffd1ef06deb86a94`

## Version history

- Historical published tag: `v1.0.0`
- Historical tag target: `c46354e97a2c799c6745c1216f31886456ffaf9d`
- Historical tag status: preserved unchanged
- First fully certified release: `v1.0.1`

## Certification

- Closure-register sections: 8
- Certified capabilities: 50
- Pending capabilities: 0
- Certification reports: 18
- Final release audit: PASSED

## Repository inventory

- Backend TypeScript files: 1,245
- Backend test files: 294
- Frontend TypeScript/TSX files: 419
- SQL migrations: 51

## Regression evidence

- Backend test suites: 294 passed
- Backend tests: 2,069 passed
- Backend build: PASSED
- Frontend typecheck: PASSED
- Frontend production build: PASSED
- Docker images: BUILT AND VERIFIED
- Static migration preflight: PASSED
- Active readiness probe: PASSED
- Release-blocker scan: PASSED

## Runtime artifacts

- API entrypoint: `dist/main.js`
- Scheduler entrypoint: `dist/scheduler-worker.js`
- Migration entrypoint: `dist/database/runner/migration-runner.js`

## Docker images

- `backend-api:latest`
- `backend-scheduler:latest`
- `backend-migrate:latest`

## Required operational documents

- `documentation/DEPLOYMENT.md`
- `documentation/BACKUP_RESTORE.md`
- `documentation/PHASE_13D6_PRODUCTION_OPERATIONAL_RUNBOOK.md`
- `docs/release/PROPERTYOS_CLOSURE_REGISTER.md`
- `docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md`
- `docs/release/PROPERTYOS_V1_0_1_RELEASE_NOTES.md`

## Release declaration

PropertyOS v1.0.1 is approved as the first fully audited and certified PropertyOS release.
