# PropertyOS Phase 19D4C Recurring Scheduler Handler Contract

## Status

- Phase 19D4 platform scheduler integration contract: COMPLETE
- Phase 19D4B worker handler resolution: COMPLETE
- Phase 19D4C contract: READY
- Recurring scheduler handler implementation: NOT STARTED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Objective

Introduce the recurring AI materialization scheduler handler and wire it into
the existing platform scheduler.

The handler must connect:

1. durable scheduler job,
2. recurring materializer,
3. AI platform occurrence bridge,
4. next one-time materialization job.

No second scheduler, queue, polling loop or worker is authorized.

## Job type

Add one centralized scheduler job type:

`AI_RECURRING_SCHEDULE_MATERIALIZE`

The identifier must be used consistently by:

- payload validation,
- handler registration,
- next-job creation,
- tests,
- module initialization.

## Payload contract

```ts
interface AiRecurringScheduleMaterializeJobPayload {
  scheduleId: string;
  requestedAt: string;
  maximumCatchUpOccurrences: number;
}
```

Required validation:

- schedule ID is a non-empty string,
- requested timestamp is valid,
- catch-up value is an integer,
- minimum catch-up value is `1`,
- maximum catch-up value is `100`,
- payload must not contain executable code or provider credentials.

## Handler

Introduce:

`AiRecurringScheduleMaterializeJobHandler`

The handler implements the existing `SchedulerJobHandler` contract.

Its `jobType` must be:

`AI_RECURRING_SCHEDULE_MATERIALIZE`

## Execution flow

The handler must:

1. validate the durable job payload,
2. call `AiRecurringOccurrenceMaterializerService.materialize(...)`,
3. register created occurrences through `AiPlatformScheduleBridgeService`,
4. re-register existing occurrences through the same bridge for recovery,
5. register the next recurring materialization as one future one-time job,
6. return only after all required registration succeeds.

## Occurrence registration

Created and existing durable occurrences returned by the materializer must be
registered through the existing AI platform bridge.

The handler must not:

- create occurrence execution payloads directly,
- call occurrence execution service directly,
- call providers,
- render prompts,
- evaluate governance,
- mutate occurrence execution state.

## Recovery behavior

Existing occurrences may represent a prior crash after durable persistence but
before scheduler registration.

Therefore existing occurrences returned by the materializer must be
re-registered through the bridge.

Bridge duplicate safety remains authoritative.

## Next materialization job

When the materializer returns `nextScheduledFor` for an eligible result, the
handler must create exactly one future platform scheduler job.

The next job must:

- use job type `AI_RECURRING_SCHEDULE_MATERIALIZE`,
- use schedule type `ONE_TIME`,
- run at `nextScheduledFor`,
- preserve schedule ID,
- preserve catch-up limit,
- use `nextScheduledFor` as the next requested timestamp,
- use the existing scheduler service.

No cron or interval scheduler row is authorized.

## Decision behavior

### `materialized`

- register created occurrences,
- register existing occurrences,
- register next materialization job.

### `not_due`

- register no occurrences,
- register next materialization job.

### `paused`

- register nothing,
- schedule nothing.

### `cancelled`

- register nothing,
- schedule nothing.

### `terminal`

- register nothing,
- schedule nothing.

## Ordering

Required order:

1. materialization completes,
2. created occurrences are registered in deterministic order,
3. existing occurrences are registered in deterministic order,
4. next materialization job is scheduled.

The next job must not be scheduled before occurrence registration completes.

## Failure behavior

If occurrence registration fails:

- propagate the error,
- do not schedule the next materialization job,
- preserve durable occurrences,
- allow retry through the scheduler worker.

If next-job creation fails:

- propagate the error,
- preserve already registered occurrence jobs,
- allow retry.

The handler must not swallow failures or report success.

## Handler registration

The handler must register with the existing scheduler handler registry during
normal module initialization.

The hardened registry from Phase 19D4B remains authoritative.

No manual handler instantiation by the worker is authorized.

## Scheduler service boundary

The handler must use the existing `SchedulerService` for next-job creation.

Direct use of the scheduler repository is forbidden.

## Job identity

If the existing scheduler API supports caller-provided deterministic job IDs,
the next recurring job should derive identity from:

- schedule ID,
- next scheduled timestamp.

If the scheduler API does not support deterministic IDs, Phase 19D4C must rely
on existing scheduler duplicate boundaries and prove replay safety in tests.

No schema change is authorized.

## Required pre-implementation audit

Before implementation, inspect the exact current APIs for:

- `AiPlatformScheduleBridgeService`,
- `SchedulerService.createJob(...)` or equivalent,
- scheduler job DTO/type,
- current AI occurrence job-handler registration,
- AI module lifecycle initialization,
- scheduler handler registry registration style.

If next-job duplicate safety cannot be proven, stop and define a narrow
next-job idempotency contract.

## Required tests

### Payload tests

- valid payload accepted,
- missing schedule ID rejected,
- blank schedule ID rejected,
- invalid timestamp rejected,
- catch-up below `1` rejected,
- catch-up above `100` rejected,
- non-integer catch-up rejected.

### Handler tests

- invokes materializer with validated payload,
- registers created occurrences through bridge,
- registers existing occurrences through bridge,
- preserves deterministic registration order,
- schedules next materialization after occurrence registration,
- not-due schedules only the next job,
- paused schedules register nothing,
- cancelled schedules register nothing,
- terminal schedules register nothing,
- occurrence bridge failure prevents next-job scheduling,
- next-job creation failure propagates,
- repeated execution remains duplicate-safe.

### Wiring tests

- handler registers under the recurring job type,
- scheduler registry resolves the recurring handler,
- scheduler worker can invoke the handler,
- existing occurrence handler remains unchanged.

## Authorized changed-file scope

Phase 19D4C may change only:

- recurring job payload types,
- recurring scheduler handler,
- recurring handler integration tests,
- scheduled-AI constants,
- AI module provider/registration wiring,
- narrow scheduler-service or bridge test updates if required.

No changes are authorized to:

- scheduler worker,
- scheduler handler registry,
- scheduler polling,
- scheduler claim semantics,
- recurring calculator,
- recurring materializer logic,
- occurrence execution logic,
- provider abstraction,
- prompt registry,
- governance,
- package dependencies,
- Migration 055.

## Validation requirements

After implementation run:

- Phase 19D4C focused tests,
- all scheduled AI tests,
- all scheduler tests,
- prompt regressions,
- dispatch regressions,
- governance regressions,
- backend typecheck,
- backend build,
- exact changed-file validation,
- Migration 055 digest validation,
- clean repository validation.

## Commit rule

Create exactly one logical implementation commit.

Recommended message:

`feat(ai): integrate recurring materialization scheduler handler`

## Completion rule

Phase 19D4C is complete only when:

- recurring materialization job type exists,
- payload validation exists,
- handler invokes the materializer,
- occurrence jobs register through the bridge,
- next materialization schedules through the scheduler service,
- terminal states stop future scheduling,
- failure ordering is tested,
- handler registration is proven,
- all regressions pass,
- backend typecheck and build pass,
- Migration 055 remains unchanged and unapplied,
- repository is clean.

## Next checkpoint

After Phase 19D4C:

Phase 19D5 — Observability and operational configuration.

Do not begin Phase 19D5 during Phase 19D4C.
