# Release Checklist

## Phase 15 verified release foundation

- [x] Backend consolidated tests pass: 167 suites and 1,261 tests
- [x] Backend typecheck passes
- [x] Backend production build passes
- [x] Frontend typecheck passes
- [x] Frontend pilot contracts pass: 4 tests
- [x] Frontend production build passes: 150 generated pages
- [x] Commit-bound backend Docker image builds
- [x] Active API readiness is healthy
- [x] Metrics routes exist and remain protected
- [x] Scheduler configuration is validated
- [x] Local incident monitoring is installed
- [x] Incident owner is Anand Nataraj
- [x] Backup and isolated restore rehearsal completed
- [x] Controlled migrations 037–049 applied atomically
- [x] Post-migration schema acceptance completed
- [x] Source database state reconciled as `1|50|13`
- [x] Stopped rollback API asset retained
- [x] Phase 15E1 checkpoint tagged

## Phase 15 final operational gates

- [x] Phase 15D private/local provider configuration sealed
- [x] Exactly one local-development webhook attempt executed
- [x] Local workflow error reconciled without automatic retry
- [x] Recipient and credential material excluded from evidence
- [ ] Phase 15D evidence committed and tagged
- [ ] Final Phase 15 closure regression passed
- [ ] Final Phase 15 closure evidence committed and tagged

## Governance boundaries

- [x] Founder-operated pilot uses editable `SOLO_FOUNDER_CONTROLLED` governance
- [x] Commercial production remains blocked
- [x] Future team mode requires `SEPARATION_OF_DUTIES`
- [x] Independent human review is required before broader commercial production
- [x] Phase 16 multi-model AI orchestration remains outstanding

## General release work outside Phase 15

- [ ] Long-lived feature branch reviewed and merged
- [ ] GitHub Actions verified green on the release branch
- [ ] Public installation and deployment documentation completed
- [ ] Report PDF export independently acceptance-tested
- [ ] Report CSV export independently acceptance-tested
- [ ] General commercial release explicitly authorized
