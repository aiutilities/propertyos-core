# PropertyOS Phase 19D4A Worker Handler Resolution Gap Contract

## Status

- Phase 19D4 platform scheduler integration contract: COMPLETE
- Phase 19D4A read-only preflight: COMPLETE
- Preflight classification: PARTIAL
- Runtime implementation: NOT STARTED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Preflight conclusion

The read-only Phase 19D4A audit confirmed:

- scheduler handler registry exists,
- scheduler job creation API exists,
- AI occurrence bridge registration exists,
- bridge duplicate-safety tests exist,
- scheduler duplicate boundary exists,
- worker-to-handler resolution is not yet proven.

The missing production-readiness boundary is narrow:

A due platform scheduler job must resolve its registered job-type handler and
invoke that handler through the existing worker path.

No broader scheduler redesign is authorized.

## Objective

Define the worker-to-handler resolution contract required before recurring AI
materialization can be wired into the platform scheduler.

## Existing boundaries to preserve

Phase 19D4 implementation must preserve:

- existing scheduler polling,
- existing scheduler claiming,
- existing overlap prevention,
- existing worker lifecycle,
- existing scheduler metrics,
- existing shutdown behavior,
- existing scheduler repository,
- existing AI occurrence execution handler,
- existing AI platform schedule bridge,
- existing recurring materializer,
- existing provider and governance boundaries.

## Handler registry contract

The existing `SchedulerHandlerRegistry` remains authoritative for mapping:

- scheduler job type, to
- executable handler.

The recurring materialization handler must be registered using the same
mechanism as existing handlers.

No parallel registry is authorized.

## Worker resolution contract

For every claimed scheduler job, the worker must:

1. read the job type,
2. resolve exactly one handler from the existing registry,
3. fail closed when no handler exists,
4. invoke the resolved handler with the durable job payload,
5. preserve existing completion/failure behavior,
6. preserve existing retry and metrics behavior.

The recurring materialization integration must not bypass this path.

## Unknown handler behavior

If a claimed job type has no registered handler:

- the worker must not execute arbitrary code,
- the worker must not silently mark success,
- the worker must produce a deterministic failure,
- the existing retry/failure lifecycle must remain authoritative,
- diagnostic evidence must include the unknown job type.

## Duplicate registration behavior

Registering the same handler job type more than once must:

- fail deterministically, or
- resolve to the same handler without ambiguity,

according to existing registry conventions.

Silent replacement of a different handler is forbidden.

## Recurring handler registration

The new recurring job type:

`AI_RECURRING_SCHEDULE_MATERIALIZE`

must resolve to:

`AiRecurringScheduleMaterializeJobHandler`

The registration must occur during normal module initialization.

The worker must not instantiate the handler manually.

## Payload boundary

The worker passes the durable job payload unchanged to the resolved handler.

Payload validation remains the handler's responsibility.

The worker must not:

- deserialize arbitrary executable code,
- inject provider credentials,
- infer commands from free text,
- transform the recurring materialization payload.

## Failure propagation

Handler errors must propagate into the existing scheduler failure path.

The worker must not:

- swallow the error,
- report success,
- schedule the next recurring materialization itself,
- invoke AI providers directly.

## Required implementation audit

Before implementation, inspect the exact current:

- `SchedulerHandlerRegistry` API,
- scheduler worker service,
- scheduler module provider wiring,
- existing handler registration pattern,
- existing unknown-handler tests,
- scheduler execution metrics integration.

Implementation must conform to those exact APIs.

## Required tests

### Registry tests

- recurring job type registers successfully,
- recurring job type resolves to the expected handler,
- duplicate conflicting registration fails deterministically,
- unknown job type resolution fails closed.

### Worker tests

- worker resolves a registered handler,
- worker invokes the resolved handler once,
- worker passes the durable payload unchanged,
- handler success follows existing completion behavior,
- handler failure follows existing failure/retry behavior,
- unknown handler produces deterministic failure,
- existing scheduler metrics remain intact.

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

## Authorized implementation scope

Phase 19D4 may change only what is required for:

- recurring materialization job payload,
- recurring materialization handler,
- handler registration,
- worker resolution proof or narrow repair,
- focused tests,
- AI/scheduler module wiring.

No changes are authorized to:

- scheduler polling algorithm,
- scheduler claim semantics,
- scheduler repository schema,
- recurring calculator,
- recurring materializer logic,
- occurrence execution logic,
- provider abstraction,
- prompt registry,
- governance,
- package dependencies,
- Migration 055.

## Stop rule

If the current worker does not support registry-based handler resolution
without architectural redesign, stop before implementation and produce a
separate scheduler-worker integration contract.

## Completion rule

Phase 19D4A is complete when:

- this gap contract is committed,
- repository is clean,
- no runtime implementation exists,
- Migration 055 remains unchanged and unapplied,
- no database is mutated,
- no dependencies change.

The next checkpoint may then perform the exact read-only source audit required
to implement Phase 19D4 safely.
