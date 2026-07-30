# PropertyOS Phase 18B — AI Scope-to-Implementation Gap Matrix

## Checkpoint status

**Status:** AUDIT GENERATED — REVIEW REQUIRED

**Implementation performed:** No

**Database mutation performed:** No

**Commit authorized:** No

## Repository baseline

- Branch: `feature/phase-16f-marketplace-upgrade-runtime`
- Baseline HEAD: `c6ebff69aab38840339d00f4701ab210cd3e5805`
- Controlling handover: `docs/PHASE_18_HANDOVER.md`
- Phase 18A certification: `docs/PHASE_18A_AI_ARCHITECTURE_VALIDATION.md`

## Classification rules

- `COMPLETE`: implementation, tests and runtime/exposure evidence found.
- `PARTIAL`: some evidence exists, but the complete contract is not demonstrated.
- `MISSING`: no relevant implementation, validation or runtime evidence found.
- `PRESENT_BUT_UNEXPOSED`: implementation and tests exist, but runtime/public exposure is not demonstrated.
- `PRESENT_BUT_UNVALIDATED`: implementation exists without targeted validation evidence.

## Matrix

| Phase 18 scope | Classification | Implementation files | Test files | Runtime/exposure evidence |
|---|---|---:|---:|---:|
| OpenAI provider | `COMPLETE` | 1 | 1 | 2 |
| Anthropic / Claude provider | `COMPLETE` | 1 | 1 | 2 |
| DeepSeek provider | `COMPLETE` | 1 | 1 | 2 |
| Qwen provider | `COMPLETE` | 1 | 1 | 2 |
| Multi-model routing | `COMPLETE` | 2 | 2 | 1 |
| Agent registry and runtime | `COMPLETE` | 2 | 2 | 1 |
| Agent permissions | `COMPLETE` | 2 | 1 | 1 |
| Task execution | `COMPLETE` | 2 | 1 | 1 |
| Tool execution | `COMPLETE` | 3 | 1 | 1 |
| Context routing | `COMPLETE` | 2 | 1 | 1 |
| Prompt registry | `MISSING` | 1 | 1 | 0 |
| Prompt versioning | `MISSING` | 0 | 5 | 0 |
| Human approvals | `COMPLETE` | 8 | 2 | 1 |
| AI audit trail | `COMPLETE` | 2 | 1 | 1 |
| Memory | `COMPLETE` | 4 | 0 | 1 |
| Runtime state | `COMPLETE` | 3 | 0 | 1 |
| Scheduled execution | `MISSING` | 1 | 0 | 0 |
| Long-running execution | `COMPLETE` | 3 | 0 | 1 |
| AI SDK exposure | `COMPLETE` | 2 | 2 | 1 |

## Summary

- COMPLETE: 16
- PARTIAL: 0
- MISSING: 3
- PRESENT_BUT_UNEXPOSED: 0
- PRESENT_BUT_UNVALIDATED: 0

## Detailed evidence

### OpenAI provider

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/providers/openai/openai-ai.provider.ts`

Validation:

- `backend/src/core/ai/providers/openai/openai-ai.provider.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/registration/ai-provider-registration-bootstrap.service.ts`
- `backend/src/core/ai/ai.module.ts`

### Anthropic / Claude provider

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/providers/claude/claude-ai.provider.ts`

Validation:

- `backend/src/core/ai/providers/claude/claude-ai.provider.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/registration/ai-provider-registration-bootstrap.service.ts`
- `backend/src/core/ai/ai.module.ts`

### DeepSeek provider

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/providers/deepseek/deepseek-ai.provider.ts`

Validation:

- `backend/src/core/ai/providers/deepseek/deepseek-ai.provider.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/registration/ai-provider-registration-bootstrap.service.ts`
- `backend/src/core/ai/ai.module.ts`

### Qwen provider

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/providers/qwen/qwen-ai.provider.ts`

Validation:

- `backend/src/core/ai/providers/qwen/qwen-ai.provider.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/registration/ai-provider-registration-bootstrap.service.ts`
- `backend/src/core/ai/ai.module.ts`

### Multi-model routing

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/routing/ai-adaptive-routing.service.ts`
- `backend/src/core/ai/routing/ai-provider-selection.service.ts`

Validation:

- `backend/src/core/ai/routing/ai-adaptive-routing.service.integration-spec.ts`
- `backend/src/core/ai/routing/ai-provider-selection.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/runtime/ai-provider-runtime.service.ts`

### Agent registry and runtime

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/agents/ai-agent-capability-registry.service.ts`
- `backend/src/core/ai/agents/runtime/property-specialist-agent-runtime.service.ts`

Validation:

- `backend/src/core/ai/agents/ai-agent-capability-registry.service.integration-spec.ts`
- `backend/src/core/ai/agents/runtime/property-specialist-agent-runtime.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/ai.module.ts`

### Agent permissions

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/governance/ai-agent-governance-binding.service.ts`
- `backend/src/core/ai/types/ai-agent-governance.types.ts`

Validation:

- `backend/src/core/ai/governance/ai-agent-governance-binding.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/governance/ai-decision-governance.service.ts`

### Task execution

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/agents/ai-agent-execution.service.ts`
- `backend/src/core/ai/execution/ai-execution-context.service.ts`

Validation:

- `backend/src/core/ai/agents/ai-agent-execution.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/sdk/propertyos-ai-sdk.service.ts`

