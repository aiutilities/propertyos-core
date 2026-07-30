# PropertyOS Phase 18E - Scheduled AI Execution Contract

## Checkpoint status

Status: CONTRACT DEFINED - IMPLEMENTATION NOT STARTED

Implementation performed: No

Database mutation performed: No

## Controlling gap

Phase 18B confirmed scheduled AI execution as the remaining missing Phase 18
capability.

Prompt registry and prompt versioning were completed in Phase 18D.

This checkpoint defines only the scheduled AI execution contract.

## Objective

Provide a provider-neutral and restart-safe boundary for scheduling AI commands
for future or recurring execution.

The capability must support:

- One-time execution
- Recurring execution
- Deterministic schedule identity
- Explicit command payloads
- Execution eligibility evaluation
- Claiming and concurrency protection
- Retry policy
- Cancellation
- Pause and resume
- Execution history
- Human approval compatibility
- AI governance compatibility
- Existing PropertyOS scheduler integration
- Existing AI command and orchestration integration

## Dependency rule

The implementation must reuse the scheduler, event bus, command, governance,
audit and AI orchestration foundations already present in PropertyOS.

The checkpoint must not introduce a new external scheduler or queue dependency
unless the existing platform scheduler cannot satisfy a documented contract
requirement.

No new dependency is authorized by this contract.

## Architectural ownership

The AI core owns:

- Scheduled AI execution contracts
- AI schedule validation
- AI schedule registry or repository boundary
- Eligibility evaluation
- Execution coordination
- AI command dispatch integration
- Retry classification
- AI schedule audit evidence

The platform scheduler owns:

- Time progression
- Due-job discovery
- Worker invocation
- General scheduling infrastructure
- General job execution lifecycle

AI agents and business modules own:

- Schedule creation requests
- AI command definitions
- Business context
- Domain-specific authorization requirements

## Prohibited behavior

Scheduled AI execution must not:

- Store provider API keys
- Store raw secrets in schedule payloads
- Bypass AI governance
- Bypass human approval requirements
- Execute an arbitrary shell command
- Execute arbitrary JavaScript
- Dispatch an unregistered AI command
- Mutate completed execution history
- Run the same occurrence concurrently
- Retry indefinitely
- Depend on a single AI provider
- Begin Phase 19 work

## Required implementation boundary

The implementation should introduce responsibilities equivalent to these
plain paths:

backend/src/core/ai/scheduling/contracts/
backend/src/core/ai/scheduling/errors/
backend/src/core/ai/scheduling/types/
backend/src/core/ai/scheduling/validation/
backend/src/core/ai/scheduling/registry/
backend/src/core/ai/scheduling/execution/
backend/src/core/ai/scheduling/audit/

Exact filenames may follow existing repository conventions.

## Schedule identity

Every schedule must have a stable identifier.

The identifier must:

- Be unique
- Be immutable
- Be safe for audit logs
- Not contain secrets
- Not depend on provider or model identity

## Schedule types

The initial contract supports:

- One-time schedules
- Recurring interval schedules

Cron syntax may be supported only when the existing platform scheduler already
provides a validated cron abstraction.

Calendar-specific recurrence and natural-language scheduling are non-goals for
the first implementation.

## Schedule manifest

A schedule definition must contain fields equivalent to:

- id
- name
- description
- commandName
- commandPayload
- scheduleType
- runAt or recurrence
- timezone
- status
- retryPolicy
- governanceContext
- createdBy
- createdAt
- optional metadata

## Schedule status

Required statuses:

- active
- paused
- cancelled
- completed

A one-time schedule becomes completed after successful terminal execution.

A recurring schedule remains active until paused or cancelled.

## Execution occurrence

Each scheduled occurrence must have an immutable occurrence identity.

Occurrence state must distinguish:

- pending
- claimed
- running
- succeeded
- failed
- retry_scheduled
- skipped
- cancelled
- approval_required

## Eligibility evaluation

Before execution, the coordinator must verify:

