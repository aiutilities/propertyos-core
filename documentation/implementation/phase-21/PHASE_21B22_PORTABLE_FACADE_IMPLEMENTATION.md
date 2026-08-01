# Phase 21B22 — Portable Facade Implementation Plan

## Baseline

- Repository HEAD: `c735113b7383e0d42e995afc5b1d5a23585c2fef`
- Existing strategy: `repository-reexport`
- Existing generated contracts: repository-coupled
- Database impact: none
- Runtime deployment impact: none during implementation

## Implementation Checkpoints

### 21B22A — Strategy model

Update:

- `contract_package_cli.py`
- `contract_package_layout_models.py`
- `contract_package_layout.py`

Add:

- `portable-facade` as a supported strategy;
- strategy-specific `publishable` calculation;
- explicit validation tests.

No generated files are overwritten in this checkpoint.

### 21B22B — Approved host surface

Create a deterministic manifest describing symbols plugins may consume.

The manifest must distinguish:

- type-only contracts;
- runtime tokens/constants;
- forbidden backend implementation classes.

Generation must fail for unapproved symbols.

### 21B22C — Portable package generator

Update `contract_package_generator.py` to emit:

- self-contained package metadata;
- self-contained TypeScript configuration;
- generated or copied approved declarations;
- stable runtime contract modules;
- host API compatibility metadata.

Existing repository-reexport output must remain byte-for-byte stable.

### 21B22D — Generator tests

Add tests for:

- strategy validation;
- publishable metadata;
- no repository escapes;
- deterministic hashes;
- isolated typecheck;
- isolated build;
- archive contents;
- clean consumer installation;
- unsupported symbol rejection.

### 21B22E — Plugin workspace generator

Update `plugin_workspace_generator.py` for portable workspaces:

- self-contained `tsconfig.json`;
- packaged core-contract dependency;
- no `../../../backend/tsconfig.json`;
- no repository-relative runtime dependency;
- explicit host API compatibility.

### 21B22F — Regeneration

Regenerate:

- `generated/contracts/core-contracts`;
- all packages under `generated/plugin-staging`.

Regeneration must be a separately reviewed commit.

### 21B22G — Clean-environment certification

Validate in a clean temporary directory and clean Docker build:

```text
generate
→ build contracts
→ npm pack contracts
→ install contracts
→ build every plugin
→ npm pack every plugin
→ install selected plugin
→ load in container runtime
```

## Safety Gates

Every implementation checkpoint must verify:

- expected HEAD;
- clean working tree;
- exact changed-file scope;
- Python compilation;
- focused tests;
- full relevant regression;
- no database migration;
- no runtime container replacement unless explicitly authorized;
- clean repository after commit.

## Non-Goals

Phase 21B22 does not:

- publish packages externally;
- delete backend modules;
- activate generated plugins;
- change Marketplace trust policy;
- modify database schemas;
- begin Phase 22.
