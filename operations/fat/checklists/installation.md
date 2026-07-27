# PropertyOS FAT — Installation and Bootstrap

## Preconditions

- [ ] Isolated environment is available.
- [ ] Approved source commit is recorded.
- [ ] Required environment variables are present.
- [ ] PostgreSQL is reachable.
- [ ] Test data may be created and removed safely.

## Acceptance Checks

- [ ] Backend dependencies install successfully.
- [ ] Frontend dependencies install successfully.
- [ ] Backend production build passes.
- [ ] Frontend production build passes.
- [ ] Scheduler build artifact exists.
- [ ] Database migration preflight passes.
- [ ] Authorized isolated migrations complete successfully.
- [ ] Backend starts successfully.
- [ ] Scheduler starts successfully.
- [ ] Frontend starts successfully.
- [ ] Liveness returns HTTP 200.
- [ ] Readiness returns HTTP 200.
- [ ] Initial administrative bootstrap completes.

## Evidence

- [ ] Build outputs are preserved.
- [ ] Migration output is preserved.
- [ ] Health responses are preserved.
- [ ] Founder result is recorded.

## Safety Boundary

This checklist authorizes neither production installation nor production migration execution.
