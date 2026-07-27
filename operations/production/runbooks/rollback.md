# PropertyOS Production Rollback Runbook

## Purpose

Restore the previous approved application artifact when a deployment fails and rollback is safe.

## Preconditions

- Human rollback authorization is recorded.
- Previous approved artifact is available.
- Current and previous artifact identities are known.
- Database compatibility has been assessed.
- Logs, health evidence and deployment metadata are preserved.
- Rollback will not require an unsafe reverse migration.

## Rollback Classification

### Application-Only Rollback

Allowed when:

- no incompatible database migration was applied
- the previous application remains compatible with the current schema
- configuration remains compatible
- required plugins and themes remain compatible

### Database-Affecting Rollback

Must not proceed automatically.

It requires:

- separate human authorization
- verified restore point
- restore evidence
- confirmed data-loss boundary
- documented recovery decision

## Rollback Sequence

1. Stop new administrative deployment activity.
2. Preserve failure evidence.
3. Stop frontend.
4. Stop scheduler.
5. Stop backend.
6. Confirm database compatibility.
7. Restore the previous approved application artifacts.
8. Preserve the current database unless restore is separately authorized.
9. Start backend.
10. Start scheduler.
11. Start frontend.
12. Verify liveness.
13. Verify readiness.
14. Verify monitoring.
15. Perform controlled smoke validation.
16. Record rollback evidence.

## Acceptance Gates

Rollback succeeds only when:

- previous artifact identity is verified
- liveness returns HTTP 200
- readiness returns HTTP 200
- readiness status equals ok
- monitoring resumes
- controlled smoke validation passes
- no unauthorized database action occurred

## Unsafe Conditions

Do not continue automatic rollback when:

- reverse migration would be required
- schema compatibility is unknown
- restore evidence is absent
- previous artifact is unavailable
- data-loss scope is unknown
- production authorization is absent

## Safety Boundary

This runbook does not authorize reverse migrations, database restore, data deletion, infrastructure destruction or secret disclosure.
