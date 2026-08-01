# Phase 21B24E — Secure Download Manager

## Status

COMPLETE

## Objective

Securely acquire a publisher-signed plugin archive from a marketplace
repository and atomically hand it to the runtime installation boundary.

## Implementation

`tools/knowledge_engine/marketplace_secure_download.py`

## Implemented

- HTTPS-only initial URL policy;
- HTTPS-only final redirect URL policy;
- strict maximum response size;
- empty-response rejection;
- exact SHA-256 verification;
- release identity consistency checks;
- publisher signature verification;
- registered publisher-key enforcement;
- content-addressed cache;
- corrupted-cache eviction;
- atomic cache writes;
- atomic destination handoff;
- rollback of transaction-owned destination output;
- durable JSONL download journal;
- injectable transport boundary for host HTTP integration.

## Cache layout

```text
cache/
  <first-two-sha-characters>/
    <full-sha256>.tgz
```

## Safety properties

- HTTP and HTTPS-to-HTTP redirects are rejected;
- oversized responses are rejected before acceptance;
- hash mismatch prevents cache and handoff;
- invalid publisher signatures prevent handoff;
- a valid cache avoids a second network fetch;
- failed post-handoff execution removes the destination;
- existing destinations are never overwritten.

## Next phase

Phase 21B24F — Repository Search and Discovery
