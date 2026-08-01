# Phase 21B23C4 — Contract-v1 Adapter

## Status

COMPLETE

## Objective

Implement the deterministic bridge from existing PropertyOS legacy plugin
manifests and trusted publication context to validated Marketplace Plugin
Manifest Contract v1 documents.

## Legacy permission compatibility

Some tracked manifests contain permission literals wrapped in quote
characters, such as `'agreement.create'`.

The adapter removes one matching outer pair of single or double quotes before
normalizing the permission to `agreement:create`.

Unbalanced quote characters remain invalid and are rejected.

## Safety properties

- original legacy manifests remain unchanged;
- output is deterministic and duplicate-free;
- unsafe runtime and lifecycle entrypoints are rejected;
- incomplete portfolio context is rejected;
- output is validated against the closed Contract-v1 schema;
- no installer, database, registry or runtime mutation occurs.

## Portfolio proof

All 16 tracked legacy plugin manifests produce validated Contract-v1
manifests when supplied with trusted context.

## SHA-256 test vector

The SHA-256 digest of the bytes `propertyos` is:

`7d8a75ae4880c1b7fcae31d384564521571b466195d02ec621d85bc8ff0a5e81`

## Next phase

Phase 21B23C5 — Compatibility and Admission Validator
