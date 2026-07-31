# PropertyOS Phase 19D4B Worker Resolution Implementation Contract

## Status

- Phase 19D4 platform scheduler integration contract: COMPLETE
- Phase 19D4A worker handler gap contract: COMPLETE
- Phase 19D4B read-only worker resolution audit: COMPLETE
- Audit classification: INSUFFICIENT
- Worker resolution implementation: NOT STARTED
- Recurring scheduler handler implementation: BLOCKED
- Migration 055: UNAPPLIED
- Database mutation: NONE
- New runtime dependencies: NONE AUTHORIZED

## Audit conclusion

The read-only worker-resolution audit established:

- scheduler handler registry class exists,
- handler registration exists,
- scheduler worker injects the registry,
- scheduler worker resolves a handler,
- scheduler worker invokes the resolved handler,
- explicit registry resolve contract is not exposed or proven,
- unknown-handler fail-closed behavior is not proven,
- worker-handler tests are missing,
- duplicate handler-registration tests are missing.

The current scheduler architecture is reusable.

The missing work is narrow:

1. make handler resolution an explicit, testable registry contract,
2. fail closed for unknown job types,
3. reject ambiguous duplicate registrations,
4. prove the worker invokes the resolved handler through tests.

No scheduler redesign is authorized.

## Objective

Harden the existing scheduler worker-to-handler boundary so recurring AI
materialization can be integrated safely in a later checkpoint.

Phase 19D4B does not add the recurring materialization handler itself.

## Existing architecture to preserve

The implementation must preserve:

- current scheduler polling,
- current due-job selection,
- current job claiming,
- current overlap prevention,
- current worker lifecycle,
- current completion behavior,
- current failure and retry behavior,
- current scheduler metrics,
- current shutdown behavior,
- current scheduler repository,
- current module boundaries,
- current handler interface where compatible.

## Registry resolution contract

`SchedulerHandlerRegistry` must expose one explicit read operation equivalent
to:

```ts
resolve(jobType: string): SchedulerJobHandler
```

or:

```ts
get(jobType: string): SchedulerJobHandler
```

The selected method name must match existing repository conventions.

Required behavior:

- return exactly one registered handler,
- fail deterministically when no handler is registered,
- never return `undefined`,
- never return `null`,
- never silently fall back to another handler,
- never evaluate arbitrary code.

## Unknown handler error contract

Introduce or reuse a deterministic scheduler-domain error.

Recommended logical name:

`SchedulerHandlerNotFoundError`

The error must contain:

- the unresolved job type,
- stable error classification,
- no job payload secrets.

The worker must allow this error to flow through the existing scheduler failure
path.

Unknown job types must never be marked successful.

## Registration contract

Handler registration must be deterministic.

Registering a job type for the first time must succeed.

Registering the same job type again:

- with the same handler instance may be treated as idempotent, or
- may fail deterministically,

according to existing registry style.

Registering the same job type with a different handler must fail
deterministically.

Silent handler replacement is forbidden.

## Duplicate registration error

Introduce or reuse a deterministic error for conflicting registration.

Recommended logical name:

`SchedulerHandlerAlreadyRegisteredError`

The error must include:

- the conflicting job type,
- stable classification,
- no payload or secrets.

## Worker contract

The scheduler worker must:

1. receive a claimed durable job,
2. read its job type,
3. call the explicit registry resolution method,
4. invoke the returned handler exactly once,
5. pass the durable job payload unchanged,
6. preserve existing success handling,
7. preserve existing failure and retry handling,
8. preserve existing scheduler metrics.

The worker must not:

- access the registry's internal map directly,
- instantiate handlers,
- infer a handler from payload content,
- bypass the registry,
- swallow unknown-handler errors,
- invoke AI providers directly.

## Payload contract

The worker must pass the durable scheduler payload to the handler without
semantic transformation.

Infrastructure-level deserialization already performed by the scheduler may
remain unchanged.

No free-text command inference is authorized.

## Failure propagation

A registry resolution failure or handler execution failure must:

- enter the existing worker failure path,
- preserve existing retry policy,
- preserve metrics,
- preserve diagnostic logging conventions,
- never mark the job successful.

The worker must not implement special recurring-AI retry behavior.

## Test-first checkpoint

Implementation must begin with focused contract tests.

### Registry tests

Required:

- registers a handler,
- resolves the registered handler,
- unknown job type fails closed,
- conflicting duplicate registration fails,
- no silent replacement occurs,
- same-instance duplicate behavior is explicit and tested.

### Worker tests

Required:

- resolves handler using the registry,
- invokes resolved handler exactly once,
- passes job payload unchanged,
- successful handler follows existing completion path,
- failing handler follows existing failure path,
- unknown job type follows existing failure path,
- scheduler metrics remain intact,
- existing claim semantics remain unchanged.

## Authorized changed-file scope

Phase 19D4B implementation may change only:

- scheduler handler registry,
- scheduler-domain errors if required,
- scheduler worker only if needed to use explicit resolution,
- focused registry tests,
- focused worker tests,
- narrow scheduler module typing or exports if required.

No changes are authorized to:

- recurring materializer,
- recurring calculator,
- AI schedule repository,
- AI occurrence execution,
- AI platform bridge,
- prompt registry,
- governance,
- provider abstraction,
- scheduler repository schema,
- scheduler polling algorithm,
- package dependencies,
- Migration 055.

## Validation requirements

After implementation run:

- registry-focused tests,
- worker-focused tests,
- all scheduler tests,
- all scheduled AI tests,
- prompt regressions,
- dispatch regressions,
- governance regressions,
- backend typecheck,
- backend build,
- `git diff --check`,
- exact changed-file verification,
- Migration 055 digest verification,
- clean repository verification.

## Commit rule

Phase 19D4B implementation must create exactly one logical commit.

Recommended commit message:

`feat(scheduler): harden worker handler resolution`

No recurring materialization handler wiring may be mixed into this commit.

## Completion rule

Phase 19D4B is complete only when:

- explicit registry resolution exists,
- unknown handlers fail closed,
- conflicting duplicate registration is deterministic,
- worker-resolution behavior is tested,
- worker failure behavior is preserved,
- scheduler metrics remain valid,
- all regressions pass,
- backend typecheck and build pass,
- Migration 055 remains unchanged and unapplied,
- repository is clean,
- exactly one implementation commit is created.

## Next checkpoint

After Phase 19D4B implementation:

Phase 19D4C — Recurring materialization scheduler handler contract and
implementation.

Do not begin recurring scheduler wiring during Phase 19D4B.
