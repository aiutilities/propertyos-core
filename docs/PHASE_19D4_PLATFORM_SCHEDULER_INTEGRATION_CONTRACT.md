# PropertyOS Phase 19D4 Platform Scheduler Integration Contract

## Status

- Phase 19D1: COMPLETE
- Phase 19D2: COMPLETE
- Phase 19D3: COMPLETE
- Phase 19D4 contract: READY
- Scheduler integration implementation: NOT STARTED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Objective

Connect recurring AI occurrence materialization to the existing PropertyOS
platform scheduler without introducing a second scheduler, worker, queue or
polling loop.

Phase 19D4 must reuse:

- `AiRecurringOccurrenceMaterializerService`,
- `AiPlatformScheduleBridgeService`,
- the existing scheduler service,
- the existing scheduler handler registry,
- the existing scheduler worker,
- the existing scheduled occurrence execution path.

## Architectural boundary

Phase 19D4 owns only:

1. defining one recurring materialization platform-job payload,
2. validating that payload,
3. registering one handler for that job type,
4. invoking the recurring materializer,
5. registering newly materialized occurrences through the existing bridge,
6. scheduling the next future recurring materialization job.

Phase 19D4 must not:

- add another polling loop,
- add another scheduler worker,
- call AI providers directly,
- render prompts,
- evaluate governance,
- claim occurrences directly,
- execute occurrences directly,
- change retry behavior,
- change occurrence execution,
- change scheduler polling semantics,
- execute migrations,
- mutate the database outside existing repositories.

## Job type

Introduce one platform scheduler job type:

`AI_RECURRING_SCHEDULE_MATERIALIZE`

The identifier must be centralized in the existing scheduled-AI constants or
job-type contract.

No provider-specific job types are authorized.

## Payload contract

Required payload:

```ts
interface AiRecurringScheduleMaterializeJobPayload {
  scheduleId: string;
  requestedAt: string;
  maximumCatchUpOccurrences: number;
}
```

Optional future diagnostic fields are out of scope unless already supported by
existing scheduler conventions.

The payload must not contain:

- rendered prompts,
- provider credentials,
- arbitrary command names,
- arbitrary code,
- arbitrary property actions,
- scheduler repository internals.

## Payload validation

The handler must reject:

- missing schedule ID,
- blank schedule ID,
- invalid requested timestamp,
- missing catch-up limit,
- non-integer catch-up limit,
- catch-up limit below `1`,
- catch-up limit above `100`,
- unexpected payload shape when existing conventions require strictness.

Validation must occur before materializer invocation.

## Handler contract

Introduce one handler:

`AiRecurringScheduleMaterializeJobHandler`

The handler must:

1. validate the platform job payload,
2. call `AiRecurringOccurrenceMaterializerService.materialize(...)`,
3. register each returned durable created occurrence through
   `AiPlatformScheduleBridgeService`,
4. safely re-register returned existing occurrences when required for recovery,
5. schedule the next future materialization job when the result provides
   `nextScheduledFor`,
6. return structured execution evidence.

The handler must not call:

- provider adapters,
- prompt renderer,
- governance services,
- occurrence execution service,
- scheduler repository directly.

## Occurrence registration

Every durable occurrence eligible for execution must be registered through:

`AiPlatformScheduleBridgeService`

The handler must register:

- newly created occurrences,
- existing occurrences returned by the materializer when re-registration is
  needed for crash recovery.

The handler must never construct occurrence execution payloads outside the
bridge.

## Registration ordering

Required order:

1. materializer persists or resolves durable occurrences,
2. handler registers occurrence jobs through the bridge,
3. handler registers the next recurring materialization job.

The next materialization job must not be scheduled before occurrence job
registration attempts complete.

## Existing occurrence recovery

A previous invocation may have persisted an occurrence and crashed before
platform-job registration.

Therefore:

- existing durable occurrences returned by the materializer must be eligible
  for bridge registration,
- duplicate bridge registration must be harmless or deterministically
  duplicate-safe,
- no duplicate AI provider execution may result.

If the existing bridge cannot prove safe re-registration, Phase 19D4 must stop
and define a bridge-idempotency contract before implementation.

## Next materialization scheduling

When materializer result contains `nextScheduledFor` and the schedule is still
eligible:

- create one platform one-time job,
- set its run time to `nextScheduledFor`,
- use job type `AI_RECURRING_SCHEDULE_MATERIALIZE`,
- preserve the schedule ID,
- preserve the configured catch-up limit,
- use a deterministic job identity when supported.

No cron job is introduced.

No recurring scheduler row is introduced.

Each materialization invocation schedules exactly one future one-time
materialization job.