### Tool execution

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/tools/contracts/ai-tool.contract.ts`
- `backend/src/core/ai/tools/execution/ai-tool-execution.service.ts`
- `backend/src/core/ai/tools/registry/ai-tool.registry.ts`

Validation:

- `backend/src/core/ai/tools/execution/ai-tool-execution.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/tools/orchestration/ai-tool-call-coordinator.service.ts`

### Context routing

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/context/ai-context-assembly.service.ts`
- `backend/src/core/ai/context/property-ai-context-assembly.service.ts`

Validation:

- `backend/src/core/ai/context/ai-context-assembly.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/sdk/propertyos-ai-sdk.service.ts`

### Prompt registry

Classification: `MISSING`

Implementation:

- `backend/src/core/ai/dispatch/ai-dispatch-execution-coordinator.service.ts`

Validation:

- `backend/src/core/ai/dispatch/ai-dispatch-execution-coordinator.service.integration-spec.ts`

### Prompt versioning

Classification: `MISSING`

Validation:

- `backend/src/core/ai/dispatch/ai-dispatch-execution-coordinator.service.integration-spec.ts`
- `backend/src/core/ai/providers/deepseek/deepseek-ai.provider.integration-spec.ts`
- `backend/src/core/ai/providers/openai/openai-ai.provider.integration-spec.ts`
- `backend/src/core/ai/providers/qwen/qwen-ai.provider.integration-spec.ts`
- `backend/src/core/helpdesk/services/helpdesk-ai-reply.service.integration-spec.ts`

### Human approvals

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/controllers/ai.controller.ts`
- `backend/src/core/ai/dto/orchestrate-ai-request.dto.ts`
- `backend/src/core/ai/governance/ai-autonomous-decision-guard.service.ts`
- `backend/src/core/ai/governance/ai-controlled-autonomy.service.ts`
- `backend/src/core/ai/property-actions/property-action-execution.service.ts`
- `backend/src/core/ai/sdk/ai-sdk.contracts.ts`
- `backend/src/core/ai/sdk/propertyos-ai-sdk.service.ts`
- `backend/src/core/ai/types/ai-orchestration.types.ts`

Validation:

- `backend/src/core/ai/action-orchestration/property-ai-action-orchestration.service.integration-spec.ts`
- `backend/src/core/ai/controllers/ai.controller.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/governance/ai-decision-governance.service.ts`

### AI audit trail

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/audit/ai-decision-audit.repository.ts`
- `backend/src/core/ai/audit/ai-decision-audit.service.ts`

Validation:

- `backend/src/core/ai/audit/ai-decision-audit.service.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/ai.module.ts`

### Memory

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/agents/ai-agent-memory.service.ts`
- `backend/src/core/ai/memory/postgres-property-ai-outcome-memory.repository.ts`
- `backend/src/core/ai/memory/property-ai-outcome-memory.service.ts`
- `backend/src/database/migrations/core/050-create-ai-outcome-memory.sql`

Runtime or exposure evidence:

- `backend/src/core/ai/ai.module.ts`

### Runtime state

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/conversations/ai-conversation-session.service.ts`
- `backend/src/core/ai/execution/ai-execution-context.service.ts`
- `backend/src/core/ai/runtime/ai-provider-runtime.service.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/ai.module.ts`

### Scheduled execution

Classification: `MISSING`

Implementation:

- `backend/src/database/migrations/core/016-create-core-scheduler-tables.sql`

### Long-running execution

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/tools/orchestration/ai-tool-continuation-boundary.service.ts`
- `backend/src/core/ai/tools/orchestration/ai-tool-continuation-coordinator.service.ts`
- `backend/src/core/ai/tools/orchestration/ai-tool-continuation-execution.service.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/tools/orchestration/ai-tool-orchestration-loop.service.ts`

### AI SDK exposure

Classification: `COMPLETE`

Implementation:

- `backend/src/core/ai/sdk/ai-sdk.contracts.ts`
- `backend/src/core/ai/sdk/propertyos-ai-sdk.service.ts`

Validation:

- `backend/src/core/ai/sdk/ai-sdk-boundary.integration-spec.ts`
- `backend/src/core/ai/sdk/ai-sdk-public-api.integration-spec.ts`

Runtime or exposure evidence:

- `backend/src/core/ai/ai.module.ts`

## Targeted evidence correction

The initial generated matrix classified memory, runtime state and long-running
execution as present but unvalidated because the generator did not associate
their existing tests with those rows.

A targeted validation executed 10 test suites containing 114 tests:

- AI agent memory
- AI outcome memory
- AI provider runtime
- AI execution context
- AI conversation sessions
- Tool continuation boundary
- Tool continuation coordination
- Tool continuation dispatch
- Tool continuation execution
- Tool orchestration loop

All 10 suites and all 114 tests passed.

The classifications for memory, runtime state and long-running execution were
therefore corrected to `COMPLETE`.

Prompt registry, prompt versioning and scheduled execution remain classified
strictly according to the implementation and targeted-test evidence discovered
during the Phase 18B review.

## Review gate

This document is generated evidence, not an implementation authorization.

Before Phase 18 implementation begins:

1. Review every non-`COMPLETE` row.
2. Confirm whether evidence was missed because of naming or architectural placement.
3. Define the smallest genuine gap.
4. Write its contract and acceptance criteria.
5. Authorize only that checkpoint.

No Phase 19 work is authorized.
