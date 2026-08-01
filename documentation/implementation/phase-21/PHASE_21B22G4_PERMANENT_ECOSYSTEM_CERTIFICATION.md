# Phase 21B22G4 — Permanent Ecosystem Certification

## Permanent command

```bash
./tools/knowledge_engine/certify_portable_plugin_ecosystem.sh
```

## Certified scope

The repository-owned command:

- discovers all 16 portable plugin workspaces;
- verifies standalone portable configuration;
- installs, typechecks, builds, and packs all plugins;
- validates every plugin archive;
- performs a clean consumer installation;
- supplies the portable core-contract archive at the relative path used by
  packed plugin dependencies;
- confirms no tracked `node_modules`;
- removes temporary workspaces;
- confirms the repository remains unchanged.

## Certified baseline

Phase 21B22G3 certified 16/16 plugins, npm installation, TypeScript typecheck,
build, npm pack, clean consumer installation, and repository safety.

## Next phase

Phase 21B22H — Release Readiness.
