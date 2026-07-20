# Phase 13D6 Production Operational Runbook

## Safety status

This runbook defines production authorization, abort, recovery, and
acceptance controls.

It does not authorize a production rollout by itself.

At this checkpoint:

- The production runner is not exposed.
- Production execution has not started.
- The production database has not been mutated.
- A separate explicit execution request remains mandatory.

## Required roles

The rollout requires named, distinct responsibilities:

- Operator: performs only the approved rollout steps.
- Approver: independently grants the final go/no-go decision.
- Incident owner: coordinates an operational incident.
- Recovery owner: owns backup restoration and recovery evidence.

The operator and approver must be different people.

## Required evidence

Before any execution request can be considered, capture and verify:

1. Exact production candidate Git commit.
2. Exact release tag.
3. Phase 13D5 readiness-proof SHA-256.
4. Current technical-preflight evidence SHA-256.
5. Fresh commit-bound PostgreSQL custom-format backup.
6. Database-backup SHA-256.
7. Successful `pg_restore --list` verification.
8. Current storage backup and readability evidence.
9. Isolated restore proof for the production candidate.
10. Exact production environment and database identity.
11. Source baseline and service-health evidence.
12. Named maintenance window.
13. Named operator, approver, incident owner, and recovery owner.
14. Explicit production approval identifier and timestamp.

No private signing key or private PEM material may be recorded.

## Expected pre-mutation baseline

The currently reviewed baseline is:

- Core plugins: 1
- Schema migrations: 37
- Controlled migrations 037-048 applied: 0
- Compact state: `1|37|0`
- API: healthy
- PostgreSQL: healthy

Any baseline difference requires a new review. Do not continue by manually
editing migration records.

## Controlled migration range

Only these migrations are eligible:

1. `core/037-create-core-inventory-material-issue.sql`
2. `core/038-create-core-inventory-material-return.sql`
3. `core/039-create-core-inventory-batch-foundation.sql`
4. `core/040-add-procurement-batch-receipt-integration.sql`
5. `core/041-add-inventory-material-issue-batch.sql`
6. `core/042-add-inventory-material-return-batch.sql`
7. `core/043-add-inventory-stock-reservation-batch.sql`
8. `core/044-create-plugin-installation-attempts.sql`
9. `core/045-add-plugin-migration-integrity.sql`
10. `core/046-create-plugin-publisher-trust.sql`
11. `core/047-create-plugin-publication-governance.sql`
12. `core/048-create-plugin-trust-security-events.sql`

The order and reviewed SHA-256 values are immutable.

## Mandatory pre-mutation stop conditions

Abort before mutation when any of the following occurs:

- Authorization evidence is absent, expired, altered, or invalid.
- Operator and approver are the same person.
- Maintenance window is absent or invalid.
- Target environment or database identity differs.
- Commit or release tag differs.
- Migration checksum or order differs.
- Backup evidence is absent, unreadable, or not commit-bound.
- Isolated restore evidence is missing.
- Source baseline differs from `1|37|0`.
- API or PostgreSQL is unhealthy.
- Unexpected migrations are pending.
- Private signing material is detected.

## Execution boundary

Phase 13D6B does not provide a production execution command.

A future controlled runner may be exposed only after:

1. Authorization evidence is materialized and independently reviewed.
2. The final commit-bound backup is captured.
3. The final maintenance window is approved.
4. The execution request is separately and explicitly authorized.
5. The runner is proven fail-closed against authorization drift.

Technical readiness is not execution authorization.

## Recovery decision tree

### Before mutation

If any gate fails:

- Stop.
- Record the failed gate.
- Do not start migrations.
- Preserve the source state.
- Return to authorization preparation.

### While migrations are running

If a migration fails or evidence changes:

- Stop further execution.
- Preserve failure logs.
- Do not manually mark migrations as applied.
- Transfer control to the recovery owner.
- Restore the commit-bound backup.
- Verify the recovered baseline.

### Backup unavailable after mutation

If mutation has started and the approved backup becomes unavailable or
unreadable:

- Halt all further rollout activity.
- Do not attempt restoration from the unreadable artifact.
- Preserve database, storage, process, and audit evidence.
- Escalate immediately to the incident and recovery owners.
- Do not accept the release.
- Resume only through an independently approved recovery procedure.

### After migration commit

Restore the commit-bound backup when:

- Schema acceptance fails.
- An unexpected migration is present.
- Core plugin count changes unexpectedly.
- An unrelated plugin changes.
- API or PostgreSQL becomes unhealthy.
- Publication or trusted-installation regressions fail.
- Private signing material is detected.
- Required audit evidence cannot be produced.

### Accepting the release

Accept only when every production acceptance item passes and both the operator
and independent approver sign off.

## Post-deployment acceptance checklist

Required acceptance evidence:

- Authorization evidence digest verified.
- Production target identity reconfirmed.
- Migrations 037-048 applied exactly once.
- No unexpected migrations applied.
- Required schema relations, columns, indexes, constraints, functions, and
  triggers accepted.
- Core plugin count unchanged except for explicitly approved operations.
- Unrelated plugin state unchanged.
- API healthy.
- PostgreSQL healthy.
- Publication governance regressions passed.
- Trusted installation regressions passed.
- No private signing material detected.
- Audit evidence captured.
- Recovery owner acknowledged recovery readiness.
- Operator signed off.
- Independent approver signed off.

A failed checklist item rejects the release.

## Recovery acceptance

After restoration, verify:

- Database is reachable and PostgreSQL is healthy.
- Compact state matches the recorded pre-mutation baseline.
- Controlled migrations are absent when restoring the `1|37|0` backup.
- Core plugin rows match the pre-mutation fingerprint.
- Storage evidence matches the corresponding backup.
- API health passes.
- Recovery evidence is signed by the recovery owner.
- Incident status and follow-up actions are recorded.

## Current conclusion

Phase 13D6B can establish operational readiness, but it cannot perform or
authorize production execution.

The next permitted engineering activity is a separately reviewed,
fail-closed production execution-request gate. Live production execution
still requires explicit human authorization.

## Phase 13D6D runner-exposure decision

The founding specifications require explicit human approval for production,
but they do not require an automatically exposed production migration runner.

PropertyOS therefore keeps production execution disabled by default.

The runner-exposure policy may confirm eligibility only when:

- A valid execution-request seal exists.
- Separate live invocation authorization is present.
- Live authorization evidence has a valid identifier and SHA-256.
- Evaluation occurs inside the approved maintenance window.
- Operator, approver, recovery owner, and incident owner are present.
- Production database and commit identities are locked.
- Backup and technical preflight evidence are reconfirmed.

An eligible decision still reports:

- `runnerExposed: false`
- `runnerInvocationAuthorized: false`
- `invocationPerformed: false`
- `databaseMutated: false`

Actual runner exposure and invocation remain a separate, explicitly authorized
future operation.
