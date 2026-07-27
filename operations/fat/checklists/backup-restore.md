# PropertyOS FAT — Backup and Restore Rehearsal

## Preconditions

- [ ] Isolated environment is active.
- [ ] Authorized synthetic data exists.
- [ ] Backup destination is approved.
- [ ] Restore target is isolated.
- [ ] Data-loss boundary is documented.

## Acceptance Checks

- [ ] Database backup completes.
- [ ] Backup file is non-empty.
- [ ] Backup digest is recorded.
- [ ] Backup format validation passes.
- [ ] Source test data is recorded.
- [ ] Restore into isolated target completes.
- [ ] Restored database connectivity passes.
- [ ] Restored schema state is correct.
- [ ] Controlled record validation passes.
- [ ] Application starts against restored data.
- [ ] Liveness and readiness pass after restore.

## Evidence

- [ ] Backup identity and digest are preserved.
- [ ] Restore logs are preserved.
- [ ] Before-and-after validation is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

This checklist does not authorize production backup replacement or production restore.
