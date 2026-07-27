# PropertyOS FAT — Plugin Lifecycle

## Preconditions

- [ ] Isolated environment is active.
- [ ] Approved test plugin package is available.
- [ ] Previous plugin state is recorded.

## Acceptance Checks

- [ ] Plugin package validation succeeds.
- [ ] Plugin installation succeeds.
- [ ] Plugin activation succeeds.
- [ ] Plugin functionality is available.
- [ ] Plugin deactivation succeeds.
- [ ] Plugin upgrade succeeds.
- [ ] Plugin rollback succeeds.
- [ ] Dependency protection behaves correctly.
- [ ] Uninstall behaves correctly.
- [ ] Invalid or unsafe package is rejected.
- [ ] Readiness reports no failed plugins after cleanup.

## Evidence

- [ ] Package identity and digest are recorded.
- [ ] Lifecycle transitions are preserved.
- [ ] Rejection evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

Only approved isolated test plugins may be installed or executed.