## Status behavior

### Materialized

- register all created and recoverable existing occurrence jobs,
- register the next materialization job.

### Not due

- register no occurrence jobs,
- register the next materialization job.

### Paused

- register no occurrence jobs,
- register no next materialization job.

### Cancelled

- register no occurrence jobs,
- register no next materialization job.

### Terminal

- register no occurrence jobs,
- register no next materialization job.

## Failure contract

Phase 19D4 uses fail-fast orchestration.

If occurrence bridge registration fails:

- propagate the error,
- do not report overall success,
- do not schedule the next materialization job,
- leave durable occurrences intact,
- allow later retry or replay to recover.

If next-materialization registration fails:

- propagate the error,
- leave registered occurrence jobs intact,
- allow later repair or replay.

The handler must not roll back durable occurrence persistence.

## Scheduler service boundary

The handler must use the existing scheduler service, not the scheduler
repository.

The scheduler service remains authoritative for:

- job construction,
- validation,
- persistence,
- job status,
- next-run timestamp,
- scheduler conventions.

No direct SQL is authorized.

## Handler registration

The new handler must be registered through the existing
`SchedulerHandlerRegistry`.

Registration must follow existing module initialization conventions.

No dynamic runtime code loading is authorized.

## Configuration

Phase 19D4 may reuse:

`AI_SCHEDULE_MAX_CATCH_UP_OCCURRENCES`

Default:

`10`

Allowed range:

`1` to `100`

If configuration parsing is not already implemented, Phase 19D4 may add a
narrow parser or use validated payload values.

No new dependency is authorized.

## Idempotency

Repeated execution of the same materialization platform job must be safe.

Safety relies on:

- deterministic calculator timestamps,
- repository create-or-resolve idempotency,
- bridge duplicate safety,
- deterministic next-job identity where supported.

In-memory locks are forbidden.

## Observability

The handler result or structured diagnostics must include:

- schedule ID,
- requested timestamp,
- decision,
- created occurrence count,
- existing occurrence count,
- occurrence registration count,
- skipped interval count,
- next scheduled timestamp.

No secrets, rendered prompt text or provider responses may be logged.

Metrics remain Phase 19D5 unless existing scheduler metrics automatically
cover this handler.

## Required pre-implementation audit

Before Phase 19D4 implementation, verify:

- current scheduler job creation API,
- current deterministic or duplicate job behavior,
- current bridge registration behavior,
- current handler registry conventions,
- current scheduler module wiring,
- current worker invocation semantics.

If bridge or scheduler registration idempotency is unproven, stop and commit a
narrow gap contract before implementation.

## Required tests

### Payload validation

- valid payload accepted,
- missing schedule ID rejected,
- blank schedule ID rejected,
- invalid requested timestamp rejected,
- invalid catch-up limits rejected.

### Handler behavior

- materializer invoked with validated payload,
- created occurrences registered through bridge,
- existing occurrences re-registered for recovery,
- next materialization job registered after occurrence jobs,
- not-due schedules register only next materialization,
- paused schedules register nothing,
- cancelled schedules register nothing,
- terminal schedules register nothing,
- bridge failure prevents next-job registration,
- scheduler failure propagates,
- ordering is deterministic.

### Registration and module tests

- handler job type is registered,
- module exports remain valid,
- scheduler worker can resolve the handler,
- existing occurrence handler remains unchanged.

### Regression requirements

After implementation run:

- Phase 19D4 focused tests,
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

## Authorized changed-file scope

Potential Phase 19D4 files:

- recurring materialization job payload type,
- recurring materialization handler,
- handler integration test,
- scheduled-AI constants,
- AI module registration,
- scheduler module or registry wiring only where required,
- narrow scheduler/bridge test updates.

No changes are authorized to:

- deterministic calculator behavior,
- repository idempotency behavior,
- materializer interval logic,
- occurrence execution logic,
- provider abstraction,
- prompt registry,
- governance,
- scheduler polling algorithm,
- package dependencies,
- Migration 055.

## Completion rule

Phase 19D4 is complete only when:

- the platform scheduler can invoke recurring materialization,
- durable occurrences are registered through the existing bridge,
- next materialization is scheduled as one future one-time job,
- paused/cancelled/terminal schedules stop future registration,
- failure ordering is tested,
- registration idempotency is proven,
- all regressions pass,
- backend typecheck and build pass,
- Migration 055 remains unchanged and unapplied,
- exactly one implementation commit is created,
- repository is clean.

## Next checkpoint

After Phase 19D4 implementation:

Phase 19D5 — Observability and operational configuration.

Do not begin Phase 19D5 during Phase 19D4.
