# PropertyOS Phase 19D4C2B Scheduler Create-or-Resolve Contract

## Status

- Phase 19D4C2 scheduler idempotency schema contract: COMPLETE
- Phase 19D4C2A Migration 056 static acceptance: COMPLETE
- Migration 056: UNAPPLIED
- Phase 19D4C2B implementation: NOT STARTED
- Recurring scheduler handler wiring: BLOCKED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Objective

Implement application-level atomic create-or-resolve behavior for scheduler
jobs that declare a durable idempotency key.

The implementation must reuse:

- Migration 056 nullable `scheduler_jobs.idempotency_key`,
- Migration 056 partial unique index,
- the existing scheduler repository,
- the existing scheduler service,
- the existing scheduler job mapping conventions.

## Scheduler job model

Extend `SchedulerJob` with:

```ts
idempotencyKey?: string;
```

The field is optional.

Historical and ordinary scheduler jobs remain valid without an idempotency key.

## Create DTO

`CreateJobDto` may gain:

```ts
idempotencyKey?: string;
```

The ordinary `createJob(...)` path must remain compatible when the field is
absent.

## Repository result

Introduce:

```ts
interface SchedulerJobCreateOrResolveResult {
  job: SchedulerJob;
  created: boolean;
}
```

The returned durable row is authoritative.

## Repository contract

Add:

```ts
createOrResolve(
  job: SchedulerJob,
): Promise<SchedulerJobCreateOrResolveResult>;
```

The operation is valid only when `job.idempotencyKey` is present and non-blank.

Strict `create(job)` must remain available and compatible.

## PostgreSQL insert behavior

The PostgreSQL implementation must:

1. insert all scheduler columns, including `idempotency_key`,
2. use the Migration 056 unique index as the atomic conflict boundary,
3. return the inserted durable row with `created: true`,
4. resolve an existing row by idempotency key on conflict,
5. return the existing durable row with `created: false`.

Read-before-write is forbidden.

## Conflict handling

Preferred SQL behavior:

```sql
INSERT ...
ON CONFLICT (idempotency_key)
WHERE idempotency_key IS NOT NULL
DO NOTHING
RETURNING ...
```

If no row is returned:

- fetch by idempotency key,
- return the existing row,
- fail closed if no row can be resolved.

The implementation may instead use an equivalent transaction-safe pattern
consistent with current PostgreSQL conventions.

## Existing-row preservation

Resolving an existing job must not modify:

- ID,
- name,
- job type,
- payload,
- schedule type,
- run time,
- cron expression,
- status,
- attempts,
- maximum attempts,
- error message,
- last run time,
- next run time,
- creation or update timestamps.

The existing durable job remains authoritative.

## Strict create compatibility

`create(job)` must:

- continue to insert ordinary jobs,
- include `idempotency_key` when present,
- propagate duplicate-key failures for strict callers,
- preserve current return mapping.

No strict-create behavior may silently become create-or-resolve.

## Scheduler service contract

Add one service operation equivalent to:

```ts
createOrResolveJob(
  dto: CreateJobDto,
): Promise<SchedulerJobCreateOrResolveResult>;
```

Required behavior:

- require a non-empty idempotency key,
- construct one scheduler job using existing creation rules,
- delegate to repository `createOrResolve(...)`,
- return the durable repository result.

Ordinary `createJob(...)` remains unchanged.

## Timestamp behavior

The service must preserve existing rules for:

- `runAt`,
- `nextRunAt`,
- `createdAt`,
- `updatedAt`,
- schedule type defaults,
- maximum attempt defaults.

The create-or-resolve path must not invent different scheduler semantics.

## Validation

Reject:

- missing idempotency key,
- blank key,
- key longer than 500 characters,
- invalid run timestamp under existing DTO rules.

The repository must still fail closed if invoked directly with an invalid key.

## Row mapping

PostgreSQL row mapping must include:

```text
idempotency_key -> idempotencyKey
```

Null database values map to `undefined`.

## Concurrency

Two concurrent calls with the same idempotency key must produce:

- one durable scheduler job,
- no duplicate rows,
- one logical identity.

Application correctness must rely on the database unique index.

## Failure behavior

Propagate unrelated database errors.

Fail closed when:

- insert returns no row,
- no existing job can be resolved,
- idempotency key is invalid,
- resolved row does not match the requested key.

## Required tests

### PostgreSQL repository tests

- first create-or-resolve returns `created: true`,
- repeated request returns `created: false`,
- concurrent requests resolve one durable job,
- existing scheduler state is preserved,
- row mapping includes idempotency key,
- unrelated database error propagates,
- unresolved conflict fails closed,
- strict create remains compatible.

### Scheduler service tests

- create-or-resolve requires idempotency key,
- delegates to repository create-or-resolve,
- uses existing defaults,
- returns durable repository job,
- ordinary createJob remains compatible.

### Regression requirements

After implementation run:

- focused repository and service tests,
- all scheduler tests,
- all scheduled AI tests,
- prompt regressions,
- dispatch regressions,
- governance regressions,
- backend typecheck,
- backend build,
- exact changed-file validation,
- Migration 055 digest validation,
- Migration 056 digest validation,
- clean repository validation.

## Authorized changed-file scope

Phase 19D4C2B may change only:

- scheduler types,
- create-job DTO,
- scheduler repository interface,
- PostgreSQL scheduler repository,
- scheduler service,
- focused repository tests,
- focused service tests.

It must not change:

- Migration 055,
- Migration 056,
- scheduler worker,
- scheduler handler registry,
- recurring materializer,
- occurrence bridge,
- AI provider abstraction,
- prompt registry,
- governance,
- package dependencies.

## Database rule

Migration 056 remains UNAPPLIED.

No database may be mutated during Phase 19D4C2B.

Repository behavior is validated using mocks and static SQL evidence only,
unless a later isolated controlled migration checkpoint explicitly authorizes
database execution.

## Commit rule

Create exactly one logical implementation commit.

Recommended message:

```text
feat(scheduler): add job create-or-resolve idempotency
```

## Completion rule

Phase 19D4C2B completes only when:

- scheduler job model supports optional idempotency key,
- repository create-or-resolve exists,
- PostgreSQL conflict handling is atomic,
- scheduler service exposes create-or-resolve,
- strict create remains compatible,
- concurrency and preservation tests pass,
- all regressions pass,
- backend typecheck and build pass,
- Migration 055 and Migration 056 remain unchanged and unapplied,
- database remains unmodified,
- repository is clean.

## Next checkpoint

After Phase 19D4C2B:

Phase 19D4C3 — Recurring scheduler handler implementation.

Do not begin recurring scheduler handler wiring during Phase 19D4C2B.
