# ADR-012: AI Provider Agnostic Agent Layer

## Status

Accepted

## Context

PropertyOS should support AI-assisted administration without depending on a single AI vendor.

## Decision

PropertyOS will use an AI provider agnostic layer.

AI features should be able to work with different providers over time.

## Consequences

- Avoids vendor lock-in.
- Allows future model flexibility.
- Requires clear boundaries between core data, prompts, tools, and AI providers.
