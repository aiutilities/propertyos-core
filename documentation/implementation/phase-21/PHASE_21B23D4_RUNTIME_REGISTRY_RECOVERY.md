# Phase 21B23D4 — Runtime Registry Recovery

## Status

COMPLETE

## Objective

Reconcile installed plugin directories and runtime registry state after a host
restart, interrupted activation, or partial administrative repair.

## Implementation

`tools/knowledge_engine/marketplace_runtime_recovery.py`

## Implemented

- installed-plugin directory scan;
- installed manifest and runtime-entrypoint validation;
- missing-registry reconstruction as inactive;
- interrupted activation/deactivation normalization;
- stale-registry detection;
- explicit stale-entry removal policy;
- version mismatch detection;
- deterministic recovery decisions;
- atomic registry rewrite;
- durable JSONL recovery journal.

## Default-deny rules

Recovery fails when:

- an installed manifest is missing;
- a runtime entrypoint is missing;
- installed directory and manifest IDs disagree;
- installed and registry versions disagree;
- a stale registry entry exists and removal was not explicitly allowed;
- a missing registry entry exists and reconstruction was disabled.

## Safety properties

- no plugin code is activated during recovery;
- interrupted runtime states become inactive;
- active state is preserved only when disk and registry agree;
- registry repair is atomic;
- stale removal requires explicit authorization;
- recovery decisions are deterministic.

## Next phase

Phase 21B23D5 — Upgrade Coordinator
