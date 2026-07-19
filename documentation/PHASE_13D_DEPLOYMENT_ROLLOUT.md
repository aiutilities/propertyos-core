# Phase 13D Controlled Deployment Rollout

## Safety boundary

Phase 13D separates migration readiness from migration execution.

A successful static preflight proves only that migrations 044 through 048 are
present, ordered correctly, and match their reviewed SHA-256 digests. It does
not authorize migration execution.

These migrations must remain unapplied until every runtime gate is satisfied
and explicit authorization has been recorded.

## Controlled migration inventory

| Migration | Dependency | Transaction | Down migration | Recovery |
|---|---|---:|---:|---|
| 044 installation attempts | Existing core schema | Yes | No | Backup restore |
| 045 migration integrity | 044 and schema_migrations | Yes | No | Backup restore |
| 046 publisher trust | Existing core schema | Yes | No | Backup restore |
| 047 publication governance | 046 and storage_objects | Yes | No | Backup restore |
| 048 trust security events | 046 | Yes | No | Backup restore |

Numeric order 044, 045, 046, 047, 048 satisfies every dependency.

The runner wraps each migration and its migration record in one PostgreSQL
transaction. A failed migration is rolled back before its schema_migrations
record is inserted.

PropertyOS has no core down-migration framework. These migrations are therefore
operationally irreversible. Backup restoration is the approved recovery path.

Migration 047 uses application-controlled storage admission for
artifact_storage_object_id; it does not create a database foreign key to
storage_objects. Preflight and acceptance must verify the storage table and all
referenced publication artifacts.

## Gate 1: Static readiness

From the backend directory, run:

    npm run migrate:preflight:static

Required result:

- status is READY.
- databaseTouched is false.
- applyAuthorized is false.
- All five migration checksums match.
- No dependency-order errors exist.

The static preflight does not connect to PostgreSQL.

## Gate 2: Backup evidence

Before isolated or staging execution, capture:

- PostgreSQL server and client versions.
- UTC backup timestamp.
- Git commit and release tag.
- Database and environment identifiers.
- Custom-format pg_dump artifact.
- SHA-256 of the dump.
- Successful pg_restore --list output.
- Existing schema_migrations inventory.
- Existing core_plugins row count.
- Storage-volume backup evidence.

A dump is not accepted merely because pg_dump exits successfully. It must be
readable by pg_restore, have a recorded checksum, and be restored into an
isolated database.

## Gate 3: Isolated restore exercise

The exercise must prove:

1. The backup restores into an empty isolated PostgreSQL 16 database.
2. Pre-migration row counts agree with source evidence.
3. Migrations 044 through 048 apply in reviewed order.
4. Expected tables, columns, indexes, constraints, function, and trigger exist.
5. Existing plugin rows remain unchanged.
6. Security regression tests pass against the isolated environment.
7. Recovery can return to the recorded pre-migration state.

Never use a running development, pilot, staging, or production database for the
destructive restore exercise.

## Gate 4: Staging authorization

Staging execution requires recorded confirmation of:

- Static readiness.
- Valid backup evidence.
- Successful isolated restore exercise.
- Maintenance window.
- Named rollout operator and incident owner.
- Named go/no-go approver.
- Rollback decision deadline.
- Expected migration range limited to 044 through 048.

## Gate 5: Post-migration acceptance

Acceptance must verify:

- Exactly one applied record for every migration 044 through 048.
- No unexpected migration was applied.
- Required schema objects match the acceptance manifest.
- Existing core_plugins rows remain intact.
- API and PostgreSQL health checks pass.
- Publication and trusted-installation regressions pass.
- Audit queries return expected results.
- No private signing material is present.

## Stop conditions

Stop without proceeding when:

- A migration checksum or order differs.
- Backup evidence is missing or unreadable.
- Restore has not been exercised.
- An unexpected migration is pending.
- Existing plugin counts differ unexpectedly.
- PostgreSQL is unhealthy.
- Authorization is absent.
- A private signing key is found.
- A schema acceptance assertion fails.

## Runtime revocation boundary

Publisher and key revocation stop trusted distribution and quarantine affected
publications. They do not automatically deactivate a running plugin.

Phase 13D pilot testing must preserve this boundary. Automatic runtime
containment requires a separate Phase 13E operational decision.
