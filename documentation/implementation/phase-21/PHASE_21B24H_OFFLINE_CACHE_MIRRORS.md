# Phase 21B24H — Offline Cache and Mirrors

## Status

COMPLETE

## Objective

Provide deterministic mirror failover and a verified content-addressed cache
for marketplace archives, including strict offline-only operation.

## Implementation

`tools/knowledge_engine/marketplace_offline_cache.py`

## Implemented

- deterministic mirror ordering by priority and mirror ID;
- disabled-mirror exclusion;
- HTTPS-only mirror base URLs;
- HTTPS-only redirected URLs;
- safe repository-relative artifact paths;
- strict maximum response size;
- exact archive SHA-256 verification;
- primary-to-secondary failover;
- failed-attempt recording;
- valid-cache preference;
- corrupt-cache eviction;
- offline-only cache mode;
- atomic content-addressed cache writes;
- durable JSONL mirror-resolution journal.

## Cache behavior

A valid cache entry is used before any mirror request.

When `offline_only` is enabled, a cache miss fails without network access.

## Mirror behavior

Mirrors are tried in this order:

1. lower numeric priority;
2. mirror ID for deterministic tie-breaking.

The first mirror returning a valid HTTPS response with the expected SHA-256
wins.

## Next phase

Phase 21B24I — Runtime Integration
