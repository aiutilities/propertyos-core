# PropertyOS FAT — Workflow Execution

## Preconditions

- [ ] Isolated environment is active.
- [ ] Test workflow definition exists.
- [ ] Test actors and permissions exist.

## Acceptance Checks

- [ ] Workflow definition can be retrieved.
- [ ] Workflow instance creation succeeds.
- [ ] Valid transition succeeds.
- [ ] Invalid transition is rejected.
- [ ] Unauthorized transition is rejected.
- [ ] Workflow history is recorded.
- [ ] Completion state is recorded.
- [ ] Cancellation behaves correctly where supported.
- [ ] Events are emitted as designed.
- [ ] Metrics are recorded without high-cardinality identifiers.

## Evidence

- [ ] Workflow instance identifier is recorded.
- [ ] Transition history is preserved.
- [ ] Rejection evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

Workflow execution is restricted to isolated FAT definitions and records.
