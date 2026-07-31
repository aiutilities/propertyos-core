# PropertyOS Phase 19D3 Recurring Materializer Service Contract

## Status

- Phase 19D1: COMPLETE
- Phase 19D2: COMPLETE
- Phase 19D3 contract: READY
- Runtime implementation: NOT STARTED
- Scheduler wiring: NOT STARTED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Objective

Define the narrow service contract that converts one durable active interval
schedule into durable recurring occurrence records.

Phase 19D3 must reuse:

- the deterministic calculator from Phase 19D1,
- the repository create-or-resolve boundary from Phase 19D2,
- the existing schedule repository,
- the existing occurrence model, and
- the existing platform scheduler bridge only in a later checkpoint.

Phase 19D3 itself does not authorize scheduler job registration.

## Service boundary

Introduce one service:

`AiRecurringOccurrenceMaterializerService`

The service owns only:

1. loading an AI schedule,
2. classifying schedule status,
3. loading the latest represented occurrence timestamp,
4. invoking the deterministic calculator,
5. creating or resolving durable occurrences,
6. returning structured materialization evidence.

The service must not:

- invoke an AI provider,
- render prompts,
- evaluate governance,
- claim occurrences,
- execute occurrences,
- register scheduler jobs,
- poll for work,
- modify retries,
- alter occurrence execution state,
- execute migrations, or
- access the database outside `AiScheduleRepository`.

## Request contract

Recommended request:

```ts
interface AiRecurringMaterializationRequest {
  scheduleId: string;
  materializedAt: string;
  maximumCatchUpOccurrences: number;
}
```

The request must contain no:

- rendered prompts,
- provider credentials,
- arbitrary command names,
- arbitrary code,
- scheduler internals, or
- property-action payloads.

## Result contract

Recommended result:

```ts
interface AiRecurringMaterializationResult {
  scheduleId: string;
  scheduleStatus: AiScheduleStatus;
  anchor: string;
  intervalSeconds: number;
  materializedAt: string;
  createdOccurrences: AiScheduledOccurrence[];
  existingOccurrences: AiScheduledOccurrence[];
  skippedIntervals: number;
  nextScheduledFor?: string;
  decision:
    | "materialized"
    | "not_due"
    | "paused"
    | "cancelled"
    | "terminal";
}
```

The result must contain durable occurrence rows returned by the repository.

## Schedule loading

The service must load the schedule through the existing repository.

If the schedule does not exist, fail closed.

No default schedule may be synthesized.

## Schedule type

Only `interval` schedules are valid input.

For a `once` schedule:

- create nothing,
- return a terminal classification or fail closed according to existing error
  conventions,
- do not alter the schedule,
- do not alter occurrences.

## Status behavior

### Active

For an active interval schedule:

- calculate due deterministic candidates,
- create or resolve each candidate,
- classify each durable row as created or existing,
- preserve calculator order,
- return the next deterministic timestamp.

### Paused

For a paused schedule:

- create nothing,
- return decision `paused`,
- preserve the original anchor,
- preserve existing occurrences,
- return no scheduler side effects.

### Cancelled

For a cancelled schedule:

- create nothing,
- return decision `cancelled`,
- preserve occurrence history,
- return no scheduler side effects.

### Completed

For a completed interval schedule:

- create nothing,
- return decision `terminal`,
- preserve durable state,
- return no scheduler side effects.

## Anchor and interval

The service must use:

- schedule `createdAt` as the immutable anchor,
- schedule `intervalSeconds` as the elapsed-duration interval,
- request `materializedAt` as the calculation instant.

The service must not calculate from:

- the previous worker execution time,
- the previous provider completion time,
- the current system clock implicitly,
- the last retry timestamp.

## Latest represented occurrence

The service requires the latest represented occurrence timestamp for the
schedule.

Phase 19D3 may extend `AiScheduleRepository` with one narrow read operation:

```ts
findLatestOccurrenceForSchedule(
  scheduleId: string,
): Promise<AiScheduledOccurrence | null>;
```

The PostgreSQL implementation must order by:

1. `scheduled_for DESC`
2. stable secondary ordering if required

and return at most one row.

No schema change is authorized.

## Deterministic calculation

The service must delegate all interval calculations to:

`AiRecurringOccurrenceCalculatorService`

The service must not duplicate interval arithmetic.

The calculator result remains authoritative for:

- due interval indices,
- bounded catch-up,
- skipped intervals,
- candidate timestamps,
- next deterministic timestamp,
- materialized/not-due decision.

## Occurrence construction

