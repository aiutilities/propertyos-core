# PropertyOS Production Backup Runbook

## Purpose

Create verifiable production backup evidence before deployment or other authorized operational change.

## Backup Scope

Required backup scope includes:

- PostgreSQL database
- deployment configuration excluding secret values
- plugin and theme package inventory
- approved artifact identities
- migration state
- operational metadata required for recovery

## Preconditions

- Backup operation is authorized.
- Destination storage is approved.
- Available capacity is verified.
- Encryption requirements are satisfied.
- Retention policy is known.
- Backup filename and timestamp convention is established.

## Backup Sequence

1. Record source environment identity.
2. Record current application commit and artifact digests.
3. Record database name and schema state without credentials.
4. Create PostgreSQL backup using approved tooling.
5. Capture configuration keys without exposing secret values.
6. Capture plugin and theme inventory.
7. Capture applied migration inventory.
8. Calculate backup digest.
9. Verify backup file is non-empty.
10. Verify backup format can be inspected.
11. Store backup in approved protected storage.
12. Record retention and expiry metadata.
13. Record backup evidence.

## Integrity Gates

Backup evidence must include:

- creation timestamp
- source environment identity
- application commit
- database identity without credentials
- backup size
- backup digest
- approved storage location reference
- verification result
- retention metadata

## Failure Handling

If backup creation or verification fails:

- stop deployment
- preserve error output
- do not overwrite the last known-good backup
- do not proceed with migration or deployment
- escalate through the incident runbook

## Safety Boundary

This runbook does not authorize secret publication, unencrypted external storage, production deployment or database mutation.
