# Phase 21B24D — Plugin Publication Pipeline

## Status

COMPLETE

## Objective

Accept, validate, verify, stage and atomically publish one publisher-signed
plugin release into a PropertyOS marketplace repository layout.

## Implementation

`tools/knowledge_engine/marketplace_publication_pipeline.py`

## Implemented

- plugin manifest identity validation;
- publisher identity validation;
- archive existence and SHA-256 calculation;
- publisher signature verification;
- registered key ownership enforcement;
- HTTPS-only manifest and archive URLs;
- duplicate release rejection;
- deterministic release record generation;
- isolated publication staging;
- staged archive integrity verification;
- atomic release promotion;
- rollback after staging or promotion failure;
- durable JSONL publication journal.

## Repository layout

```text
repository/
  plugins/
    <plugin-id>/
      <version>/
        manifest.json
        plugin.tgz
        release.json
```

## Safety properties

- unsigned or tampered releases are rejected;
- duplicate plugin versions cannot overwrite an existing release;
- publication is invisible until atomic promotion;
- failed promotion removes partial output;
- publisher identity must match the plugin manifest;
- release metadata records the verified publisher signature.

## Next phase

Phase 21B24E — Secure Download Manager
