# PropertyOS Property, Tenant, Agreement and Lease Certification

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD before certification: `c04b47b2da264cd0de25e59dcf0d1ed984a92513`

## Business capability model

The certified foundational business chain is:

`Property → Tenant → Agreement → Lease capability`

PropertyOS does not maintain a separate Lease CRUD module.

The legal and occupancy record represented by Lease is persisted and exposed through the Agreement subsystem. Lease-specific AI assistance is implemented through the Lease Specialist.

## Capability mapping

- Property records: `backend/src/core/property`
- Tenant records: `backend/src/core/tenant`
- Agreement and lease records: `backend/src/core/agreement`
- Lease Specialist: `backend/src/core/ai/specialists/lease-specialist.service.ts`
- Lease Specialist bootstrap: `backend/src/core/ai/specialists/lease-specialist-bootstrap.service.ts`

## Property implementation files

- `backend/src/core/property/controllers/property.controller.ts`
- `backend/src/core/property/dto/create-property.dto.ts`
- `backend/src/core/property/dto/create-space.dto.ts`
- `backend/src/core/property/dto/create-zone.dto.ts`
- `backend/src/core/property/dto/update-property.dto.ts`
- `backend/src/core/property/index.ts`
- `backend/src/core/property/property-search-provider.service.ts`
- `backend/src/core/property/property.module.ts`
- `backend/src/core/property/repositories/postgres-property.repository.ts`
- `backend/src/core/property/repositories/property.repository.ts`
- `backend/src/core/property/services/property.service.ts`
- `backend/src/core/property/types/property.types.ts`

## Tenant implementation files

- `backend/src/core/tenant/controllers/tenant.controller.ts`
- `backend/src/core/tenant/dto/assign-space.dto.ts`
- `backend/src/core/tenant/dto/create-tenant.dto.ts`
- `backend/src/core/tenant/repositories/postgres-tenant.repository.ts`
- `backend/src/core/tenant/repositories/tenant-repository.interface.ts`
- `backend/src/core/tenant/services/tenant-dashboard-contributor.service.ts`
- `backend/src/core/tenant/services/tenant.service.ts`
- `backend/src/core/tenant/tenant-search-provider.service.ts`
- `backend/src/core/tenant/tenant.module.ts`
- `backend/src/core/tenant/types/tenant.types.ts`

## Agreement and lease-record implementation files

- `backend/src/core/agreement/agreement-search-provider.service.ts`
- `backend/src/core/agreement/agreement.module.ts`
- `backend/src/core/agreement/controllers/agreement.controller.ts`
- `backend/src/core/agreement/dto/create-agreement.dto.ts`
- `backend/src/core/agreement/repositories/agreement-repository.interface.ts`
- `backend/src/core/agreement/repositories/postgres-agreement.repository.ts`
- `backend/src/core/agreement/services/agreement-dashboard-contributor.service.ts`
- `backend/src/core/agreement/services/agreement.service.ts`
- `backend/src/core/agreement/types/agreement.types.ts`

## Lease-specific AI implementation files

- `backend/src/core/ai/specialists/lease-specialist-bootstrap.service.ts`
- `backend/src/core/ai/specialists/lease-specialist.service.ts`

## Related migrations

- `backend/src/database/migrations/core/004-create-core-property-space-tables.sql`
- `backend/src/database/migrations/core/005-create-core-tenant-tables.sql`
- `backend/src/database/migrations/core/006-create-core-agreement-tables.sql`
- `backend/src/database/migrations/core/022-make-scheduler-timestamps-timezone-aware.sql`

## Test evidence

