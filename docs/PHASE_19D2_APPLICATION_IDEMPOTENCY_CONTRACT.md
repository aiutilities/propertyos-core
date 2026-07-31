# PropertyOS Phase 19D2 Application Idempotency Contract

## Status
- Phase 19D1: COMPLETE
- Phase 19D2 preflight: COMPLETE
- Classification: PARTIAL
- Runtime implementation: NOT STARTED
- Migration 055: UNAPPLIED

## Conclusion
Migration 055 already provides durable uniqueness for `(schedule_id, scheduled_for)`.
No schema change is required.

The missing boundary is application-level atomic create-or-resolve behavior.

## Repository Contract
Add a narrow repository operation:

```ts
createOrResolveOccurrence(
  occurrence: AiScheduledOccurrence,
): Promise<AiOccurrenceCreateOrResolveResult>;
```

```ts
interface AiOccurrenceCreateOrResolveResult {
  occurrence: AiScheduledOccurrence;
  created: boolean;
}
```

The logical key is `(scheduleId, scheduledFor)`. Occurrence ID is not the idempotency key.

The PostgreSQL implementation must use the existing unique constraint and atomic conflict handling. It must not rely on read-before-write, in-memory locks, scheduler deduplication, or unrestricted retries.

On first insertion, return the durable row with `created: true`.

On an approved logical-key conflict, return the existing durable row with `created: false`.

Unrelated database errors must propagate.

Resolving an existing occurrence must not modify status, claims, attempts, retry state, result, error, or timestamps.

Two concurrent calls for the same logical key must produce one durable occurrence and no duplicate logical rows.

Existing `createOccurrence(...)` behavior must remain compatible.

## Authorized Scope
Phase 19D2 implementation may change only:
- repository interface
- PostgreSQL schedule repository
- narrow result type if needed
- repository-focused tests

It must not change:
- deterministic calculator
- lifecycle behavior
- occurrence execution
- scheduler bridge or worker
- prompts, governance, or providers
- dependencies
- Migration 055

## Required Tests
- insertion returns `created: true`
- repeat returns `created: false`
- existing state is preserved
- differing occurrence IDs resolve to one row
- concurrent calls produce one logical occurrence
- unrelated database errors propagate
- canonical timestamps resolve correctly
- strict create behavior remains compatible

## Completion Rule
Phase 19D2 completes only after focused tests, scheduled AI regressions, AI boundary regressions, scheduler regressions, typecheck, build, exact scope validation, one commit, and a clean repository.

Scheduler wiring must not begin during Phase 19D2.
