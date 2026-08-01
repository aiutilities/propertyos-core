# Phase 21B23B — Marketplace Contract Design

## Status

COMPLETE

## Objective

Define a stable, machine-readable marketplace contract that sits above the
existing PropertyOS marketplace, installer, publication, signature,
compatibility, upgrade, rollback, uninstall, registry and runtime
implementations.

This phase defines the admission contract. It does not migrate the existing
16 plugin manifests.

## Contract version

`1.0.0`

## Machine-readable artifacts

- `tools/knowledge_engine/contracts/marketplace_plugin_manifest.schema.json`
- `tools/knowledge_engine/contracts/examples/marketplace_plugin_manifest.example.json`

## Contract principles

### Closed manifest

Unknown top-level fields are denied by default. Contract evolution requires a
schema-version change rather than accepting silent extensions.

### Stable plugin identity

Every marketplace plugin has:

- immutable plugin ID;
- human-readable display name;
- semantic version;
- publisher identity;
- contract schema version.

### Explicit host compatibility

Every plugin declares:

- minimum PropertyOS host API version;
- maximum PropertyOS host API version;
- supported Node.js runtime range;
- required PropertyOS contract packages.

Marketplace admission must reject a plugin whose declared host range does not
include the active host API version.

### Default-deny permissions

Permissions are explicit capability grants using:

`resource:action`

A plugin receives no undeclared permission.

### Registry capabilities

The manifest can declare these supported host extension capabilities:

- configuration;
- dashboard;
- documents;
- notifications;
- permissions;
- scheduler;
- search;
- workflow.

A declared capability does not itself grant authorization. Runtime activation
must still pass host policy and permission checks.

### Dependency contract

Plugin dependencies declare:

- plugin ID;
- version range;
- whether the dependency is optional.

Resolution must complete before installation mutation begins.

### Migration contract

Migration strategies are:

- `none`;
- `ordered-sql`.

Every manifest declares whether migrations are reversible. Rollback admission
must reject an automatic rollback when required migrations are not reversible.

### Lifecycle contract

Optional lifecycle entrypoints are bounded to:

- install;
- activate;
- deactivate;
- uninstall.

Lifecycle entrypoints must resolve inside the extracted plugin package.

### Integrity contract

Every marketplace artifact declares:

- SHA-256 archive digest;
- optional Ed25519 signature;
- publisher signing-key identifier.

Integrity validation occurs before extraction, migration or runtime loading.

## Installation lifecycle

The stable lifecycle is:

1. Resolve plugin and dependency versions.
2. Download or accept the candidate archive.
3. Verify archive SHA-256.
4. Verify publisher signature and trust status.
5. Read and validate the marketplace manifest.
6. Evaluate host and contract compatibility.
7. Evaluate permissions and capabilities.
8. Validate dependency closure.
9. Create installation attempt record.
10. Extract to an isolated temporary workspace.
11. Validate package boundaries and entrypoints.
12. Execute reversible migrations.
13. Materialize the installed package.
14. Register plugin capabilities.
15. Activate the runtime entrypoint.
16. Publish lifecycle events.
17. Mark the installation attempt successful.

A failure after mutation begins must enter the existing coordinated rollback
path.

## Upgrade contract

An upgrade must:

1. resolve the target version;
2. preserve the currently installed version for rollback;
3. validate compatibility before mutation;
4. apply migrations in version order;
5. activate the target version;
6. retain rollback evidence;
7. publish a version-transition event.

## Rollback contract

Rollback must restore:

- prior package version;
- prior runtime activation;
- prior capability registrations;
- reversible database state;
- installation and lifecycle evidence.

Rollback must not silently continue when a required database reversal cannot
be proven.

## Uninstall contract

Uninstall must:

- deactivate runtime execution;
- unregister capabilities;
- apply declared reversible cleanup;
- preserve audit and installation history;
- remove materialized package content;
- publish the uninstall lifecycle event.

## Publisher trust contract

Publisher admission requires:

- stable publisher ID;
- trusted signing-key ID;
- supported signature algorithm;
- signature verification success;
- key not revoked at verification time.

The initial signature algorithm is Ed25519.

## Compatibility decision

Compatibility is allowed only when all of the following pass:

- schema version supported;
- host API within declared minimum and maximum;
- core-contract version supported;
- Node.js runtime supported;
- plugin dependency closure resolvable;
- permissions syntactically valid;
- lifecycle entrypoints package-local;
- archive integrity valid;
- publisher trust valid.

## Explicit exclusions

Phase 21B23B does not:

- rewrite the 16 existing `plugin.json` files;
- change installer runtime behavior;
- change marketplace database tables;
- publish packages externally;
- activate a live marketplace;
- replace existing publication-governance rules.

## Next phase

Phase 21B23C — Manifest Adapter and Compatibility Validator
