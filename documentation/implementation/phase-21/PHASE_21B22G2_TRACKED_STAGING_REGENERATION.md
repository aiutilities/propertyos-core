# Phase 21B22G2 — Tracked Plugin Staging Regeneration

## Status

All 16 tracked plugin staging workspaces were regenerated using the
`portable-facade` workspace strategy.

## Applied Changes

Each workspace now has:

- standalone TypeScript 6 `Node16` configuration;
- packed `@propertyos/core-contracts` dependency;
- host API compatibility `0.1.0`;
- portable strategy metadata;
- regenerated package lock;
- preserved plugin-to-plugin dependency graph.

## Plugin Dependency Graph

The only plugin-to-plugin dependency remains:

```text
procurement -> inventory
```

All other manifest dependencies are ForgeOS host capabilities.

## Persistent Contract Artifact

The portable core-contract archive is stored at:

```text
generated/plugin-artifacts/propertyos-core-contracts-0.1.0.tgz
```

## Preserved Content

The regeneration did not replace plugin source trees, tests, build outputs, or
installed dependency directories. Only generated workspace metadata, package
locks, and the portable contract artifact were updated.

## Next

Phase 21B22G3 performs isolated install, typecheck, build, and packaging across
the regenerated tracked plugin ecosystem.
