# PropertyOS Phase 19B Recurring Occurrence Gap Matrix

## Status

Phase 19A: COMPLETE

Phase 19B: COMPLETE

Phase 19C: REQUIRED

Runtime implementation: NOT STARTED

Migration 055: UNAPPLIED

Database mutation: NONE

## Audit objective

Phase 19B performed a read-only audit of the existing scheduled AI execution
implementation to determine whether persisted interval schedules automatically
materialize future scheduled occurrences.

The audit preserved all completed Phase 17 and Phase 18 boundaries.

No source code was modified.

No test was executed against a database.

No migration was executed.

## Final classification

Overall recurring occurrence materialization classification:

**PARTIAL**

Reason:

Occurrence creation exists, but no production source proves automatic
interval-driven subsequent occurrence generation.

## Evidence summary

The existing implementation provides:

- interval schedule contracts,
- interval schedule validation,
- timezone validation,
- schedule persistence,
- schedule lifecycle transitions,
- explicit occurrence creation,
- due occurrence discovery,
- atomic occurrence claiming,
- claim expiry,
- duplicate claim rejection,
- occurrence execution,
- retry lifecycle,
- platform scheduler bridge,
- platform worker integration, and
- scheduled AI execution integration tests.

However, the read-only source audit found:

- the only production `createOccurrence(...)` caller is the schedule lifecycle
  service itself,
- no production interval-generation reference,
- no automatic next-occurrence calculation,
- no automatic materialization caller,
- no recurring materialization test,
- no subsequent-occurrence test,
- no missed-interval recovery test, and
- no bounded catch-up test.

## Capability matrix

| Capability | Classification | Evidence |
| --- | --- | --- |
| Interval schedule type | COMPLETE | `AiScheduleType` supports `once` and `interval`. |
| Interval validation | COMPLETE | Minimum interval and invalid `runAt` combinations are validated. |
| Timezone validation | COMPLETE | Timezones are validated through `Intl.DateTimeFormat`. |
| Schedule persistence | COMPLETE | Interval seconds and timezone are persisted by the PostgreSQL repository. |
| Schedule lifecycle | COMPLETE | Active schedules can be paused, resumed and cancelled. |
| Explicit occurrence creation | COMPLETE | `AiScheduleLifecycleService.createOccurrence(...)` exists. |
| Due occurrence discovery | COMPLETE | Pending and retryable occurrences can be discovered by scheduled time. |
| Atomic occurrence claim | COMPLETE | Repository claim transition prevents ordinary duplicate claims. |
| Expired claim recovery | COMPLETE | Expired claimed occurrences may be reclaimed. |
| Claim TTL | COMPLETE | Handler uses configurable claim expiry. |
| Duplicate claim rejection | COMPLETE | Lifecycle integration tests reject duplicate claims. |
| Occurrence execution | COMPLETE | Scheduled occurrences pass through governance, dispatch, attempt and retry lifecycle. |
| Platform scheduler bridge | COMPLETE | Occurrences can be represented as platform one-time jobs. |
| Scheduler worker integration | COMPLETE | Existing platform scheduler executes registered jobs. |
| Retry and backoff | COMPLETE | Existing occurrence execution handles retry scheduling. |
| Automatic first occurrence materialization for interval schedules | MISSING | No production caller was found. |
| Automatic subsequent occurrence materialization | MISSING | No production source calculates or creates the next interval occurrence. |
| Deterministic interval anchor | MISSING | No persisted or implemented anchor rule was found. |
| Next-occurrence calculation | MISSING | No production next-occurrence calculation was found. |
| Pause-aware materialization | MISSING | Pause lifecycle exists, but no materializer exists to respect it. |
| Resume behavior for elapsed intervals | MISSING | No resume materialization policy exists. |
| Cancellation-aware materialization | MISSING | Cancellation lifecycle exists, but no materializer exists to enforce generation behavior. |
| Missed-run policy | MISSING | No skip, latest-only or catch-up policy exists. |
| Bounded catch-up | MISSING | No maximum catch-up bound exists. |
| Worker-downtime recovery | MISSING | Existing due execution recovery does not generate absent interval occurrences. |
| Concurrent materializer idempotency | MISSING | Claim idempotency exists for created occurrences, not for occurrence generation. |
| Duplicate occurrence constraint | PARTIAL | Attempt uniqueness exists; deterministic schedule-time uniqueness for generated occurrences is not proven. |
| Timezone-aware interval semantics | PARTIAL | Timezone is validated and stored, but no generation semantics consume it. |
| Recurring materialization metrics | MISSING | No generated/skipped/catch-up metrics were found. |
| Recurring materialization audit evidence | MISSING | No generation decision record exists. |
| Recurring materialization integration tests | MISSING | Existing tests cover manual creation and interval validation only. |