For each calculator candidate, the service must construct an occurrence using
the existing occurrence contract.

Required properties:

- new UUID occurrence ID,
- schedule ID,
- deterministic interval sequence,
- deterministic `scheduledFor`,
- status `pending`,
- attempt count `0`,
- no claim data,
- no retry data,
- no result,
- no error,
- creation/update timestamps based on `materializedAt`.

The candidate interval index must map to occurrence `sequence`.

## Idempotent persistence

Each candidate must be persisted through:

`createOrResolveOccurrence(...)`

The service must not call strict `createOccurrence(...)` for recurring
materialization.

For each result:

- `created: true` goes to `createdOccurrences`,
- `created: false` goes to `existingOccurrences`,
- the returned durable row is authoritative.

Repeated service invocation must not create duplicate logical occurrences.

## Ordering

Results must preserve ascending deterministic interval order.

Created and existing occurrence collections must each preserve the order in
which candidates were processed.

## Partial failure policy

Phase 19D3 uses fail-fast persistence.

If any repository operation fails:

- stop processing additional candidates,
- propagate the error,
- do not synthesize success,
- do not register scheduler jobs,
- leave previously committed durable rows intact.

Cross-candidate all-or-nothing transaction semantics are not required in this
checkpoint.

A later invocation must safely resolve previously created rows.

## Concurrency

Concurrent service invocations must rely on the Phase 19D2 repository
idempotency boundary.

The materializer must not add:

- in-memory locks,
- process-local mutexes,
- worker ownership,
- scheduler deduplication assumptions.

Concurrency correctness is proven by durable create-or-resolve behavior.

## Time behavior

The service must require an explicit `materializedAt`.

It must not call `Date.now()` internally for calculation semantics.

UUID generation may use the existing platform or Node runtime facility.

All timestamps returned or persisted must be canonical ISO strings.

## Observability boundary

Phase 19D3 may return structured diagnostics in the result.

It must not yet add metrics or platform logs unless already available through
existing conventions.

Dedicated metrics and operational configuration remain Phase 19D5 work.

## Authorized repository extension

Phase 19D3 may add only:

- `findLatestOccurrenceForSchedule(scheduleId)`

to the repository interface and PostgreSQL implementation.

It must not add:

- scheduler repository methods,
- provider methods,
- prompt methods,
- arbitrary history queries,
- migration changes.

## Required tests

### Materializer service tests

- active interval before first due returns `not_due`,
- active interval creates first occurrence,
- active interval creates multiple bounded catch-up occurrences,
- repeated invocation resolves existing occurrences,
- created and existing rows are separated correctly,
- latest represented occurrence is passed to the calculator,
- paused schedule creates nothing,
- cancelled schedule creates nothing,
- completed interval creates nothing,
- one-time schedule is rejected or terminal,
- missing schedule fails closed,
- repository failure propagates,
- candidate order is preserved,
- deterministic interval index maps to occurrence sequence,
- explicit `materializedAt` controls created/updated timestamps.

### Repository read tests

- latest occurrence query returns newest scheduled timestamp,
- latest occurrence query returns null when absent,
- query is limited to one row,
- existing repository behavior remains unchanged.

### Regression requirements

After implementation run:

- Phase 19D3 focused tests,
- all scheduled AI tests,
- prompt regressions,
- dispatch regressions,
- governance regressions,
- scheduler regressions,
- backend typecheck,
- backend build,
- exact changed-file validation,
- Migration 055 digest validation,
- clean repository validation.

## Authorized changed-file scope

Expected Phase 19D3 implementation files:

- materializer service,
- materializer service integration test,
- repository interface,
- PostgreSQL repository,
- repository integration test if required,
- materialization result/request types if required.

No changes are authorized to:

- deterministic calculator behavior,
- occurrence execution service,
- occurrence job handler,
- platform scheduler bridge,
- scheduler worker,
- provider abstraction,
- prompt registry,
- governance,
- package dependencies,
- Migration 055.

## Completion rule

Phase 19D3 is complete only when:

- the service materializes durable recurring occurrences,
- repeated invocation is idempotent,
- schedule status boundaries are enforced,
- deterministic calculator reuse is proven,
- latest represented occurrence lookup exists,
- all focused and regression tests pass,
- backend typecheck and build pass,
- Migration 055 remains unchanged and unapplied,
- exactly one implementation commit is created,
- repository is clean.

## Next checkpoint

After Phase 19D3 implementation:

Phase 19D4 — Platform scheduler integration.

Do not begin scheduler wiring during Phase 19D3.
