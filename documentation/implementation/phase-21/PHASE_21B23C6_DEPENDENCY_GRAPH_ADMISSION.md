# Phase 21B23C6 — Dependency Graph Admission

## Status

COMPLETE

## Objective

Implement deterministic portfolio-wide dependency validation and installation
ordering before marketplace mutation begins.

## Implementation

`tools/knowledge_engine/marketplace_dependency_graph.py`

## Admission rules

The graph validator rejects:

- missing required dependencies;
- incompatible dependency versions;
- self-dependencies;
- dependency cycles;
- portfolio-key and manifest-ID mismatch;
- malformed dependency arrays;
- invalid dependency versions.

Missing optional dependencies are allowed and do not create graph edges.

## Edge direction

Edges are represented as:

```text
dependency -> dependent
```

This makes the resulting topological order directly usable as an installation
order.

## Determinism

When multiple plugins are ready at the same graph level, they are ordered
lexicographically by plugin ID.

Issues and edges are also deterministically sorted.

## Cycle handling

A cyclic portfolio receives no partial installation order.

Every plugin remaining in the unresolved cyclic component receives a
`DEPENDENCY_CYCLE` issue.

## Mutation boundary

The graph validator performs no repository, filesystem, installer, database,
registry, runtime or package mutation.

## Portfolio proof

The complete 16-plugin Contract-v1 portfolio validates successfully.

The generated order places `inventory` before `procurement`, satisfying the
only current inter-plugin dependency.

## Next phase

Phase 21B23C7 — Unified Portfolio Admission Planner
