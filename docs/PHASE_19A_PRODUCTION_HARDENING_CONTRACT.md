# PropertyOS Phase 19A Production Hardening Contract

## Status

Phase 17: COMPLETE

Phase 18: COMPLETE

Phase 19: CONTRACT DEFINED; IMPLEMENTATION NOT STARTED

Controlling handover:

`docs/PHASE_18_HANDOVER_FINAL.md`

## Objective

Phase 19 prepares the existing PropertyOS implementation for controlled
production use without rebuilding completed Phase 17 or Phase 18
capabilities.

Phase 19 is a production-hardening phase. It must preserve the architecture,
contracts, provider abstraction, governance boundaries, scheduler integration
and validation strategy established through Phase 18.

## Immutable completed boundaries

Phase 19 must not rebuild, replace or redesign:

- Prompt registry
- Prompt semantic versioning
- Prompt rendering
- Scheduled AI execution contracts
- Scheduled AI repository lifecycle
- Dispatch and command registration
- Governance and approval evaluation
- Retry and backoff lifecycle
- Attempt persistence
- Platform scheduler bridge
- Platform worker integration
- Atomic occurrence claim behavior
- Migration 055 static acceptance
- Existing AI SDK boundaries
- Existing provider abstraction
- Existing scheduler polling, overlap prevention, metrics or shutdown behavior

Any change touching these boundaries must be strictly limited to a confirmed
production-readiness defect and must preserve all existing contracts.

## Database boundary

Migration 055 exists and remains unapplied.

Phase 19A does not authorize:

- Migration execution
- Database mutation
- Production database access
- Isolated migration execution
- Schema repair
- Migration rewriting
- Migration renumbering
- Destructive database operations

A later isolated migration checkpoint may be proposed only after:

1. static preflight validation,
2. explicit isolated-environment definition,
3. backup and restore evidence requirements,
4. rollback and failure-containment contract,
5. exact migration digest validation, and
6. explicit human authorization.

Production execution requires a separate later authorization.

## Confirmed production-readiness concern

The Phase 18 handover confirms:

- recurring interval schedule contracts exist,
- durable interval representation exists, and
- automatic recurring occurrence materialization has not yet been proven.

Persistence of an interval schedule must not be treated as proof that future
occurrences are generated.

Before production use, Phase 19 must determine whether recurring occurrences:

- are materialized automatically,
- are generated deterministically,
- avoid duplicate occurrence creation,
- recover safely after worker downtime,
- respect paused and cancelled schedules,
- preserve timezone and interval semantics,
- avoid unbounded catch-up,
- remain idempotent under concurrent workers, and
- produce complete audit evidence.

No implementation is authorized until this behavior is classified through a
read-only code and test audit.

## Phase 19 scope

Phase 19 is divided into the following contract-first checkpoints.

### Phase 19A — Production-hardening contract

Deliverables:

- Freeze completed Phase 17 and Phase 18 boundaries
- Define production-hardening scope
- Define migration safety boundary
- Identify recurring occurrence materialization as the first audit target
- Define validation and commit rules

Runtime implementation: none.

Database mutation: none.

### Phase 19B — Recurring occurrence materialization audit

Read-only audit of:

- schedule creation
- interval representation
- next-occurrence calculation
- occurrence insertion
- scheduler registration
- scheduler handler invocation
- due-occurrence discovery
- atomic claim behavior
- duplicate protection
- pause, resume and cancellation behavior
- restart and downtime recovery
- concurrency behavior
- associated unit and integration tests

Required output:

A committed gap matrix classifying each capability as:

- COMPLETE
- PARTIAL
- MISSING
- OUT OF SCOPE

No implementation may begin in Phase 19B.

### Phase 19C — Recurring occurrence generation contract

Required only when Phase 19B confirms a partial or missing capability.

The contract must define:

- deterministic interval calculation
- schedule anchor semantics
- first occurrence semantics
- next occurrence semantics
- timezone handling
- missed-run policy
- bounded catch-up policy
- pause and resume semantics
- cancellation semantics
- duplicate prevention
- concurrency and idempotency
- transaction boundary
- failure behavior
- audit evidence
- metrics
- validation cases