1. The schedule exists.
2. The schedule is active.
3. The occurrence is due.
4. The occurrence is not already terminal.
5. The occurrence is not concurrently claimed.
6. The referenced AI command is registered.
7. Governance permits evaluation.
8. Required human approval is present.
9. Retry limits have not been exceeded.
10. The occurrence is inside its execution window.

A failed eligibility check must not dispatch the AI command.

## Claiming and concurrency

The implementation must provide an atomic claim boundary.

Only one worker may own an occurrence at a time.

A claim must include fields equivalent to:

- occurrenceId
- workerId
- claimedAt
- claimExpiresAt

Expired claims may be reclaimed through an explicit recovery path.

Concurrent duplicate execution must fail closed.

## Command dispatch

Scheduled execution must dispatch only through the existing registered AI
command or orchestration boundary.

It must not call providers directly.

The dispatch request must carry:

- Schedule identity
- Occurrence identity
- Command identity
- Command payload
- Governance context
- Audit correlation identity
- Trigger source set to scheduled execution

## Human approval

A schedule may be registered before approval.

An occurrence requiring approval must enter approval_required state rather
than executing.

Approval must apply to the exact schedule or occurrence defined by governance.

Approval must not be inferred from earlier unrelated executions.

## Retry policy

The initial retry policy must include:

- Maximum attempts
- Initial delay
- Maximum delay
- Backoff strategy
- Retryable failure classification

Required backoff strategies:

- fixed
- exponential

Non-retryable failures must become terminal immediately.

Retry scheduling must remain deterministic and bounded.

## Cancellation

Cancelling a schedule must:

- Prevent future occurrences
- Preserve execution history
- Not erase audit evidence
- Not terminate an already-running command unless an existing safe
  cancellation boundary supports it

## Pause and resume

Pausing must prevent new occurrence dispatch.

Resuming must not automatically replay every missed recurrence.

The implementation must define one explicit missed-occurrence policy.

Recommended initial policy:

- Skip missed recurring occurrences
- Compute the next future occurrence
- Preserve a skipped audit record when applicable

## Timezone behavior

Stored execution times must use an unambiguous representation.

UTC should be used internally.

A declared IANA timezone may be retained for recurrence calculation and audit
display.

Local system timezone must not silently alter schedule behavior.

## Persistence boundary

Scheduled execution requires durable state across application restarts.

The implementation must define persistence for:

- Schedule definitions
- Occurrences
- Claims
- Attempts
- Terminal outcomes
- Cancellation and pause state

A database migration is expected unless the existing platform scheduler
already provides durable storage satisfying these requirements.

Any migration must be contract-first, validated statically and must not be
applied to the source database during the implementation checkpoint.

## Audit requirements

Audit evidence must record:

- Schedule creation
- Schedule update
- Pause
- Resume
- Cancellation
- Occurrence creation
- Claim
- Dispatch
- Approval requirement
- Approval outcome
- Retry decision
- Terminal outcome
- Recovery of expired claim

Sensitive command payload values must be redacted according to existing audit
rules.

## Error taxonomy

Typed errors must distinguish at least:

- Invalid schedule
- Unsupported schedule type
- Invalid recurrence
- Invalid timezone
- Schedule not found
- Schedule already exists
- Schedule not active
- Occurrence not due
- Occurrence already claimed
- Claim expired
- Command not registered
- Approval required
- Retry budget exhausted
- Non-retryable failure
- Invalid state transition

## Public operations

The scheduled AI execution boundary must support operations equivalent to:

- registerSchedule
- getSchedule
- listSchedules
- pauseSchedule
- resumeSchedule
- cancelSchedule
- createDueOccurrence
- claimOccurrence
- executeOccurrence
- recordOutcome
- recoverExpiredClaim
- listExecutionHistory

Exact method names may follow repository conventions.

## Security requirements

The implementation must:

- Validate every schedule before persistence
- Reject unknown AI commands
- Reject executable payload content
- Redact sensitive audit data
- Enforce property and organization scope
- Enforce agent permissions
- Enforce governance decisions
- Enforce human approval requirements
- Use bounded retries
- Prevent concurrent duplicate execution
- Preserve immutable terminal evidence

