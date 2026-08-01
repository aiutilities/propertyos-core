# Phase 21B24A — Marketplace Repository Contract

## Status

COMPLETE

## Objective

Define and enforce the machine-readable index contract used by PropertyOS
marketplace repositories.

## Implementation

`tools/knowledge_engine/marketplace_repository_contract.py`

## Contract scope

The repository index contains:

- schema identity;
- repository metadata;
- registered publishers;
- publisher signing-key identities;
- plugin catalogue entries;
- versioned releases;
- HTTPS manifest and archive locations;
- archive SHA-256 digests;
- Ed25519 signature metadata;
- host API compatibility range;
- release withdrawal status.

## Closed-schema policy

Unknown fields are rejected at the root, repository, publisher, plugin,
release and signature boundaries.

## Publisher trust

Every plugin must reference a registered publisher.

Every release signing key must be registered against that publisher.

## Release rules

- release versions must be valid;
- duplicate versions are rejected;
- `latestVersion` must match the highest release;
- manifest and archive URLs must use HTTPS;
- archive digests must be lowercase SHA-256;
- signatures must use Ed25519;
- minimum host API cannot exceed maximum host API;
- yanked status must be explicit.

## Determinism

Issues are returned in deterministic path, code and message order.

## Next phase

Phase 21B24B — Repository Index Builder and Signer
