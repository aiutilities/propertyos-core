# Phase 21B22E3 — Portable Plugin Workspace Certification

## Status

- Portable plugin workspace strategy: certified
- Packed core-contract dependency: certified
- TypeScript 6 Node16 workspace: certified
- Isolated install, typecheck and build: certified
- Legacy workspace strategy: preserved
- Generated staging regeneration: deferred
- Database impact: none
- Runtime deployment impact: none

## Permanent Certification Coverage

The permanent test suite verifies:

1. portable workspace package metadata;
2. host API compatibility `0.1.0`;
3. packed `.tgz` core-contract dependency;
4. standalone TypeScript configuration;
5. absence of repository paths in build-critical files;
6. extraction-report paths classified as provenance-only metadata;
7. isolated npm installation;
8. isolated typecheck and build;
9. plugin package archive creation;
10. cleanup of temporary certification workspaces.

## Boundary

This checkpoint certifies the workspace generator and one representative
portable plugin workspace.

It does not regenerate the existing `generated/plugin-staging` directory.
All-plugin regeneration and certification are handled in Phase 21B22F.

## Execution

```bash
python3 -m unittest \
  tests.knowledge_engine.test_portable_plugin_workspace_certification \
  -v
```
