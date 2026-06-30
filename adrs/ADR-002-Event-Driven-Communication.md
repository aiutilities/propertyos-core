# ADR-002: Event Driven Communication

## Status

Accepted

## Context

Plugins, workflows, notifications, and AI assistants need to react to system activity.

## Decision

PropertyOS will use event-driven communication for important system actions.

## Consequences

- Features can react without tight coupling.
- Workflows and notifications become easier.
- Event naming and reliability must be carefully designed.