## Architectural interpretation

The existing implementation is complete for execution of an occurrence that
already exists.

It is not complete for producing the recurring occurrences required by an
interval schedule.

The missing capability is therefore not:

- dispatch,
- provider execution,
- governance,
- retry,
- scheduler polling,
- claim handling, or
- worker integration.

The missing capability is the narrow boundary between:

1. a durable active interval schedule, and
2. the durable occurrence records that must be generated from that schedule.

## Required Phase 19C contract

Phase 19C must define a recurring occurrence generation contract before any
implementation begins.

The contract must define:

### Schedule anchor

- The timestamp from which interval progression begins.
- Whether schedule creation time or an explicit activation time is the anchor.
- Whether the anchor remains immutable after pause and resume.

### First occurrence

- Whether an interval schedule creates its first occurrence immediately.
- Whether the first occurrence is scheduled at `anchor + interval`.
- Whether creation and first materialization share one transaction.

### Subsequent occurrence

- Whether the next occurrence is created after the prior occurrence is
  materialized, claimed, completed or terminally failed.
- Whether generation is independent of provider execution success.
- How the next deterministic scheduled timestamp is calculated.

### Time semantics

- UTC persistence requirements.
- Timezone use.
- Daylight-saving behavior.
- Whether intervals represent elapsed duration or wall-clock recurrence.

### Missed intervals

- Skip all missed intervals.
- Create only the latest due occurrence.
- Create bounded catch-up occurrences.
- Maximum catch-up count.
- Maximum catch-up age.

### Pause and resume

- Whether pause prevents new occurrence generation.
- Whether already-created occurrences remain executable.
- Whether resume continues from the original anchor or resets the anchor.
- Whether elapsed paused intervals are skipped.

### Cancellation

- Cancellation must prevent all future materialization.
- Existing pending occurrences must have an explicit cancellation policy.
- Running occurrences must have an explicit continuation policy.

### Idempotency and concurrency

- Deterministic occurrence identity.
- Database uniqueness boundary.
- Atomic schedule advancement.
- Concurrent worker behavior.
- Crash recovery between occurrence insertion and schedule advancement.
- Repeated materializer invocation behavior.

### Failure handling

- Generation retry behavior.
- Invalid schedule containment.
- Repository failure containment.
- No provider dispatch from the materializer.
- No weakening of existing governance.

### Observability

- Occurrences generated.
- Duplicate generations prevented.
- Missed intervals skipped.
- Catch-up occurrences generated.
- Materialization failures.
- Materialization lag.
- Audit evidence for each generation decision.

### Validation

Required tests must include:

- first interval occurrence,
- second and later occurrences,
- deterministic scheduled timestamps,
- duplicate materializer invocation,
- concurrent materializer invocation,
- pause before next interval,
- resume after elapsed intervals,
- cancellation before next interval,
- worker downtime,
- bounded catch-up,
- timezone handling,
- repository failure,
- restart recovery, and
- preservation of existing one-time schedule behavior.

## Required implementation boundary

Any later Phase 19D implementation must:

- reuse the existing AI schedule repository,
- reuse the existing platform scheduler,
- reuse the existing scheduled occurrence execution pipeline,
- create durable occurrences before platform job registration,
- avoid direct provider dispatch,
- preserve governance and approval rules,
- preserve claim and retry behavior,
- avoid a second polling system,
- avoid new runtime dependencies,
- leave Migration 055 unapplied, and
- use one logical checkpoint per commit.

## Explicitly excluded

Phase 19B does not authorize:

- implementation,
- schema changes,
- Migration 055 execution,
- database mutation,
- dependency installation,
- scheduler replacement,
- provider changes,
- governance changes,
- retry redesign,
- UI work, or
- Phase 20 work.

## Phase 19B conclusion

The Phase 18 warning is confirmed.

Persisting an interval schedule does not currently prove or trigger automatic
recurring occurrence materialization.

Phase 19C is required.

Phase 19C must commit the recurring occurrence generation contract before any
runtime implementation begins.
