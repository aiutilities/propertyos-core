# Phase 16E2A — Helpdesk AI-assisted triage

## Objective

Introduce the first business-module consumer of the stable PropertyOS AI SDK.

## Endpoint

POST /helpdesk/triage

## Behaviour

The endpoint returns advisory suggestions for:

- priority
- category
- summary
- confidence
- reasons

It does not create, update, assign, transition, or persist a ticket.

## AI boundary

HelpdeskAiTriageService
→ PropertyOsAiSdkService
→ AI orchestration

The Helpdesk module does not directly depend on AiOrchestratorService.

## Safety

- advisory only
- simulated execution by default
- internal data classification
- no database migration
- no ticket persistence
- no workflow transition
- validated structured output
- controlled SDK failure mapping

## Validation

- TypeScript typecheck passed
- backend build passed
- focused integration suite passed
- 5 focused tests passed
