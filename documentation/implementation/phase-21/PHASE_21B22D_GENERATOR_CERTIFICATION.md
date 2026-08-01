# Phase 21B22D — Generator Certification

## Status

- Portable strategy: certified
- Legacy strategy: preserved
- Repository mutation during certification: none
- Database impact: none
- Runtime deployment impact: none

## Certification Coverage

The permanent certification suite verifies:

1. deterministic portable package output;
2. absence of repository-relative paths;
3. publishable package metadata;
4. TypeScript 6 `Node16` configuration;
5. isolated dependency installation;
6. isolated typecheck and build;
7. npm archive creation;
8. archive allow-list requirements;
9. exclusion of source, backend and dependency trees.

## Certified Boundary

The certification covers the portable core-contract package generator and
its approved host-runtime bridge.

It does not yet certify every generated plugin workspace. Plugin workspace
portability is handled by Phase 21B22E and the subsequent all-plugin
regeneration and Docker certification checkpoints.

## Execution

```bash
python3 -m unittest \
  tests.knowledge_engine.test_portable_contract_package_certification \
  -v
```
