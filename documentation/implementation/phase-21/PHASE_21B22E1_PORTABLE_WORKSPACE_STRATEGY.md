# Phase 21B22E1 — Portable Plugin Workspace Strategy

## Scope

This checkpoint makes plugin workspace metadata strategy-aware without
regenerating existing staged workspaces.

## Strategies

### `repository-reexport`

Preserves the existing behavior:

- extends the backend TypeScript configuration;
- references the repository-generated core-contract directory;
- supports the current staged migration workflow.

### `portable-facade`

Adds a portable workspace contract:

- emits a standalone TypeScript 6 `Node16` configuration;
- requires an existing packed `.tgz` core-contract package;
- records host API compatibility `0.1.0`;
- records portable strategy metadata in `package.json` and `plugin.json`;
- does not extend backend repository paths.

## Deferred Work

Existing generated plugin workspaces are not regenerated in this checkpoint.
Regeneration and all-workspace certification are handled by Phase 21B22F.
