# PropertyOS Phase 19C Recurring Occurrence Generation Contract

## Status

Phase 19A: COMPLETE

Phase 19B: COMPLETE

Phase 19C: COMPLETE WHEN THIS CONTRACT IS COMMITTED

Phase 19D implementation: NOT STARTED

Migration 055: UNAPPLIED

Database mutation: NONE

New runtime dependencies: NONE AUTHORIZED

## Objective

Define the complete contract for deterministic recurring AI occurrence
materialization before any runtime implementation begins.

This contract closes the design gap identified by:

`docs/PHASE_19B_RECURRING_OCCURRENCE_GAP_MATRIX.md`

The implementation must preserve all existing Phase 17 and Phase 18
architecture boundaries.

## Architectural boundary

The recurring occurrence materializer owns only the transition from:

1. an active durable interval schedule, to
2. one or more durable scheduled occurrence records, and
3. registration of those durable occurrences with the existing platform
   scheduler bridge.

The materializer must not own:

- provider selection,
- provider dispatch,
- prompt rendering,
- governance evaluation,
- approval resolution,
- occurrence claiming,
- retry execution,
- backoff calculation,
- attempt recording,
- result persistence,
- platform scheduler polling,
- worker lifecycle, or
- migration execution.

Existing services remain authoritative for those responsibilities.

## Required implementation shape

The implementation must introduce one narrowly scoped service within the
existing scheduled AI execution module.

Recommended logical name:

`AiRecurringOccurrenceMaterializerService`

The service must:

- receive a schedule identity and materialization timestamp,
- load the durable schedule through the existing repository abstraction,
- classify whether materialization is permitted,
- calculate deterministic scheduled timestamps,
- create durable occurrences through the existing lifecycle or repository
  boundary,
- register newly created occurrences through the existing platform scheduler
  bridge,
- return structured materialization evidence, and
- remain idempotent when invoked repeatedly.

It must not introduce:

- another polling worker,
- another scheduler,
- another queue,
- another database connection abstraction,
- another provider abstraction, or
- direct SQL outside the existing repository layer.

## Invocation model

Phase 19D must reuse the existing platform scheduler.

The preferred invocation model is:

1. A platform one-time job invokes the recurring materializer for a specific
   interval schedule.
2. The materializer creates all currently authorized occurrence records,
   subject to the bounded catch-up policy.
3. The materializer registers each newly created occurrence through the
   existing platform scheduler bridge.
4. The materializer registers the next future materialization job for the
   same schedule.
5. The platform scheduler remains responsible for polling, claiming and
   executing all jobs.

The implementation must not add a permanent polling loop to the AI scheduling
module.

## Schedule anchor contract

The recurring interval anchor is the schedule's durable `createdAt` timestamp.

Rules:

- `createdAt` is immutable.
- Pause does not change the anchor.
- Resume does not reset the anchor.
- Retry does not change the anchor.
- Provider execution outcome does not change the anchor.
- Occurrence completion does not change the anchor.
- The interval progression is derived exclusively from the anchor and
  `intervalSeconds`.

For interval index `n`, beginning at `1`:

`scheduledFor(n) = createdAt + n * intervalSeconds`

The implementation must use integer interval indices and must not calculate
the next timestamp from the previous worker execution time.

This prevents cumulative scheduling drift.

## Time contract

All materialization calculations must use absolute elapsed duration.

Rules:

- Persisted timestamps are interpreted as UTC instants.
- `intervalSeconds` represents elapsed seconds.
- The stored schedule timezone remains descriptive schedule metadata.
- Daylight-saving transitions do not change elapsed interval duration.
- No wall-clock calendar recurrence is introduced in Phase 19.
- No cron semantics are introduced in Phase 19.
- No locale-specific date arithmetic is permitted.

The schedule timezone continues to be validated and preserved, but interval
generation does not alter its duration based on timezone transitions.

## First occurrence contract

For an active interval schedule, the first occurrence is scheduled at:

`createdAt + intervalSeconds`

The first occurrence must not be scheduled immediately at creation time.

Schedule creation and first occurrence materialization need not occur in one
transaction.

The materializer must safely create the first occurrence when invoked at or
after its deterministic scheduled timestamp.

Invoking the materializer before the first scheduled timestamp must create no
occurrence and must return the future next-materialization timestamp.

