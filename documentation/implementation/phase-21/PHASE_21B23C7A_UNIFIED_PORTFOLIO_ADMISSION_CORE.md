# Phase 21B23C7A — Unified Portfolio Admission Core

## Status

COMPLETE

## Objective

Orchestrate legacy adaptation, Contract-v1 validation, per-plugin admission,
dependency-graph validation and deterministic installation planning through
one portfolio-level decision.

## Implementation

`tools/knowledge_engine/marketplace_portfolio_admission.py`

## Pipeline

```text
Legacy portfolio
      |
      v
Contract-v1 portfolio adaptation
      |
      v
Per-plugin compatibility admission
      |
      v
Portfolio dependency graph
      |
      v
Deterministic installation order
      |
      v
Transaction-ready installation steps
```

## Decision model

The planner returns one immutable portfolio decision:

- `ACCEPT`
- `REJECT`

A rejected portfolio receives no installation order or installation steps.

## Installation steps

Each accepted step contains:

- sequence number;
- plugin ID;
- version;
- required plugin dependencies.

## Default-deny behavior

The complete portfolio is rejected when any of these fail:

- Contract-v1 adaptation;
- schema validation;
- runtime compatibility;
- contract compatibility;
- publisher trust;
- archive integrity;
- version-transition policy;
- dependency availability;
- dependency version;
- cycle validation.

## Mutation boundary

The planner is read-only. It does not install, extract, migrate, register,
activate or mutate a plugin.

## Next phase

Phase 21B23C7B — Real 16-Plugin Unified Portfolio Certification
