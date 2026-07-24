# PropertyOS Maintenance, Facility and Asset Certification

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD before certification: `0d4a6a535b0945a938df8b06a3a25b9c6b077e15`

## Capability model

- Maintenance is a standalone operational module.
- Facility is a standalone operational module.
- Asset is a Facility-backed capability rather than a separate module.

The certified operational relationships are:

`Maintenance Ticket → Assignment → Workflow Transition → SLA Monitoring`

`Facility → Asset Registry → Asset Lifecycle → Preventive Maintenance`

## Capability mapping

- Maintenance: `backend/src/core/maintenance`
- Facility: `backend/src/core/facility`
- Asset: Facility-backed through `backend/src/core/facility`

## Maintenance implementation

- `backend/src/core/maintenance/bootstrap/maintenance-bootstrap.service.ts`
- `backend/src/core/maintenance/bootstrap/maintenance-workflow-bootstrap.service.ts`
- `backend/src/core/maintenance/controllers/maintenance.controller.ts`
- `backend/src/core/maintenance/dto/assign-maintenance-ticket.dto.ts`
- `backend/src/core/maintenance/dto/create-maintenance-ticket.dto.ts`
- `backend/src/core/maintenance/dto/transition-maintenance-ticket.dto.ts`
- `backend/src/core/maintenance/dto/update-maintenance-ticket.dto.ts`
- `backend/src/core/maintenance/handlers/maintenance-sla-overdue-job.handler.ts`
- `backend/src/core/maintenance/handlers/maintenance-sla-warning-job.handler.ts`
- `backend/src/core/maintenance/index.ts`
- `backend/src/core/maintenance/maintenance-search-provider.service.ts`
- `backend/src/core/maintenance/maintenance-workflow.definition.ts`
- `backend/src/core/maintenance/maintenance.constants.ts`
- `backend/src/core/maintenance/maintenance.module.ts`
- `backend/src/core/maintenance/repositories/maintenance.repository.ts`
- `backend/src/core/maintenance/repositories/postgres-maintenance.repository.ts`
- `backend/src/core/maintenance/services/maintenance-sla.service.ts`
- `backend/src/core/maintenance/services/maintenance.service.ts`
- `backend/src/core/maintenance/types/maintenance-sla-job.types.ts`
- `backend/src/core/maintenance/types/maintenance.types.ts`

## Facility implementation

- `backend/src/core/facility/bootstrap/facility-bootstrap.service.ts`
- `backend/src/core/facility/bootstrap/facility-workflow-bootstrap.service.ts`
- `backend/src/core/facility/controllers/facility.controller.ts`
- `backend/src/core/facility/dto/create-asset-category.dto.ts`
- `backend/src/core/facility/dto/create-asset.dto.ts`
- `backend/src/core/facility/dto/create-preventive-maintenance-plan.dto.ts`
- `backend/src/core/facility/dto/transition-asset.dto.ts`
- `backend/src/core/facility/dto/update-asset.dto.ts`
- `backend/src/core/facility/facility-search-provider.service.ts`
- `backend/src/core/facility/facility-workflow.definition.ts`
- `backend/src/core/facility/facility.constants.ts`
- `backend/src/core/facility/facility.module.ts`
- `backend/src/core/facility/index.ts`
- `backend/src/core/facility/repositories/facility.repository.ts`
- `backend/src/core/facility/repositories/postgres-facility.repository.ts`
- `backend/src/core/facility/services/facility.service.ts`
- `backend/src/core/facility/types/facility.types.ts`

## Asset implementation evidence

- `backend/src/core/facility/controllers/facility.controller.ts`
- `backend/src/core/facility/dto/create-asset-category.dto.ts`
- `backend/src/core/facility/dto/create-asset.dto.ts`
- `backend/src/core/facility/dto/transition-asset.dto.ts`
- `backend/src/core/facility/dto/update-asset.dto.ts`
- `backend/src/core/facility/facility.module.ts`
- `backend/src/core/facility/repositories/facility.repository.ts`
- `backend/src/core/facility/repositories/postgres-facility.repository.ts`
- `backend/src/core/facility/services/facility.service.ts`
- `backend/src/core/facility/types/facility.types.ts`

## Required migrations

- `backend/src/database/migrations/core/023-create-core-maintenance-tables.sql`
- `backend/src/database/migrations/core/024-create-core-facility-asset-tables.sql`

## Frontend routes

- `frontend/src/app/maintenance/page.tsx`
- `frontend/src/app/maintenance/new/page.tsx`
- `frontend/src/app/maintenance/[id]/page.tsx`
- `frontend/src/app/resident/maintenance/page.tsx`
- `frontend/src/app/resident/maintenance/new/page.tsx`
- `frontend/src/app/facilities/page.tsx`
- `frontend/src/app/facilities/assets/page.tsx`
- `frontend/src/app/facilities/assets/new/page.tsx`
- `frontend/src/app/facilities/assets/[id]/page.tsx`

## Test evidence

- `backend/src/core/ai/property-intelligence/maintenance-risk-analyzer.service.integration-spec.ts`
- `backend/src/core/ai/property-intelligence/property-operations-intelligence.service.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-maintenance-integration.integration-spec.ts`
- `backend/tests/integration/facility.integration-spec.ts`
- `backend/tests/integration/maintenance.integration-spec.ts`

## Verification

- Related test files discovered: 5
- Maintenance-specific test files: 3
- Facility/Asset-specific test files: 1
- Operations-intelligence test files: 1
- Maintenance persistence and API lifecycle: VERIFIED
- Maintenance workflow lifecycle: VERIFIED
- Maintenance SLA lifecycle: VERIFIED
- Facility persistence and API lifecycle: VERIFIED
- Asset persistence and API lifecycle: VERIFIED
- Facility-backed Asset architecture: VERIFIED
- Facility and Asset controller routes: VERIFIED
- Search-provider integration: VERIFIED
- Frontend route coverage: VERIFIED
- Targeted Operations regression: PASSED
- Backend TypeScript build: PASSED
- Frontend validation: PASSED
- Unfinished-marker scan: PASSED
- Existing untracked KDD and knowledge files were excluded from certification scope.

## Certification decisions

- Maintenance: **CERTIFIED**
- Facility: **CERTIFIED**
- Asset: **CERTIFIED — FACILITY-BACKED**