## Subsequent occurrence contract

Subsequent occurrences are independent of prior occurrence execution outcome.

The next occurrence may be materialized whether the previous occurrence:

- succeeded,
- failed,
- exhausted retry,
- required approval,
- was cancelled, or
- remains pending.

Occurrence generation must therefore not be chained to provider completion.

The generation boundary is schedule time, not execution completion.

## Materialization window

Each invocation receives a materialization instant called `now`.

The materializer must identify deterministic interval timestamps satisfying:

- greater than the schedule anchor,
- less than or equal to `now`,
- not already durably represented by an occurrence, and
- permitted by schedule status and catch-up policy.

The materializer must never generate occurrences with a scheduled timestamp
later than `now`.

The next future deterministic interval timestamp must be returned so the
existing platform scheduler can register the next materialization job.

## Missed-run policy

PropertyOS uses bounded latest-window catch-up.

The materializer may create multiple missed occurrences, but only within a
strict configured maximum.

Default contract:

- maximum catch-up occurrences per invocation: `10`,
- minimum permitted value: `1`,
- maximum permitted configured value: `100`,
- default environment variable:
  `AI_SCHEDULE_MAX_CATCH_UP_OCCURRENCES`,
- invalid configuration must fail closed to the default value.

When more intervals are missing than the configured maximum:

1. generate the most recent permitted interval timestamps,
2. do not generate the older skipped interval timestamps,
3. report the number of skipped intervals,
4. preserve the original deterministic anchor, and
5. schedule the next materialization using the next deterministic interval.

The materializer must not loop without a fixed upper bound.

## Pause contract

A paused schedule must not create new occurrences.

When invoked for a paused schedule:

- create no occurrence,
- register no occurrence job,
- register no new materialization job,
- return a paused decision,
- preserve the schedule anchor, and
- leave existing durable occurrences unchanged.

Existing pending or claimed occurrences are not automatically cancelled by
pause.

Pause affects future materialization only.

## Resume contract

Resume restores eligibility from the original immutable anchor.

Elapsed intervals during pause are treated as skipped intervals.

On the first materialization after resume:

- do not recreate every paused interval,
- calculate the latest currently due deterministic timestamp,
- apply the normal bounded catch-up policy only to intervals occurring after
  the schedule's most recently represented occurrence,
- report skipped paused intervals where determinable, and
- preserve the original interval sequence.

Resume must not reset `createdAt`.

## Cancellation contract

A cancelled schedule must never materialize another occurrence.

When invoked for a cancelled schedule:

- create no occurrence,
- register no occurrence job,
- register no new materialization job,
- return a cancelled decision, and
- leave existing occurrence history intact.

Existing occurrence cancellation remains governed by the existing schedule
and occurrence execution lifecycle.

The materializer must not directly rewrite existing occurrence status.

## Completed schedule contract

A completed one-time schedule is outside recurring materialization scope.

An interval schedule must not normally transition to `completed` as a result
of a single successful occurrence.

If an interval schedule is already marked `completed`, the materializer must
fail closed:

- create nothing,
- register nothing,
- return a terminal decision, and
- record diagnostic evidence.

## Deterministic occurrence identity

Generated occurrences require deterministic identity at the logical contract
level.

The unique logical key is:

- `scheduleId`, and
- `scheduledFor`.

Repeated generation attempts for the same schedule and deterministic timestamp
must resolve to the same durable logical occurrence.

Phase 19D must first determine whether Migration 055 already provides or can
support this uniqueness without modification.

Migration 055 must not be changed in the first implementation checkpoint.

If the existing schema cannot guarantee uniqueness, Phase 19D must stop and
produce a separate schema-hardening contract before modifying any migration or
adding a new migration.

No schema assumption may be hidden inside application code.

## Idempotency contract

Repeated materializer invocations with identical inputs must be safe.

For every deterministic timestamp:

- zero occurrences may exist before the first successful materialization,
- exactly one logical occurrence must exist after success,
- repeated invocations must not create an additional logical occurrence,
- repeated platform job registration must not create duplicate executable
  work, and
- the result must identify whether an occurrence was created or already
  existed.

An occurrence existence check without a durable uniqueness boundary is not
sufficient for concurrent correctness.

## Concurrency contract

