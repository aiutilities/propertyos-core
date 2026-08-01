# Phase 21B23C5 — Compatibility and Admission Validator

## Status

COMPLETE

## Objective

Implement the deterministic, default-deny admission gate used before any
marketplace installation mutation begins.

## Implementation

`tools/knowledge_engine/marketplace_admission_validator.py`

## Admission order

1. Native schema validation.
2. Host API compatibility.
3. Node.js compatibility.
4. Portable contract availability and version.
5. Plugin dependency availability and version.
6. Publisher and signing-key trust.
7. Archive SHA-256 integrity.
8. Runtime and lifecycle entrypoint safety.
9. Permission syntax.
10. Installed-version transition policy.

## Decision model

Every evaluation returns:

- `ACCEPT` or `REJECT`;
- immutable, deterministically ordered issues;
- machine-readable issue codes;
- JSON-style issue paths.

Schema failure stops deeper admission checks because the remaining checks
require a structurally valid manifest.

## Default-deny rules

Admission is rejected for:

- malformed or unknown manifest fields;
- incompatible host API;
- incompatible Node.js runtime;
- unavailable or incompatible core contracts;
- unavailable or incompatible required plugins;
- self-dependencies;
- untrusted publishers;
- untrusted signing keys;
- publisher/signature key mismatch;
- missing candidate archive;
- archive SHA-256 mismatch;
- unsafe package entrypoints;
- malformed permissions;
- prohibited downgrades.

## Explicit downgrade policy

Downgrade is denied by default.

A caller must explicitly set `allow_downgrade=True`. This flag only passes the
version-transition gate; migration and rollback safety remain separate
installer responsibilities.

## Mutation boundary

The validator performs no repository, filesystem, installer, database,
registry, runtime or package mutation.

Archive access is read-only and limited to streaming SHA-256 calculation.

## Portfolio proof

All 16 tracked plugins:

1. adapt from the legacy manifest;
2. validate against Marketplace Contract v1;
3. pass compatibility admission against the certified host context.

## Next phase

Phase 21B23C6 — Dependency Graph and Portfolio Admission
