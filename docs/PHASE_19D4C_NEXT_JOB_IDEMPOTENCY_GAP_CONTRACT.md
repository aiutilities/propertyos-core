# PropertyOS Phase 19D4C Next-Job Idempotency Gap Contract

## Status

- Phase 19D4C recurring scheduler handler contract: COMPLETE
- Phase 19D4C API preflight: COMPLETE
- Preflight classification: REVISED TO PARTIAL
- Recurring scheduler handler implementation: BLOCKED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Revised source conclusion

The current scheduler service creates every job with a fresh random UUID.

Its public `createJob(...)` contract exposes no:

- deterministic job ID,
- idempotency key,
- logical external ID,
- create-or-resolve operation,
- duplicate conflict boundary based on job type and run time.

Therefore repeated execution of a recurring materialization handler could
create more than one future materialization job for the same:

- AI schedule,
- next deterministic timestamp.

The earlier static preflight reported duplicate safety because it found generic
database uniqueness and duplicate-related references. That evidence does not
prove logical next-job idempotency.

## Objective

Define the smallest safe boundary for creating or resolving one future
recurring materialization scheduler job.

## Logical identity

The logical identity of a recurring materialization job is:

- job type `AI_RECURRING_SCHEDULE_MATERIALIZE`,
- AI schedule ID,
- requested deterministic timestamp.

Catch-up configuration is payload data, not part of identity.

## Required scheduler service contract

Add one narrow scheduler operation equivalent to:

```ts
createOrResolveOneTimeJob(
  dto: CreateJobDto,
  idempotencyKey: string,
): Promise<{
  job: SchedulerJob;
  created: boolean;
}>;
```

The exact naming may follow current scheduler conventions.

The recurring handler must not call ordinary `createJob(...)` for its next
materialization job.

## Idempotency key

The recurring handler must derive a canonical key from:

```text
AI_RECURRING_SCHEDULE_MATERIALIZE
scheduleId
nextScheduledFor
```

Recommended format:

```text
ai-recurring-materialize:<scheduleId>:<nextScheduledFor>
```

The key must be deterministic and contain no secrets.

## Durable boundary

Application-only read-before-write is insufficient.

The scheduler repository must provide a durable uniqueness boundary or atomic
create-or-resolve operation for the idempotency key.

Before implementation, audit the scheduler schema for an existing reusable
column or constraint.

## Schema stop rule

If the current scheduler table has no reusable durable idempotency column and
unique constraint:

- do not modify Migration 055,
- do not overload unrelated fields,
- do not hide deduplication in the handler,
- stop and define a new scheduler schema migration contract.

Any new scheduler migration must be separate from Migration 055 and remain
unapplied until a controlled migration checkpoint authorizes it.

## Existing create behavior

Ordinary `SchedulerService.createJob(...)` must remain compatible.

Only recurring next-job creation requires the new idempotent boundary.

## Replay behavior

Repeated creation attempts for the same logical identity must return:

- one durable scheduler job,
- `created: true` for the first successful creation where attribution is
  available,
- `created: false` for later resolutions.

No duplicate future materialization job may be persisted.

## Concurrent behavior

Two concurrent attempts for the same logical identity must produce one durable
job.

Correctness must not depend on:

- in-memory maps,
- process-local locks,
- worker identity,
- handler instance identity,
- random retry loops.

## Failure behavior

Fail closed for:

- invalid idempotency key,
- malformed run timestamp,
- repository failure,
- unrelated uniqueness conflict,
- logical identity mismatch.

## Required audit

Before implementation inspect:

- scheduler table columns,
- scheduler migration constraints,
- scheduler repository create method,
- any existing metadata or external ID field,
- current PostgreSQL conflict-handling conventions.

## Required tests

- first creation returns created true,
- repeated creation returns created false,
- concurrent creation produces one durable job,
- existing durable job is not modified,
- ordinary createJob behavior remains unchanged,
- unrelated database failures propagate,
- recurring handler replay schedules only one next job.

## Authorized scope

This gap checkpoint may later change only:

- scheduler job type or DTO if required,
- scheduler repository,
- scheduler service,
- focused repository/service tests,
- a new scheduler migration only after a separate schema contract.

It must not change:

- scheduler worker,
- scheduler handler registry,
- recurring materializer,
- occurrence bridge,
- AI provider boundaries,
- prompt registry,
- governance,
- package dependencies,
- Migration 055.

## Completion rule

This gap contract is complete when:

- it is committed,
- repository is clean,
- no runtime implementation exists,
- Migration 055 remains unchanged and unapplied,
- no database is mutated,
- recurring handler implementation remains blocked pending the schema audit.

## Next checkpoint

Phase 19D4C1 — Read-only scheduler idempotency schema audit.