No implementation may begin before this contract is committed.

### Phase 19D — Recurring occurrence implementation

Authorized only against the committed Phase 19C contract.

Constraints:

- reuse the existing platform scheduler,
- do not add a parallel polling worker,
- do not bypass the scheduled AI repository,
- do not dispatch providers directly,
- do not weaken governance,
- do not add external scheduling dependencies,
- do not execute Migration 055,
- use one logical checkpoint per commit.

### Phase 19E — Configuration and operational hardening audit

Audit existing production contracts for:

- required environment variables
- startup validation
- secret handling
- logging and redaction
- provider timeout behavior
- scheduler worker configuration
- claim TTL configuration
- retry configuration
- graceful shutdown
- readiness and health integration
- metrics and incident evidence
- deployment documentation

The audit must distinguish genuine gaps from completed Phase 15 production
readiness work.

No implementation before a committed gap matrix.

### Phase 19F — Controlled Migration 055 isolated-readiness contract

This checkpoint may prepare—but must not execute—the isolated migration
procedure.

Required contract:

- exact source and target identity
- expected migration digest
- backup evidence
- restore exercise evidence
- isolated environment requirement
- pre-migration schema checks
- post-migration schema checks
- transaction and rollback behavior
- failure containment
- execution authorization record
- explicit prohibition on production execution

Migration execution remains unauthorized unless separately approved.

### Phase 19G — Production regression and closure

Required validation:

- targeted Phase 19 tests
- prompt registry tests
- prompt versioning tests
- scheduled AI execution tests
- AI controller and runtime regressions
- scheduler regressions
- backend typecheck
- backend build
- migration static acceptance
- no skipped or focused tests within changed scope
- clean repository
- complete Phase 19 handover

Phase 19 must stop before Phase 20.

## Explicit non-goals

Phase 19 does not introduce:

- Natural-language schedule creation
- Calendar synchronization
- Prompt authoring UI
- Schedule administration UI
- Provider-specific scheduling
- Arbitrary shell execution
- Arbitrary code execution
- New AI providers
- New orchestration frameworks
- New queue infrastructure
- New runtime dependencies without explicit approval
- Marketplace feature expansion
- Phase 20 pilot or release work

## Validation-first rule

Before every implementation checkpoint:

1. Validate repository path.
2. Validate branch.
3. Validate expected HEAD.
4. Validate clean working tree.
5. Validate exact changed-file allowlist.
6. Validate Migration 055 digest.
7. Confirm database execution is unauthorized.
8. Run the checkpoint-specific preflight.

After every implementation checkpoint:

1. Run targeted tests.
2. Run relevant AI regressions.
3. Run scheduler regressions when affected.
4. Run backend typecheck.
5. Run backend build.
6. Run `git diff --check`.
7. Validate exact changed-file scope.
8. Confirm Migration 055 remains unchanged and unapplied.
9. Create exactly one commit.
10. Confirm repository cleanliness.

## Dependency rule

No new runtime dependency is authorized by this contract.

A dependency proposal must include:

- exact capability unavailable in the current platform,
- alternatives considered,
- security impact,
- operational impact,
- maintenance impact,
- bundle or runtime impact,
- license,
- test strategy, and
- explicit human approval.

## Commit rule

Each logical checkpoint must produce exactly one commit.

No checkpoint may mix:

- contract definition,
- unrelated implementation,
- migration execution,
- documentation cleanup, or
- opportunistic refactoring.

## Phase 19 completion rule

Phase 19 is complete only when:

- all confirmed production-readiness gaps are closed or explicitly deferred,
- recurring occurrence materialization is proven or implemented,
- Migration 055 has a controlled readiness contract,
- all required regressions pass,
- backend build passes,
- repository is clean,
- a complete Phase 19 final handover is committed, and
- no Phase 20 implementation has begun.

Phase 20 must continue in a new chat.
