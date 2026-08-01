# Phase 21B22G3I3 — Rebuild Artifact and Refresh Lockfiles

## Purpose

Rebuild the tracked portable `@propertyos/core-contracts` archive after
preserving generic DTO and repository method signatures, then refresh all
plugin lockfiles against the new archive integrity.

## Certified result

- 16 plugin manifests processed
- 40 approved symbols
- portable package generated
- isolated typecheck and build passed
- npm pack passed
- `PaginatedResponseDto<TData = unknown>` preserved
- `BasePostgresRepository` method signatures preserved
- all 16 plugin lockfiles refreshed
- Agreement typecheck and build passed

## Artifact

`generated/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz`

## Next step

Rerun Phase 21B22G3 all-plugin build certification.
