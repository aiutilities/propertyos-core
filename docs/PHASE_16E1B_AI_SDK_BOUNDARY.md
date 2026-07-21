# Phase 16E1B — PropertyOS AI SDK Boundary

## Status

Phase 16E1B establishes the architectural rules for consuming AI services from PropertyOS business modules.

The stable public integration boundary is:

    PropertyOsAiSdkService

Business modules must not depend directly on:

    AiOrchestratorService

## Purpose

AiOrchestratorService is an internal AI-runtime component responsible for:

- provider routing
- provider failover
- execution policy
- request preparation
- context assembly
- token controls
- cost controls
- provider-specific behavior

Business modules consume PropertyOsAiSdkService, which provides a stable and versioned contract.

## Approved dependency direction

    PropertyOS business module
        |
        v
    PropertyOsAiSdkService
        |
        v
    AiOrchestratorService
        |
        v
    AI providers and runtime services

## Approved imports

Business modules may import from the public AI package root.

Examples:

    ../../core/ai
    src/core/ai
    @propertyos/core/ai

The import must stop at the public AI package root.

## Prohibited imports

Business modules must not import implementation files beneath the AI package.

Examples:

    ../ai/services/ai-orchestrator.service
    ../ai/routing/ai-provider-selection.service
    ../ai/providers/openai/openai-ai.provider

Business modules must also not reference AiOrchestratorService directly.

## Required request attribution

Every module SDK request must include:

- tenantId
- moduleId
- capability
- messages

moduleId identifies the calling PropertyOS module.

Examples:

- helpdesk
- documents
- maintenance
- procurement
- inventory
- reports

## Result handling

Callers should normally use:

    PropertyOsAiSdkService.execute()

The caller must handle the typed success or failure result.

Use:

    PropertyOsAiSdkService.executeOrThrow()

only where exception-based handling is appropriate.

## Automated enforcement

The architecture test is:

    backend/src/core/ai/sdk/ai-sdk-boundary.integration-spec.ts

It fails when production code outside core/ai:

1. references AiOrchestratorService directly; or
2. imports from an AI internal subdirectory.

## Current consumer status

At Phase 16E1B closure, no PropertyOS business module consumes AI.

This is intentional.

The first SDK consumer will be introduced through a genuine user-facing capability rather than an artificial demonstration module.

## Next milestone

Phase 16E2 will implement the first production AI-enabled PropertyOS feature through PropertyOsAiSdkService.

The recommended initial capability is AI-assisted Helpdesk ticket triage.
