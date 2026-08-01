# Phase 21B23C3 — Native Contract Validator

## Status

COMPLETE

## Objective

Implement a deterministic PropertyOS-native validator for the marketplace
manifest schema without introducing the third-party Python `jsonschema`
dependency.

## Implementation

`tools/knowledge_engine/native_schema_validator.py`

## Supported schema rules

- `type`
- `required`
- `properties`
- `additionalProperties`
- `const`
- `enum`
- `pattern`
- `minLength`
- `maxLength`
- `minItems`
- `uniqueItems`
- `items`
- `format: uri`

These rules cover the current Marketplace Plugin Manifest Contract v1.

## Validation model

Validation returns immutable issues containing:

- issue code;
- JSON-style path;
- deterministic message.

Issue ordering is stable by:

1. path;
2. issue code;
3. message.

## Default-deny behavior

The validator rejects:

- missing required fields;
- unknown properties in closed objects;
- primitive type mismatches;
- constant mismatches;
- unsupported enum values;
- invalid regular-expression values;
- invalid URI values;
- duplicate array entries;
- undersized arrays and strings.

## Mutation boundary

The validator performs no repository, filesystem, installer, database,
registry or runtime mutation.

## Dependency boundary

The validator uses only the Python standard library.

## Contract proof

The canonical Marketplace Plugin Manifest example validates with zero issues.

## Next phase

Phase 21B23C4 — Contract-v1 Adapter Implementation
