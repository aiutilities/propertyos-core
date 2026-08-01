# Phase 21B23C2 — Adapter Extension Design

## Status

COMPLETE

## Objective

Define a separate Contract-v1 extension layer above the existing deterministic
marketplace manifest adapter. The existing installer-facing adapter remains
unchanged.

## Pipeline

```text
Legacy plugin.json
  -> Existing MarketplaceManifestAdapter
  -> Installer-compatible manifest
  -> Contract-v1 extension adapter
  -> Trusted context injection
  -> PropertyOS-native closed-schema validation
  -> Marketplace Plugin Manifest v1
```

## Design decisions

- Preserve the existing adapter and its current consumers.
- Do not add the unavailable Python `jsonschema` dependency.
- Validate with a PropertyOS-native closed-schema validator.
- Reject unknown source and target fields.
- Require trusted publisher, host API, contract, migration and integrity context.
- Calculate archive SHA-256 only after the distributable archive exists.
- Permit no installer or runtime mutation before final validation succeeds.
- Do not rewrite the 16 tracked legacy manifests in this phase.

## Compatibility

All 16 tracked legacy manifests satisfy the declared source contract.

## Machine-readable contract

`tools/knowledge_engine/contracts/marketplace_manifest_adapter_extension.json`

## Next phase

Phase 21B23C3 — Native Contract Validator Foundation
