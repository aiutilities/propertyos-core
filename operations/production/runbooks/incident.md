# PropertyOS Production Incident Runbook

## Purpose

Provide a fail-closed response process for production incidents while preserving evidence, data integrity and recovery options.

## Incident Triggers

Examples include:

- readiness degradation
- repeated liveness failure
- database connectivity failure
- failed plugin loading
- scheduler execution failure
- storage failure
- event-bus failure
- workflow degradation
- deployment failure
- rollback uncertainty
- backup or restore failure
- alert-rule breach
- suspected secret exposure
- suspected unauthorized access

## Immediate Actions

1. Record incident start time.
2. Record the current release commit and artifact identities.
3. Preserve logs, health responses and monitoring evidence.
4. Stop new deployment and migration activity.
5. Classify whether users or data are at risk.
6. Decide whether application traffic must be restricted.
7. Keep PostgreSQL intact unless separate action is authorized.
8. Identify the last known-good artifact and backup.
9. Record the human incident owner.
10. Begin an incident timeline.

## Severity Classification

### Critical

- data integrity is uncertain
- unauthorized access is suspected
- production database is unavailable
- restore may be required
- secret exposure is suspected
- all users are affected

### High

- readiness remains degraded
- scheduler or workflow processing is materially impaired
- deployment or rollback failed
- multiple operational subsystems are degraded

### Medium

- one subsystem is degraded
- a workaround exists
- no current data-integrity risk is known

### Low

- isolated operational warning
- no user impact
- no data-integrity risk

## Containment Rules

Containment must:

- preserve evidence
- minimize additional writes
- avoid destructive cleanup
- avoid automatic database restore
- avoid reverse migration without authorization
- avoid secret disclosure
- avoid overwriting the last known-good backup

## Recovery Decision

Choose one authorized path:

- restart the current approved artifact
- perform application-only rollback
- keep services stopped for investigation
- restore into an isolated environment
- perform separately authorized production restore

## Recovery Gates

Before reopening service:

- liveness returns HTTP 200
- readiness returns HTTP 200
- readiness status equals ok
- no failed plugins are reported
- database state is understood
- monitoring resumes
- alert rules are loaded
- controlled smoke validation passes
- incident owner approves reopening

## Evidence Requirements

Record:

- incident identifier
- start and end timestamps
- severity
- affected services
- release commit
- observed health failures
- monitoring evidence
- actions taken
- authorization records
- backup and artifact identities
- recovery validation
- unresolved risks
- follow-up actions

## Safety Boundary

This runbook does not authorize destructive containment, database restore, reverse migration, data deletion, secret publication or infrastructure destruction.
