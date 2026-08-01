# Phase 21B23D3 — Activation Boundary

## Status

COMPLETE

## Objective

Move an installed plugin portfolio into the active PropertyOS runtime through
a deterministic, rollback-capable activation transaction.

## Implementation

`tools/knowledge_engine/marketplace_runtime_activation.py`

## Implemented

- runtime plugin state model;
- atomic JSON runtime registry;
- certified activation ordering;
- dependency-order validation;
- installed-manifest validation;
- runtime-entrypoint validation;
- activation hooks;
- health validation hooks;
- reverse-order deactivation on failure;
- restoration of the previous runtime registry;
- durable JSONL activation journal;
- deterministic registry serialization;
- failure injection around activation and registry commit.

## Activation boundary

The implementation does not dynamically import arbitrary plugin code itself.

Instead, it defines a controlled hook boundary through which the PropertyOS
host runtime performs activation and deactivation.

This keeps lifecycle invocation separate from transaction control and enables
host-specific NestJS integration in a later phase.

## Safety properties

- no registry mutation occurs before every activation succeeds;
- dependency order is revalidated before activation;
- health failure triggers rollback;
- activation failure triggers reverse-order deactivation;
- registry commit failure restores the previous registry;
- registry writes are atomic;
- installed source files are not modified.

## Next phase

Phase 21B23D4 — Runtime Registry Integration and Recovery