## Required validation

The implementation checkpoint must test at least:

### Manifest validation

1. Accept a valid one-time schedule.
2. Accept a valid recurring schedule.
3. Reject an invalid schedule identifier.
4. Reject an unsupported schedule type.
5. Reject an invalid execution time.
6. Reject an invalid recurrence.
7. Reject an invalid timezone.
8. Reject an unknown AI command.
9. Reject an unbounded retry policy.
10. Reject secret-like executable payload fields where prohibited.

### Registry and state

11. Register a schedule.
12. Retrieve a schedule.
13. List schedules deterministically.
14. Reject duplicate schedule identity.
15. Pause an active schedule.
16. Resume a paused schedule.
17. Cancel an active schedule.
18. Reject invalid state transitions.
19. Preserve cancelled schedule history.
20. Complete a successful one-time schedule.

### Occurrence lifecycle

21. Create a due occurrence.
22. Do not create an occurrence before due time.
23. Claim an occurrence atomically.
24. Reject a duplicate claim.
25. Recover an expired claim.
26. Mark an occurrence running.
27. Record a successful outcome.
28. Record a failed outcome.
29. Prevent mutation of a terminal occurrence.
30. Prevent concurrent duplicate execution.

### Governance and approval

31. Dispatch through the registered AI command boundary.
32. Prove no direct provider dispatch.
33. Enforce agent permissions.
34. Enforce governance rejection.
35. Record approval_required state.
36. Execute after exact approval.
37. Reject unrelated approval evidence.

### Retry behavior

38. Retry a retryable failure.
39. Do not retry a non-retryable failure.
40. Enforce maximum attempts.
41. Calculate fixed backoff deterministically.
42. Calculate exponential backoff deterministically.
43. Prevent retry after cancellation.

### Scheduling behavior

44. Calculate next recurring occurrence.
45. Preserve UTC execution identity.
46. Apply declared timezone deterministically.
47. Skip missed recurring occurrences according to policy.
48. Avoid duplicate occurrence creation.
49. Preserve occurrence ordering.
50. Record execution history.

### Integration

51. AI module wiring compiles.
52. Scheduler integration is injectable.
53. Existing AI command tests pass.
54. Existing AI governance tests pass.
55. Existing AI audit tests pass.
56. Existing long-running execution tests pass.
57. Backend build passes.
58. No source database migration is applied.

## Acceptance criteria

The implementation checkpoint is complete only when:

- Scheduled AI contracts exist.
- Validation exists.
- Durable schedule state exists.
- Durable occurrence state exists.
- Atomic claiming exists.
- Registered AI command dispatch exists.
- Governance and approvals are enforced.
- Retry behavior is bounded.
- Cancellation, pause and resume exist.
- Audit evidence exists.
- Targeted tests pass.
- Existing AI regressions pass.
- Backend build passes.
- Migration safety is validated.
- No source database is mutated.
- Documentation matches implementation.
- One checkpoint commit is created.
- Repository is clean after commit.

## Explicit non-goals

This checkpoint does not implement:

- Natural-language schedule creation
- Calendar synchronization
- Distributed queue replacement
- Provider-specific scheduling
- Prompt authoring UI
- Workflow authoring UI
- Arbitrary shell execution
- Arbitrary code execution
- Infinite retries
- Native mobile scheduling
- Phase 19 production hardening

## Implementation checkpoint boundary

The next checkpoint may implement only scheduled AI execution according to
this contract.

If implementation requires multiple commits, it must be divided into explicit
contract-first checkpoints with one commit per completed checkpoint.

## Phase transition rule

Phase 19 must not begin in this chat.

When Phase 18 is complete:

1. Stop implementation.
2. Prepare a comprehensive Phase 18 handover.
3. Validate and commit the handover.
4. Ensure the repository is clean.
5. Move Phase 19 to a new chat.
