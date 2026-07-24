# PropertyOS Workflow and Scheduler Certification

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD before certification: `7be5a13d6f73be7a2cf791b4cfbc42263757b869`

## Scope

This certification covers:

- Workflow module wiring
- Workflow service
- Workflow repository
- Workflow bootstrap
- Workflow event subscriber
- Workflow search integration
- Scheduler module wiring
- Scheduler service
- Scheduler controller
- Scheduler worker
- Scheduler handler registry
- Workflow-to-scheduler operational interaction

## Workflow implementation files

- `backend/src/core/workflow/bootstrap/workflow-bootstrap.service.ts`
- `backend/src/core/workflow/controllers/workflow.controller.ts`
- `backend/src/core/workflow/dto/create-workflow-definition.dto.ts`
- `backend/src/core/workflow/dto/start-workflow-by-code.dto.ts`
- `backend/src/core/workflow/dto/start-workflow.dto.ts`
- `backend/src/core/workflow/dto/transition-workflow-by-entity.dto.ts`
- `backend/src/core/workflow/dto/transition-workflow.dto.ts`
- `backend/src/core/workflow/index.ts`
- `backend/src/core/workflow/repositories/postgres-workflow.repository.ts`
- `backend/src/core/workflow/repositories/workflow-repository.interface.ts`
- `backend/src/core/workflow/services/workflow.service.ts`
- `backend/src/core/workflow/types/workflow.types.ts`
- `backend/src/core/workflow/workflow-event.subscriber.ts`
- `backend/src/core/workflow/workflow-search-provider.service.ts`
- `backend/src/core/workflow/workflow.module.ts`

## Scheduler implementation files

- `backend/src/core/scheduler/controllers/scheduler.controller.ts`
- `backend/src/core/scheduler/dto/create-job.dto.ts`
- `backend/src/core/scheduler/dto/register-handler.dto.ts`
- `backend/src/core/scheduler/index.ts`
- `backend/src/core/scheduler/registries/scheduler-handler.registry.ts`
- `backend/src/core/scheduler/repositories/postgres-scheduler.repository.ts`
- `backend/src/core/scheduler/repositories/scheduler.repository.ts`
- `backend/src/core/scheduler/scheduler.module.ts`
- `backend/src/core/scheduler/services/scheduler-worker.service.ts`
- `backend/src/core/scheduler/services/scheduler.service.ts`
- `backend/src/core/scheduler/types/report-export-job.types.ts`
- `backend/src/core/scheduler/types/scheduler.types.ts`

## Related migrations

- `backend/src/database/migrations/core/011-create-core-workflow-tables.sql`
- `backend/src/database/migrations/core/016-create-core-scheduler-tables.sql`
- `backend/src/database/migrations/core/022-make-scheduler-timestamps-timezone-aware.sql`

## Test evidence

- `backend/tests/integration/scheduler.integration-spec.ts`
- `backend/tests/integration/workflow.integration-spec.ts`

## Verification

- Related test files discovered: 2
- Workflow-specific test files: 1
- Scheduler-specific test files: 1
- Targeted Workflow and Scheduler regression: PASSED
- Backend TypeScript build: PASSED
- Unfinished-marker scan: PASSED
- Existing untracked KDD and knowledge files were excluded from certification scope.

## Certification decisions

- Workflow: **CERTIFIED**
- Scheduler: **CERTIFIED**

Both subsystems are accepted for the PropertyOS v3.0 release baseline.
