# Phase 21B24B — Repository Index Builder and Signer

## Status

COMPLETE

## Objective

Build deterministic repository indexes containing valid publisher-signed
releases, then sign and verify the complete repository index independently.

## Implementation

`tools/knowledge_engine/marketplace_repository_index.py`

## Implemented

- deterministic publisher, plugin and release ordering;
- archive SHA-256 calculation from actual bytes;
- valid publisher signature generation for every release;
- publisher signer ownership and key-registration checks;
- automatic latest-version selection;
- canonical JSON serialization;
- deterministic repository SHA-256;
- Ed25519 repository index signing;
- trusted repository-key verification;
- tamper detection;
- closed-contract validation before acceptance.

## Two-layer trust

Each release is signed by its publisher.

The complete repository index is signed independently by the repository.

This separates publisher authenticity from repository authenticity.

## Dependency correction

Phase 21B24C was completed before this resumed phase because the repository
contract requires non-empty, registered publisher signatures for every
release.

## Next phase

Phase 21B24D — Plugin Publication Pipeline
