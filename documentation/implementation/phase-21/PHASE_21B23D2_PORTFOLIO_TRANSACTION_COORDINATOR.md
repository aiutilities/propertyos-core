# Phase 21B23D2 — Portfolio Transaction Coordinator

## Status

COMPLETE

## Objective

Coordinate a complete admitted plugin portfolio as one filesystem transaction.

## Implementation

`tools/knowledge_engine/marketplace_portfolio_transaction.py`

## Transaction model

1. Validate the complete ordered installation plan.
2. Validate source-directory coverage.
3. Validate that all dependencies point backward in the plan.
4. Install every plugin into an isolated candidate portfolio root.
5. Abort and remove the candidate when any plugin transaction fails.
6. Move an existing live portfolio to backup.
7. Atomically promote the complete candidate portfolio.
8. Restore the previous live portfolio when commit fails.

## Safety properties

- no partial portfolio becomes live;
- an existing live portfolio is preserved on preflight failure;
- an existing live portfolio is restored after backup or promotion failure;
- plugin order is taken from the certified plan;
- dependency order is revalidated before execution;
- unknown source directories are rejected;
- duplicate plugin IDs are rejected;
- sequence gaps are rejected;
- all plugin operations use the D1 single-plugin transaction core;
- portfolio and plugin journals remain available for evidence.

## Deferred

- database migration coordination;
- runtime activation;
- persistent registry mutation;
- process-crash recovery;
- upgrade orchestration;
- uninstall orchestration.

## Next phase

Phase 21B23D3 — Activation and Registry Transaction Boundary
