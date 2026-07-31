# PropertyOS Phase 19D5 Recurring AI Observability Contract

## Status

- Phase 19D4C3 recurring scheduler handler: COMPLETE
- Recurring occurrence calculation: COMPLETE
- Repository idempotency: COMPLETE
- Scheduler next-job idempotency: COMPLETE
- Recurring handler registration: COMPLETE
- Phase 19D5 implementation: NOT STARTED
- Migration 055: UNAPPLIED
- Migration 056: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Objective

Add bounded operational observability and configuration visibility for recurring
AI materialization without changing scheduling, execution, governance, provider,
or persistence behavior.

## Observability boundary

Phase 19D5 must expose operational evidence for:

- recurring materialization requests,
- materialization decisions,
- created occurrence count,
- existing occurrence recovery count,
- skipped interval count,
- next scheduled timestamp,
- occurrence bridge registration success and failure,
- next-job create-or-resolve result,
- terminal stop decisions,
- payload validation failures,
- handler execution failures.

## Existing infrastructure first

Before implementation, audit and reuse existing:

- platform logger,
- scheduler execution metrics,
- metrics registry,
- health/readiness reporting,
- configuration conventions,
- environment variable parsing,
- structured log field conventions.

No new metrics library or logging dependency is authorized.

## Structured logging

The recurring handler should emit structured events equivalent to:

```text
ai.recurring.materialization.requested
ai.recurring.materialization.completed
ai.recurring.materialization.stopped
ai.recurring.materialization.failed
ai.recurring.occurrence.registered
ai.recurring.occurrence.registration_failed
ai.recurring.next_job.resolved
ai.recurring.next_job.failed
```

Required fields where applicable:

- schedulerJobId,
- scheduleId,
- requestedAt,
- decision,
- createdOccurrences,
- existingOccurrences,
- skippedIntervals,
- nextScheduledFor,
- nextJobCreated,
- durationMs,
- errorName,
- errorMessage.

Logs must not include:

- prompt content,
- rendered prompt text,
- provider credentials,
- secrets,
- personal data from AI payloads,
- full arbitrary scheduler payloads.

## Metrics

If the existing metrics boundary supports labeled counters or timers, Phase
19D5 should provide equivalent measurements for:

- materialization requests,
- materialization success,
- materialization failure,
- decisions by type,
- occurrences created,
- occurrences recovered,
- intervals skipped,
- occurrence registration failure,
- next-job creation versus resolution,
- handler duration.

Metric labels must remain bounded.

Allowed labels:

- decision,
- outcome,
- jobType,
- errorName.

Forbidden labels:

- scheduleId,
- occurrenceId,
- schedulerJobId,
- timestamps,
- prompt IDs,
- tenant IDs,
- arbitrary error messages.

## Configuration

Define bounded configuration for:

```text
AI_RECURRING_MAX_CATCH_UP_OCCURRENCES
AI_RECURRING_HANDLER_MAX_ATTEMPTS
```

Recommended defaults:

- maximum catch-up occurrences: `10`,
- scheduler handler maximum attempts: `3`.

Validation:

- catch-up minimum: `1`,
- catch-up maximum: `100`,
- handler attempts minimum: `1`,
- handler attempts maximum: `10`.

Existing durable job payload values remain authoritative for already-created
jobs.

Configuration is used only when initially creating recurring materialization
jobs or when a bootstrap path requires defaults.

## Health and readiness

Phase 19D5 may add a read-only readiness component only if the existing health
architecture supports component-level reporting.

A recurring AI readiness component may report:

- handler registered,
- required services constructed,
- configuration valid,
- Migration 055 present but unapplied,
- Migration 056 present but unapplied.

It must not:

- execute migrations,
- query or mutate production schedules,
- create scheduler jobs,
- call AI providers,
- claim occurrences.

## Failure semantics

Observability code must never:

- swallow runtime failures,
- convert failed materialization into success,
- alter scheduler retry behavior,
- change durable state,
- retry independently,
- create duplicate jobs.

Logging or metrics failure must not corrupt the primary scheduling flow.

## Existing behavior preservation

Phase 19D5 must not alter:

- deterministic interval calculation,
- bounded catch-up semantics,
- pause/cancel/terminal behavior,
- occurrence create-or-resolve,
- scheduler create-or-resolve,
- worker claim/retry behavior,
- occurrence execution,
- provider abstraction,
- prompt rendering,
- governance.

## Required audit

Before implementation inspect:

- `ConsolePlatformLogger` and platform logging interfaces,
- scheduler metrics service,
- any general metrics registry,
- health module and readiness contributors,
- environment configuration helpers,
- tests for structured logs and metrics.

## Required tests

### Logging tests

- request event emitted,
- completion event contains bounded operational fields,
- terminal stop event emitted,
- failure event emitted and error rethrown,
- no arbitrary payload content logged.

### Metrics tests

- request counter recorded,
- success counter recorded,
- failure counter recorded,
- decision counter recorded,
- occurrence counts recorded,
- next-job created/resolved result recorded,
- duration recorded,
- labels remain bounded.

### Configuration tests

- defaults accepted,
- lower and upper bounds enforced,
- malformed values fail closed or fall back according to existing convention,
- no environment value changes an already-persisted payload.

### Regression requirements

After implementation run:

- focused observability tests,
- all scheduled AI tests,
- all scheduler tests,
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

Phase 19D5 may change only:

- recurring scheduler handler,
- a narrow recurring AI metrics or observability service,
- AI module provider wiring,
- configuration helper or constants,
- focused observability/configuration tests,
- health/readiness integration only if justified by audit.

It must not change:

- Migration 055,
- Migration 056,
- scheduler repository,
- scheduler worker,
- scheduler handler registry,
- recurring calculator,
- recurring materializer persistence behavior,
- occurrence execution,
- provider abstraction,
- prompt registry,
- governance,
- package dependencies.

## Database rule

Migration 055 and Migration 056 remain UNAPPLIED.

No database may be mutated during Phase 19D5.

## Commit structure

Use separate logical checkpoints:

1. observability contract,
2. read-only observability infrastructure audit,
3. narrow implementation,
4. Phase 19 final closure and handover.

## Completion rule

Phase 19D5 completes only when:

- recurring materialization emits bounded structured logs,
- supported metrics are recorded through existing infrastructure,
- configuration defaults and limits are explicit and tested,
- failures still propagate,
- no secrets or arbitrary payloads are logged,
- all regressions pass,
- backend typecheck and build pass,
- migrations remain unchanged and unapplied,
- repository is clean.

## Next checkpoint

Phase 19D5A — Read-only observability infrastructure audit.

Do not begin implementation before the audit.
