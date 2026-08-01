# Portable Contract Facade Architecture

## Status

- Phase: 21B22
- Contract status: frozen
- Implementation status: not started
- Existing strategy preserved: `repository-reexport`
- New strategy: `portable-facade`

## Problem

The current generated `@propertyos/core-contracts` package is repository-backed.

It:

- re-exports files from `backend/src`;
- extends `backend/tsconfig.json`;
- depends on repository-relative paths;
- is marked non-publishable;
- cannot compile after being copied outside the PropertyOS repository.

Generated plugin workspaces inherit the same repository dependency.

This prevents clean Docker builds, Marketplace distribution and external
developer consumption.

## Architectural Decision

The Knowledge Engine shall support two explicit contract-generation modes.

### `repository-reexport`

Purpose:

- internal extraction analysis;
- migration staging;
- compatibility with existing generated workspaces.

Properties:

- repository-backed;
- private;
- non-publishable;
- allowed to reference source paths under the repository.

### `portable-facade`

Purpose:

- distributable plugin compilation;
- Marketplace packaging;
- clean Docker builds;
- external developer SDK consumption.

Properties:

- self-contained package files;
- no imports from `backend/src`;
- no `extends` reference outside the package;
- deterministic build output;
- publishable metadata;
- stable runtime and type exports;
- versioned host compatibility.

## Runtime Boundary

A portable contract package must not copy arbitrary backend implementations.

It shall expose only the stable plugin host surface.

The portable package shall contain:

- public TypeScript declarations;
- public runtime tokens and constants where required;
- interfaces and DTOs approved for plugin use;
- registry and host-service contracts;
- compatibility metadata.

Backend implementation classes remain inside PropertyOS.

Plugins depend on contracts, not backend source modules.

## Package Layout

```text
core-contracts/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── audit/
│   ├── auth/
│   ├── database/
│   ├── eventbus/
│   ├── identity/
│   ├── platform/
│   ├── plugin/
│   ├── scheduler/
│   ├── search/
│   └── workflow/
└── dist/
```

## Package Metadata

The generated package must include:

```json
{
  "name": "@propertyos/core-contracts",
  "version": "<version>",
  "private": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "sideEffects": false,
  "propertyos": {
    "generated": true,
    "sourceStrategy": "portable-facade",
    "publishable": true,
    "hostApiVersion": "<version>"
  }
}
```

## TypeScript Contract

The portable package shall use a self-contained `tsconfig.json`.

It must not contain:

- `extends` outside the package;
- `rootDir` outside the package;
- repository-relative `typeRoots`;
- path aliases pointing to PropertyOS source.

## Host Compatibility

Portable contract packages shall declare a host API version.

A plugin package shall declare the compatible host API range.

Installation must fail before activation when the ranges are incompatible.

## Generation Rules

For `portable-facade`:

1. Resolve the required public symbols.
2. Validate each symbol against the approved host surface.
3. Generate or copy only approved contract declarations.
4. Generate runtime tokens only from approved runtime contract sources.
5. Reject unsupported backend implementation exports.
6. Generate deterministic package files.
7. Build the package in isolation.
8. Pack and install it in a clean temporary project.
9. Reject any repository path escape.

## Forbidden Output

Portable generation must fail if output contains:

- `backend/src`;
- `../backend`;
- paths escaping the package;
- repository absolute paths;
- `repository-reexport`;
- source-only TypeScript exports as package runtime entrypoints.

## Acceptance Criteria

The strategy is accepted only when:

- existing `repository-reexport` behavior remains unchanged;
- `portable-facade` is selectable through the CLI;
- generated package metadata is publishable;
- generated package compiles outside the repository;
- `npm pack` contains only intended package files;
- a clean consumer project installs the archive;
- all generated plugins typecheck against the installed archive;
- the production Docker build succeeds without repository source mounts;
- tests prove deterministic output;
- repository and database migrations are not required.