Two workers may invoke materialization for the same schedule concurrently.

The implementation must guarantee:

- no duplicate logical occurrence,
- no duplicate next-materialization job,
- no schedule drift,
- no unbounded retry loop,
- no reliance on in-memory locks, and
- deterministic results after transaction retry.

The concurrency boundary must be implemented through the existing PostgreSQL
repository and durable constraints or atomic statements.

Process-local mutexes are forbidden as the correctness mechanism.

## Transaction contract

For each deterministic occurrence timestamp, durable occurrence creation and
the corresponding materialization decision must be atomic.

Preferred boundary:

1. insert or resolve the deterministic occurrence,
2. commit the durable occurrence,
3. register the occurrence with the platform scheduler bridge.

Platform scheduler registration is external to the occurrence repository
transaction.

Therefore registration must be safely repeatable.

A crash after occurrence commit but before bridge registration must be
recoverable by a later materializer invocation.

A crash before occurrence commit must leave no logical occurrence.

## Platform scheduler registration contract

Every newly materialized occurrence must be registered through:

`AiPlatformScheduleBridgeService`

The materializer must not call the scheduler repository directly.

For an occurrence that already exists:

- the materializer may safely request bridge registration again,
- bridge behavior must remain idempotent or deterministically duplicate-safe,
- no duplicate provider execution may result.

The next recurring materialization job must use the existing platform
scheduler service and handler registry.

## Materializer job contract

Phase 19D may introduce one new platform scheduler job type for recurring
materialization.

Recommended logical job type:

`AI_RECURRING_SCHEDULE_MATERIALIZE`

Required payload:

- `scheduleId`
- `requestedAt`
- optional diagnostic correlation identifier

The payload must not contain:

- rendered prompts,
- secrets,
- provider credentials,
- arbitrary code,
- arbitrary command names, or
- unvalidated property actions.

The handler must validate the payload before invoking the materializer.

## Failure contract

The materializer must fail closed.

Failure cases include:

- schedule not found,
- invalid interval,
- invalid timestamp,
- unsupported schedule status,
- repository failure,
- occurrence uniqueness ambiguity,
- bridge registration failure,
- scheduler registration failure, and
- invalid catch-up configuration.

Rules:

- never dispatch directly to an AI provider,
- never weaken governance,
- never silently discard repository failures,
- never generate an unbounded number of occurrences,
- never move the schedule anchor,
- never mutate Migration 055,
- never mark an occurrence successful, and
- never mark an interval schedule completed.

A bridge registration failure after occurrence persistence must be recoverable
through repeated materialization.

## Repository contract

The existing `AiScheduleRepository` remains the persistence abstraction.

Phase 19D may extend it only with narrow recurring-materialization operations.

Permitted contract additions may include:

- lookup of the latest occurrence timestamp for a schedule,
- lookup of an occurrence by schedule and scheduled timestamp,
- atomic create-or-resolve occurrence,
- recurring materialization transaction helper.

The repository must not expose:

- provider dispatch,
- prompt rendering,
- scheduler worker behavior, or
- arbitrary SQL execution.

## Result contract

Materialization must return a structured result containing at least:

- `scheduleId`
- `scheduleStatus`
- `anchor`
- `intervalSeconds`
- `materializedAt`
- `createdOccurrences`
- `existingOccurrences`
- `skippedIntervals`
- `nextScheduledFor`
- `decision`
- `diagnostics`

Permitted decision values:

- `materialized`
- `not_due`
- `paused`
- `cancelled`
- `terminal`
- `no_op`

No secrets, rendered prompts or provider responses may appear in the result.

## Observability contract

The implementation must expose structured diagnostic evidence.

Required counters or equivalent metrics:

- materialization invocations,
- occurrences created,
- existing occurrences resolved,
- intervals skipped,
- catch-up limit reached,
- paused decisions,
- cancelled decisions,
- materialization failures,
- bridge registration failures, and
- materialization lag.

Required structured log fields:

- schedule ID,
- occurrence ID where available,
- scheduled timestamp,
- materialization timestamp,
- interval index,
- decision,
- skipped interval count,
- created occurrence count, and
- error classification.

Logs must not contain:

- provider credentials,
- rendered prompt content,
- user secrets, or
- unredacted sensitive command payloads.

