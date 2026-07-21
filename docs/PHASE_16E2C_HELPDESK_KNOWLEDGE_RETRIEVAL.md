# Phase 16E2C — Helpdesk Knowledge Retrieval

## Status

Implementation complete and locally validated.

## Objective

Provide a deterministic knowledge-retrieval boundary for Helpdesk AI features by
reusing the existing PropertyOS search architecture.

This phase does not introduce a separate vector database, retrieval engine, or
provider-specific RAG implementation.

## Architecture

Helpdesk request
    ↓
HelpdeskAiKnowledgeService
    ↓
SearchService
    ↓
SearchProviderRegistry
    ↓
Registered PropertyOS Search Providers
    ↓
Normalized Evidence

## Public API

POST /helpdesk/retrieve-knowledge

Permission:
helpdesk.read

Read-only advisory endpoint.

## Request

Required:
- tenantId
- query

Optional:
- entityTypes
- limit

## Response

- query
- evidence
- evidenceCount

Each evidence item contains:

- id
- entityType
- entityId
- title
- description
- score
- providerName
- metadata

## Design

This implementation reuses the existing SearchService and
SearchProviderRegistry.

It intentionally avoids introducing:

- duplicate retrieval engines
- provider-specific RAG
- vector databases
- duplicated indexing
- duplicated authorization logic

Retrieval is isolated from AI generation so that it remains deterministic,
independently testable, and reusable.

## Validation

Successfully validated with:

- npm run typecheck
- npm run build

Focused Helpdesk AI tests:

- Knowledge Retrieval
- AI Reply Drafting
- AI Triage

Result:

3 test suites passed

16 tests passed

## Files Added

backend/src/core/helpdesk/dto/retrieve-helpdesk-knowledge.dto.ts

backend/src/core/helpdesk/services/helpdesk-ai-knowledge.service.ts

backend/src/core/helpdesk/services/helpdesk-ai-knowledge.service.integration-spec.ts

backend/src/core/helpdesk/types/helpdesk-ai-knowledge.types.ts

## Files Modified

backend/src/core/helpdesk/controllers/helpdesk.controller.ts

backend/src/core/helpdesk/helpdesk.module.ts

backend/src/core/helpdesk/index.ts

## Safety

- Read-only
- No ticket mutation
- No workflow mutation
- No database mutation
- No outbound communication
- No AI provider invocation
- Existing SearchService reused

## Next Phase

Ground the Helpdesk AI reply drafting service using normalized evidence while
preserving advisory-only behavior and human review.
