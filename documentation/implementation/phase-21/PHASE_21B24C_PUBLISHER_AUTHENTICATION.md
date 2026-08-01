# Phase 21B24C — Publisher Authentication and Key Registry

## Status

COMPLETE

## Objective

Provide the publisher trust layer required before repository indexes can
contain valid signed plugin releases.

## Implementation

`tools/knowledge_engine/marketplace_publisher_authentication.py`

## Implemented

- atomic publisher public-key registry;
- publisher ownership binding;
- active and revoked key states;
- duplicate key-ID protection;
- Ed25519 release signing;
- deterministic canonical release payload;
- release signature verification;
- publisher ownership validation;
- revoked-key rejection;
- unknown-key rejection;
- tamper detection;
- deterministic registry serialization.

## Trust model

A release signature is valid only when:

1. the signing key is registered;
2. the key belongs to the declared publisher;
3. the key is active;
4. the signature uses Ed25519;
5. the canonical release payload has not changed.

## Phase dependency correction

This phase is intentionally completed before resuming Phase 21B24B.

The repository index builder requires valid publisher signatures for every
release because the Phase 21B24A contract is closed and default-deny.

## Next phase

Resume Phase 21B24B — Repository Index Builder and Signer
