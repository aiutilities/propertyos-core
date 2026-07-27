# PropertyOS Production Restore Runbook

## Purpose

Restore PropertyOS data from an approved verified backup under explicit human authorization.

## Preconditions

- Explicit restore authorization is recorded.
- Backup identity and digest are verified.
- Restore destination is confirmed.
- Data-loss boundary is documented.
- Current production evidence is preserved.
- Application processes are stopped when required.
- Schema and application compatibility are understood.
- Recovery acceptance criteria are documented.

## Preferred Restore Order

1. Restore into an isolated environment first.
2. Validate backup integrity.
3. Validate database connectivity.
4. Validate schema state.
5. Start the approved application artifact.
6. Verify liveness.
7. Verify readiness.
8. Execute controlled data checks.
9. Record restore evidence.
10. Only then consider authorized production recovery.

## Production Restore Sequence

1. Record restore authorization.
2. Preserve current logs and operational evidence.
3. Stop frontend.
4. Stop scheduler.
5. Stop backend.
6. Preserve the current database separately when possible.
7. Verify backup digest.
8. Restore PostgreSQL using approved tooling.
9. Verify schema and migration state.
10. Start backend.
11. Start scheduler.
12. Start frontend.
13. Verify liveness.
14. Verify readiness.
15. Verify monitoring.
16. Perform controlled data validation.
17. Record restore completion and observed data-loss boundary.

## Acceptance Gates

Restore succeeds only when:

- backup digest matches
- database restore completes without error
- schema state is approved
- liveness returns HTTP 200
- readiness returns HTTP 200
- readiness status equals ok
- controlled data validation passes
- monitoring resumes
- restore evidence is complete

## Unsafe Conditions

Do not restore when:

- authorization is absent
- backup digest does not match
- backup identity is uncertain
- data-loss boundary is unknown
- destination environment is ambiguous
- current production evidence has not been preserved

## Safety Boundary

This runbook does not itself authorize production restore, data replacement, data deletion or destructive infrastructure action.
