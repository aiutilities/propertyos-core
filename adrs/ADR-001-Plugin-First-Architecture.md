# ADR-001: Plugin First Architecture

## Status

Accepted

## Context

PropertyOS is intended to be an open-source platform, not a single-purpose property application.

Different property types need different business features.

## Decision

PropertyOS Core will remain small and property-type neutral.

Business functionality will be delivered through plugins.

## Consequences

- Core stays clean and reusable.
- New features can be added without changing core.
- Plugin governance and security become important.
