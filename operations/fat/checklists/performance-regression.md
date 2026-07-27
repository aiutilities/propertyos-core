# PropertyOS FAT — Performance Regression

## Preconditions

- [ ] Isolated production build is running.
- [ ] Phase 17D performance contract is available.
- [ ] Benchmark rate-limit override is isolated.
- [ ] Normal runtime configuration remains unchanged.

## Acceptance Checks

- [ ] Health summary workload passes.
- [ ] Liveness workload passes.
- [ ] Readiness workload passes.
- [ ] Concurrency 1 passes.
- [ ] Concurrency 5 passes.
- [ ] Concurrency 10 passes.
- [ ] Failure ratio remains zero.
- [ ] No environment-rate-limit failure occurs.
- [ ] Latency thresholds pass.
- [ ] Result report validates against the baseline contract.

## Evidence

- [ ] Performance report is preserved.
- [ ] Result groups are recorded.
- [ ] Threshold failures are recorded.
- [ ] Founder result is recorded.

## Safety Boundary

Performance testing must not run against public production.
