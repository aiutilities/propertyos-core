# PropertyOS Production Shutdown Runbook

## Purpose

Stop PropertyOS application processes safely while preserving the database and operational evidence.

## Preconditions

- Shutdown authorization is recorded.
- Current incident or maintenance reason is documented.
- Active deployment and runtime identities are known.
- Relevant logs and health evidence are preserved.

## Shutdown Sequence

1. Prevent new administrative deployment activity.
2. Stop the frontend production server.
3. Stop the scheduler worker.
4. Stop the backend API.
5. Wait for graceful shutdown hooks.
6. Verify frontend process termination.
7. Verify scheduler process termination.
8. Verify backend process termination.
9. Preserve PostgreSQL.
10. Preserve logs, incident evidence and deployment metadata.
11. Record shutdown completion.

## Database Boundary

The normal application shutdown sequence must not:

- stop PostgreSQL unless separately authorized
- delete volumes
- remove database files
- execute rollback migrations
- mutate production records

## Verification

- Frontend port is no longer listening.
- Backend port is no longer listening.
- Scheduler process is absent.
- PostgreSQL remains reachable when required.
- No automatic migration or rollback was executed.

## Failure Handling

If a process does not stop gracefully:

- capture the process identity
- preserve logs
- allow the configured graceful timeout
- escalate before force termination
- never terminate PostgreSQL as part of application-process cleanup

## Safety Boundary

This runbook does not authorize data deletion, database shutdown, migration rollback or infrastructure destruction.
