# PropertyOS Phase 19D4C2 Scheduler Idempotency Schema Contract

## Status

- Phase 19D4C recurring scheduler handler contract: COMPLETE
- Phase 19D4C next-job idempotency gap contract: COMPLETE
- Phase 19D4C1 exact scheduler schema audit: COMPLETE
- Exact classification: SCHEMA CHANGE REQUIRED
- Scheduler schema implementation: NOT STARTED
- Recurring scheduler handler implementation: BLOCKED
- Migration 055: UNAPPLIED AND IMMUTABLE
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Corrected audit conclusion

The scheduler table currently contains:

- `id`
- `name`
- `job_type`
- `status`
- `payload`
- `schedule_type`
- `run_at`
- `cron_expression`
- `last_run_at`
- `next_run_at`
- `attempts`
- `max_attempts`
- `error_message`
- timestamps

It does not contain:

- `idempotency_key`,
- `external_id`,
- `correlation_id`,
- another durable logical key suitable for recurring next-job identity.

The scheduler repository exposes strict creation only:

```ts
create(job: SchedulerJob): Promise<SchedulerJob>;
```

The PostgreSQL implementation performs an ordinary `INSERT`.

The previous broad static classification was a false positive caused by
idempotency columns and constraints in unrelated tables:

- inventory stock ledger,
- core idempotency requests,
- payments,
- event bus.

Those constraints cannot provide scheduler-job uniqueness.

## Objective

Define one new scheduler schema migration that enables atomic creation or
resolution of a future one-time scheduler job by durable idempotency key.

## Migration identity

The next migration number must be selected from the repository's current
ordered migration sequence at implementation time.

Do not modify:

`055-create-scheduled-ai-execution.sql`

Recommended logical migration name:

`add-scheduler-job-idempotency`

## Schema change

Add one nullable column to `scheduler_jobs`:

```sql
idempotency_key VARCHAR(500) NULL
```

The column is nullable to preserve all historical and ordinary scheduler jobs.

## Unique constraint

Add one partial unique index:

```sql
CREATE UNIQUE INDEX ...
ON scheduler_jobs(idempotency_key)
WHERE idempotency_key IS NOT NULL;
```

Recommended index name:

```text
uq_scheduler_jobs_idempotency_key
```

The exact name must be verified against repository naming conventions before
implementation.

## Data compatibility

The migration must:

- preserve all existing rows,
- require no backfill,
- allow existing jobs to retain `NULL`,
- avoid rewriting historical job identity,
- avoid changing job status,
- avoid changing timestamps,
- avoid changing scheduler worker behavior.

## Application model

Extend `SchedulerJob` with:

```ts
idempotencyKey?: string;
```

Extend `CreateJobDto` with an optional idempotency key only if the public
ordinary create path needs to carry it.

Preferred boundary:

ordinary `createJob(...)` remains unchanged for callers that do not need
idempotency.

## Repository contract

Add one narrow result:

```ts
interface SchedulerJobCreateOrResolveResult {
  job: SchedulerJob;
  created: boolean;
}
```

Add one repository operation equivalent to:

```ts
createOrResolve(
  job: SchedulerJob,
): Promise<SchedulerJobCreateOrResolveResult>;
```

The operation must use the durable idempotency key.

## PostgreSQL behavior

For a non-null idempotency key:

1. attempt atomic insert,
2. use the unique idempotency index as the conflict boundary,
3. return inserted row with `created: true`,
4. on logical-key conflict, load the existing row,
5. return existing row with `created: false`.

The implementation must not rely on:

- read-before-write,
- in-memory locks,
- process-local maps,
- worker identity,
- random retry loops.

## Existing-row preservation

Resolving an existing job must not overwrite:

- status,
- attempts,
- error message,
- last run time,
- next run time,
- payload,
- job type,
- run time,
- timestamps.

The existing durable row is authoritative.

## Logical identity

For recurring materialization, derive:

```text
ai-recurring-materialize:<scheduleId>:<nextScheduledFor>
```

The repository treats this as an opaque string.

The recurring handler owns key derivation.

## Validation

Reject:

- blank idempotency key,
- key longer than the schema limit,
- malformed recurring key when validated at the handler boundary.

Ordinary jobs may omit the key.

## Concurrency

Two concurrent create-or-resolve calls for the same key must produce one
durable scheduler row.

The database unique index is authoritative.

## Error behavior

Propagate unrelated database failures.

Fail closed if:

- insert conflicts but no existing row can be resolved,
- resolved row has a different idempotency key,
- resolved row violates expected logical identity.

## Required tests

### Migration static tests

- migration adds nullable column,
- migration adds partial unique index,
- Migration 055 remains unchanged,
- migration contains no data mutation beyond schema alteration,
- migration order is valid.

### Repository tests

- first insert returns `created: true`,
- repeated insert returns `created: false`,
- concurrent requests produce one durable row,
- existing execution state is preserved,
- unrelated database errors propagate,
- null-key strict creation remains compatible.

### Service tests

- idempotent next-job creation delegates to repository create-or-resolve,
- ordinary createJob remains compatible,
- returned durable job is authoritative.

## Controlled migration rule

The new migration must remain UNAPPLIED after implementation and static
acceptance.

No database may be mutated during Phase 19D4C2.

A later controlled migration checkpoint must explicitly authorize execution.

## Authorized implementation scope

Phase 19D4C2 may change only:

- one new scheduler migration,
- scheduler job type,
- create-job DTO if required,
- scheduler repository interface,
- PostgreSQL scheduler repository,
- scheduler service,
- focused static/repository/service tests.

It must not change:

- Migration 055,
- scheduler worker,
- scheduler handler registry,
- recurring materializer,
- occurrence bridge,
- provider abstraction,
- prompt registry,
- governance,
- package dependencies.

## Commit structure

Use separate logical checkpoints:

1. schema migration contract and static acceptance,
2. repository/service create-or-resolve implementation,
3. recurring scheduler handler implementation.

Do not combine all three into one commit.

## Completion rule

Phase 19D4C2 schema implementation is complete only when:

- a new unapplied migration exists,
- the scheduler idempotency column and unique index are statically proven,
- Migration 055 remains unchanged and unapplied,
- no database is mutated,
- focused static tests pass,
- backend typecheck and build pass,
- exactly one schema checkpoint commit is created,
- repository is clean.

## Next checkpoint

Phase 19D4C2A — Scheduler idempotency migration static contract and
implementation.

Do not begin recurring scheduler handler wiring before repository
create-or-resolve is complete.