## Configuration contract

Phase 19D may add only narrowly required configuration.

Authorized configuration key:

`AI_SCHEDULE_MAX_CATCH_UP_OCCURRENCES`

Default:

`10`

Range:

`1` to `100`

No external dependency is required.

No additional scheduler polling interval is authorized.

Existing scheduler worker and claim TTL configuration must remain unchanged
unless a separate checkpoint proves a defect.

## Validation contract

Phase 19D must implement validation before runtime wiring.

### Unit-level deterministic calculation cases

- first interval before due,
- first interval exactly due,
- first interval after due,
- second and later interval calculation,
- no cumulative drift,
- UTC timestamp handling,
- daylight-saving boundary with elapsed-duration semantics,
- invalid interval,
- invalid anchor,
- future anchor,
- catch-up limit,
- skipped interval calculation.

### Service integration cases

- active interval creates first occurrence,
- active interval creates subsequent occurrence,
- repeated invocation resolves existing occurrence,
- multiple due intervals create bounded catch-up occurrences,
- older excess intervals are skipped,
- paused schedule creates nothing,
- resumed schedule preserves anchor,
- cancelled schedule creates nothing,
- completed interval fails closed,
- bridge registration occurs after durable creation,
- existing occurrence is safely re-registered,
- bridge failure is recoverable,
- repository failure is contained.

### Concurrency cases

- two concurrent invocations produce one logical occurrence,
- concurrent catch-up produces one occurrence per deterministic timestamp,
- duplicate platform registration is harmless,
- crash-retry after durable occurrence creation,
- crash-retry before durable occurrence creation.

### Regression cases

- one-time schedules remain unchanged,
- existing manual `createOccurrence(...)` remains valid,
- due occurrence discovery remains unchanged,
- claim and reclaim behavior remains unchanged,
- governance remains unchanged,
- retry and backoff remain unchanged,
- platform scheduler metrics remain unchanged,
- scheduler shutdown behavior remains unchanged.

## Implementation checkpoint sequence

Phase 19D must be split into logical commits.

### Phase 19D1 — Deterministic calculation and result contract

Expected scope:

- recurring materialization types,
- deterministic interval calculator,
- unit or integration tests.

No repository or scheduler wiring.

### Phase 19D2 — Repository idempotency boundary

Expected scope:

- repository contract extension,
- PostgreSQL implementation,
- repository-focused tests.

Before implementation, verify whether Migration 055 provides sufficient
durable uniqueness.

If not, stop before code and create a schema-hardening contract.

### Phase 19D3 — Materializer service

Expected scope:

- materializer service,
- bounded catch-up,
- pause/cancel/terminal behavior,
- service integration tests.

No platform handler wiring.

### Phase 19D4 — Platform scheduler integration

Expected scope:

- materializer job type,
- validated handler,
- module registration,
- next-materialization registration,
- integration tests.

### Phase 19D5 — Observability and operational configuration

Expected scope:

- metrics,
- structured diagnostics,
- configuration parsing,
- operational tests and documentation.

Each checkpoint must create exactly one commit.

## Mandatory validation after each implementation checkpoint

Run:

- checkpoint-targeted tests,
- scheduled AI lifecycle tests,
- scheduled occurrence execution tests,
- platform schedule bridge tests,
- occurrence job handler tests,
- prompt registry regressions,
- prompt versioning regressions,
- AI dispatch regressions,
- AI governance regressions,
- scheduler regressions,
- backend typecheck,
- backend build,
- `git diff --check`,
- exact changed-file validation,
- Migration 055 digest validation, and
- final repository cleanliness validation.

Migration 055 must remain unapplied.

## No-dependency rule

No new runtime dependency is authorized.

The deterministic interval calculation requires only native date and numeric
operations.

The existing NestJS, PostgreSQL and scheduler infrastructure must be reused.

## Phase 19C completion rule

Phase 19C is complete when:

- this contract is committed,
- the repository is clean,
- no runtime implementation exists,
- Migration 055 remains unchanged and unapplied,
- no database is mutated,
- no dependency changes exist, and
- Phase 19D1 begins only from the committed contract.

## Phase boundary

Phase 19C does not authorize Phase 20.

Phase 19 must stop after production hardening and a final committed handover.

Phase 20 must begin in a new chat.