- `backend/src/core/ai/action-orchestration/property-ai-action-orchestration.service.integration-spec.ts`
- `backend/src/core/ai/adaptation/property-ai-confidence-adaptation.service.integration-spec.ts`
- `backend/src/core/ai/agents/goals/property-ai-agent-goal.service.integration-spec.ts`
- `backend/src/core/ai/agents/property-agent-collaboration.service.integration-spec.ts`
- `backend/src/core/ai/agents/property-agent-decision-aggregator.service.integration-spec.ts`
- `backend/src/core/ai/agents/property-agent-delegation-planner.service.integration-spec.ts`
- `backend/src/core/ai/agents/property-operations-agent.service.integration-spec.ts`
- `backend/src/core/ai/agents/property-specialist-agent.registry.service.integration-spec.ts`
- `backend/src/core/ai/agents/runtime/property-specialist-agent-runtime.service.integration-spec.ts`
- `backend/src/core/ai/agents/strategy/property-ai-agent-strategy-selection.service.integration-spec.ts`
- `backend/src/core/ai/agents/supervision/property-ai-agent-replanning.service.integration-spec.ts`
- `backend/src/core/ai/agents/supervision/property-ai-agent-supervisor.service.integration-spec.ts`
- `backend/src/core/ai/collaboration/property-ai-agent-consensus.service.integration-spec.ts`
- `backend/src/core/ai/collaboration/property-ai-agent-negotiation.service.integration-spec.ts`
- `backend/src/core/ai/commands/property-ai-command.service.integration-spec.ts`
- `backend/src/core/ai/context/property-ai-context-assembly.service.integration-spec.ts`
- `backend/src/core/ai/controllers/property-ai-dashboard.controller.integration-spec.ts`
- `backend/src/core/ai/dashboard/property-ai-dashboard.service.integration-spec.ts`
- `backend/src/core/ai/feedback/property-ai-feedback.service.integration-spec.ts`
- `backend/src/core/ai/learning/property-ai-learning.service.integration-spec.ts`
- `backend/src/core/ai/memory/property-ai-outcome-memory.service.integration-spec.ts`
- `backend/src/core/ai/orchestration/property-operations-ai-orchestrator.service.integration-spec.ts`
- `backend/src/core/ai/property-actions/property-action-evidence.service.integration-spec.ts`
- `backend/src/core/ai/property-actions/property-action-execution.service.integration-spec.ts`
- `backend/src/core/ai/property-actions/property-action-governance.service.integration-spec.ts`
- `backend/src/core/ai/property-actions/property-action-lifecycle.service.integration-spec.ts`
- `backend/src/core/ai/property-actions/property-action-proposal.service.integration-spec.ts`
- `backend/src/core/ai/property-intelligence/property-health-advisory.service.integration-spec.ts`
- `backend/src/core/ai/property-intelligence/property-operations-intelligence.service.integration-spec.ts`
- `backend/src/core/ai/property-intelligence/property-risk-aggregation.service.integration-spec.ts`
- `backend/src/core/ai/property-intelligence/property-risk-contract.integration-spec.ts`
- `backend/src/core/ai/reasoning/property-health-reasoning.service.integration-spec.ts`
- `backend/src/core/ai/recommendations/property-action-recommendation.service.integration-spec.ts`
- `backend/src/core/ai/sdk/propertyos-ai-sdk.service.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-event-trigger.bootstrap.service.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-event-trigger.service.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-helpdesk-integration.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-inventory-integration.integration-spec.ts`
- `backend/src/core/ai/triggers/property-ai-maintenance-integration.integration-spec.ts`
- `backend/tests/e2e/propertyos-core-flow.integration-spec.ts`
- `backend/tests/integration/agreement-dashboard-contributor.integration-spec.ts`
- `backend/tests/integration/agreement.integration-spec.ts`
- `backend/tests/integration/lease-specialist.integration-spec.ts`
- `backend/tests/integration/property-orchestrator-routing.integration-spec.ts`
- `backend/tests/integration/property-specialist-agent-bootstrap.integration-spec.ts`
- `backend/tests/integration/property-specialist-agent-registry.integration-spec.ts`
- `backend/tests/integration/property-specialist-agent-router.integration-spec.ts`
- `backend/tests/integration/property-specialist-capability-routing.integration-spec.ts`
- `backend/tests/integration/property-specialist-routing-engine.integration-spec.ts`
- `backend/tests/integration/property.integration-spec.ts`
- `backend/tests/integration/tenant-dashboard-contributor.integration-spec.ts`
- `backend/tests/integration/tenant.integration-spec.ts`

## Verification

- Related test files discovered: 52
- Property-specific test files: 47
- Tenant-specific test files: 2
- Agreement-specific test files: 2
- Lease Specialist test files: 1
- Agreement-backed Lease model: VERIFIED
- Targeted business regression: PASSED
- Backend TypeScript build: PASSED
- Unfinished-marker scan: PASSED
- Existing untracked KDD and knowledge files were excluded from certification scope.

## Certification decisions

- Property: **CERTIFIED**
- Tenant: **CERTIFIED**
- Agreement: **CERTIFIED**
- Lease: **CERTIFIED AS AN AGREEMENT-BACKED BUSINESS CAPABILITY**

All four entries are accepted for the PropertyOS v3.0 release baseline.
