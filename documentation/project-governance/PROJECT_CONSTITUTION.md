# PropertyOS Project Constitution

## Purpose

PropertyOS is an open-source, AI-native operating system for properties and communities.

It is designed to be:

- self-hosted
- plugin-driven
- event-driven
- WhatsApp-first
- extensible like WordPress
- suitable for residential, rental and community properties

The first controlled production pilot is Advaith's Nest.

## Architectural Status

The following decisions are locked:

- core platform architecture
- PostgreSQL database architecture
- NestJS backend architecture
- Next.js frontend architecture
- event bus architecture
- workflow architecture
- scheduler and worker architecture
- plugin engine and SDK
- marketplace architecture
- theme architecture
- authentication and RBAC
- storage architecture
- search architecture
- forms and documents architecture
- configuration architecture
- metrics architecture
- health and readiness contracts
- migration governance
- idempotency architecture
- production safety gates

These decisions must not be redesigned during ordinary implementation sessions.

## Change Governance

An architectural decision may be reconsidered only when:

- a security vulnerability requires it
- a confirmed production defect requires it
- the PRD or architecture specification contradicts the implementation
- the founder explicitly authorises an architecture review

Normal implementation work must not reopen completed architecture decisions.

## Module Maturity Rule

A mature module must not be redesigned or expanded without an approved backlog item.

A mature module may be changed only for:

- confirmed defects
- security corrections
- performance corrections supported by evidence
- regression failures
- explicitly approved product requirements
- necessary production integration

## Platform Principles

- shared infrastructure belongs in core
- business-domain extensions should prefer plugins
- public contracts must remain backward compatible
- runtime mutations must be controlled
- migrations must be deterministic
- operations must be auditable
- retries must be safe
- important mutation routes must be idempotent
- metrics must use low-cardinality labels
- production operations must fail closed
- every milestone ends with a clean repository

## Observability Principles

The existing MetricsService is the canonical metrics engine.

The existing Prometheus endpoint is the canonical export endpoint.

Do not create:

- a second metrics engine
- another Prometheus endpoint
- anonymous metrics access
- high-cardinality metrics labels

Allowed metric labels include:

- operation
- result
- errorType
- conflictCode
- jobType

Forbidden metric labels include:

- IDs
- UUIDs
- payloads
- tenant identifiers
- property identifiers
- actor identifiers
- correlation identifiers
- filenames
- user-provided names

## Repository Discipline

Every implementation milestone must include:

- changed-file scope validation
- whitespace validation
- TypeScript typecheck
- backend build
- targeted tests
- relevant regression tests
- deterministic commit
- clean repository verification

Remote changes must not be made unless explicitly authorised.

Database mutations must not be made unless explicitly required and authorised.

## Canonical Roadmap

The remaining roadmap must remain in this order:

1. Phase 17C3 - Grafana Dashboard Contract
2. Phase 17D - Performance and Scale Validation
3. Phase 18 - Production Operations
4. Phase 19 - Founder Acceptance Testing
5. Phase 20 - Advaith's Nest Pilot Deployment
6. Phase 21 - Public Open Source Release
7. Phase 22 - Marketplace Launch
8. Phase 23 - Multi-AI Orchestration

Do not rename, renumber, merge, split or reorder these phases without explicit founder approval.
