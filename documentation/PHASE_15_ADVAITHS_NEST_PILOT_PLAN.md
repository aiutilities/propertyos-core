# Phase 15 — Advaith's Nest Controlled Pilot

## Status

Phase 14 established MVP pilot readiness but did not authorize a live
deployment, database migration, executor exposure, or external WhatsApp
message.

Phase 15 prepares and conducts the first controlled operational pilot at
Advaith's Nest.

Current verified state:

- Repository checkpoint: `bca69616f2a8607ad50c26183c37c46474be34bd`
- Source database state: `1|50|13`
- Controlled migration range: `037–049`
- Controlled migrations in the range: 13
- Controlled migrations applied atomically to the source database: 13
- Active API readiness: healthy
- Local incident monitoring: loaded
- Incident owner: Anand Nataraj
- Phase 15C2 production configuration readiness: complete
- Phase 15C3 controlled source migrations: complete
- Phase 15E1 consolidated regression: complete
- Phase 15D local-development delivery rehearsal: complete and reconciled
- Local webhook delivery attempts authorized: 1
- Local webhook delivery attempts used: 1
- Local rehearsal outcome: failed closed
- Automatic retry performed: false
- Real WhatsApp message sent: false
- Real WPPConnect pilot: deferred
- Phase 15 overall status: complete as a development milestone

Technical readiness does not authorize message delivery or broader commercial
production.

## Phase 15A audit conclusion

The Phase 15A module-gap audit and consolidated verification completed
successfully.

Verified implementation surfaces:

| Area | Backend | Frontend | Pilot classification |
| --- | --- | --- | --- |
| Visitor | Present | Present | Pilot critical |
| WhatsApp notification | Present | Operationally governed | Pilot critical |
| Staff | Present | Present | Pilot supporting |
| Access Control | Present | Present | Pilot supporting |
| Reservations | Present | Present | Pilot supporting |
| Helpdesk | Present | Present | Pilot supporting |
| Inventory | Present | Not present | Post-pilot product gap |

Verification results at Phase 15A:

- 151 backend suites passed.
- 1,130 backend tests passed.
- Backend typecheck passed.
- Backend build passed.
- Frontend typecheck passed.
- Frontend production build passed.
- 150 frontend routes generated.
- No material TODO, FIXME, WIP, not-implemented, or coming-soon markers were
  found in the audited application source.
- Source database remained `1|37|0`.

## Phase 15B closure work

### Phase 15B1 — Pilot frontend contracts

Completed at:

- Commit: `9496d8d5ed912c6631c2c00b3c2854e458d153bb`
- Tag: `v2.9.84-phase-15b1-pilot-frontend-contracts`

The frontend now has deterministic pilot contract coverage for:

- Visitor operations
- Resident visitor operations
- Security visitor validation
- Staff operations
- Access Control
- Reservations
- Helpdesk
- Protected-route and shell requirements
- Pilot-facing unfinished-marker rejection

### Phase 15B2 — Access credential correction

Completed at:

- Commit: `a500ccd53b754aad0eb666a9d0f0cb3f5ad583f2`
- Tag: `v2.9.85-phase-15b2-access-credential-correction`

The audit found that migration 027 linked
`access_events.credential_id` to the identity authentication table
`credentials`, while `AccessControlService` persists credential identifiers
owned by `access_credentials`.

Migration 049 corrects this without modifying migration 027 or deleting
historical data:

1. The historical column is preserved as `identity_credential_id`.
2. Its reference to `credentials(id)` is preserved.
3. A new `credential_id` references `access_credentials(id)`.
4. Separate indexes protect both lookup paths.

Migration:

`core/049-correct-access-event-credential-reference.sql`

SHA-256:

`83ecdc2f9eb18af52eb4805252584cdfa1ccf59cdecf0c91469b718eacac6845`

Validation:

- Migration applied successfully to an isolated source clone.
- Both foreign keys were verified.
- Both indexes were verified.
- Historical references were preserved.
- The temporary isolated database was removed.
- 153 backend suites passed.
- 1,137 backend tests passed.
- Four frontend pilot contract tests passed.
- Backend/frontend typechecks passed.
- Backend build passed.
- Source database remained `1|37|0`.
- Migration 049 remains unapplied to the source database.

## Phase 15 production-preparation baseline

The governed production-preparation range is now:

1. `037-create-core-inventory-material-issue.sql`
2. `038-create-core-inventory-material-return.sql`
3. `039-create-core-inventory-batch-foundation.sql`
4. `040-add-procurement-batch-receipt-integration.sql`
5. `041-add-inventory-material-issue-batch.sql`
6. `042-add-inventory-material-return-batch.sql`
7. `043-add-inventory-stock-reservation-batch.sql`
8. `044-create-plugin-installation-attempts.sql`
9. `045-add-plugin-migration-integrity.sql`
10. `046-create-plugin-publisher-trust.sql`
11. `047-create-plugin-publication-governance.sql`
12. `048-create-plugin-trust-security-events.sql`
13. `049-correct-access-event-credential-reference.sql`

All 13 migrations remain governed by:

- Immutable SHA-256 verification
- Exact ordering
- Transactional execution
- Backup evidence
- Restore rehearsal
- Isolated-environment-first execution
- Explicit production authorization
- Post-application schema acceptance
- Fail-closed execution
- No automatic retry after ambiguous outcomes

The historical Phase 13 documents remain unchanged. This Phase 15 document
supersedes their migration-range references for the Phase 15 pilot.

## Initial pilot scope

The first Advaith's Nest pilot is intentionally narrow:

1. One consented recipient
2. One approved visitor-related WhatsApp message
3. One configured provider endpoint appropriate to the selected pilot mode
4. Provider credentials supplied only through protected local configuration
5. One accountable operator: `anand-nataraj`
6. One reconciliation owner: `anand-nataraj`
7. Editable `SOLO_FOUNDER_CONTROLLED` governance for the founder-operated pilot
8. A digest-bound, single-use execution request
9. A maximum of one delivery attempt
10. Post-delivery reconciliation before any further action
11. Mandatory transition to `SEPARATION_OF_DUTIES` when the team expands
12. Independent human review before broader commercial production

The initial pilot does not require Inventory UI completion. Solo-founder
governance is a temporary, explicit exception for the founder-operated
Advaith's Nest pilot and must not be represented as independent approval.

## Explicitly deferred work

The following work remains outside the initial controlled pilot:

- Inventory frontend
- Broader frontend interaction and browser automation coverage
- Additional production database migrations beyond the completed 037–049 range
- General commercial rollout
- Long-lived feature-branch merge and release
- Multi-model AI orchestration

## Completed operational preparation

### Phase 15C1 — Backup and restore rehearsal

Completed at:

- Commit: `0d015a78dcf6de12fe17534b35905e1c7b530b58`
- Tag: `v2.9.87-phase-15c1-backup-restore-rehearsal`

A PostgreSQL custom-format backup and persistent-volume archives were
checksummed, restored in isolation, and verified without changing the source
database.

### Phase 15C2 — Production configuration readiness

Completed at:

- Commit: `c32835c95563ddf8a93ecfb61a800310eca84c9e`
- Tag: `v2.9.96-phase-15c2-production-configuration-closure`

The active API now uses a commit-bound image, a rotated production secret,
fail-closed readiness semantics, protected metrics routes, local incident
monitoring owned by Anand Nataraj, and a stopped rollback asset.

### Phase 15C3 — Controlled source migrations

Completed at:

- Commit: `3a393b8ee9eac9d7a08b1eeb63a9fc1b1e082832`
- Tag: `v2.10.0-phase-15c3-source-migrations`

Migrations 037–049 were applied once using the governed
`ATOMIC_CONTROLLED_RANGE` executor. The database transitioned from `1|37|0`
to `1|50|13`. Post-migration reconciliation confirmed the active API and
incident monitor were healthy. Automatic retry is forbidden.

### Phase 15E1 — Consolidated release regression

Completed at:

- Commit: `bca69616f2a8607ad50c26183c37c46474be34bd`
- Tag: `v2.10.1-phase-15e1-consolidated-regression`

Verified results:

- 167 backend suites passed.
- 1,261 backend tests passed.
- Backend typecheck and build passed.
- Frontend typecheck and production build passed.
- Four frontend pilot contracts passed.
- 150 frontend pages were generated.
- Active API readiness and Docker health passed.
- The source database remained `1|50|13`.

Phase 15D remains the final operational sprint. Phase 15 closure evidence and
the final release checkpoint may be created only after Phase 15D is reconciled.

### Phase 15D — Local-development delivery rehearsal

The final operational sprint was explicitly narrowed from a real external
WhatsApp delivery to a local n8n development rehearsal.

Controls applied:

- The recipient was entered privately and stored only in protected artifacts.
- A dedicated Header Auth protected n8n workflow was created.
- The request, configuration, workflow, recipient, message, and endpoint were
  digest-bound.
- Exactly one local invocation was authorized.
- The attempt was reserved before the webhook was contacted.
- Automatic retry was disabled.

Outcome:

- One local webhook attempt was performed.
- n8n recorded the execution as an error because the published execution did
  not find a usable Respond to Webhook node.
- The attempt was consumed.
- No retry was performed.
- No real WhatsApp message was sent.
- The source database remained `1|50|13`.
- The failure was reconciled and closed fail-safe.
- The real WPPConnect delivery pilot remains deferred and requires a new,
  separately authorized future phase.

This outcome closes the Phase 15D development exercise but is not evidence of
successful WhatsApp delivery.

## Phase 15 final closure

Phase 15 is complete as a development milestone.

The closure classification is
`DEVELOPMENT_MILESTONE_COMPLETE_WITH_DEFERRED_EXTERNAL_DELIVERY`.

Completed and verified work includes:

- Phase 15A module and pilot-scope audit
- Phase 15B frontend contracts and access-control correction
- Phase 15C1 backup and restore rehearsal
- Phase 15C2 production-configuration readiness
- Phase 15C3 controlled migrations 037–049
- Phase 15E1 consolidated backend and frontend regression
- Phase 15E2 release-readiness alignment
- Phase 15D exactly-once local-development delivery rehearsal and
  failed-closed reconciliation

The Phase 15D attempt was consumed exactly once. The local n8n workflow did
not provide a successful acknowledgement, no automatic retry was performed,
and no real WhatsApp message was sent.

The real WPPConnect delivery pilot remains deferred. It requires a new,
separately authorized future phase with fresh consent, configuration,
execution limits, and reconciliation evidence.

This closure does not authorize broader commercial production. The editable
solo-founder governance policy continues to require separation of duties when
the team expands and independent human review before broader commercial
production.

Phase 16 multi-model AI orchestration remains outstanding and must not be
reported as complete.

## Phase 16 reminder

Multi-model AI orchestration remains unimplemented and must not be reported as
complete.

Planned providers:

- OpenAI/ChatGPT
- Anthropic/Claude
- DeepSeek
- Qwen

Phase 16 begins only after the operational pilot and stabilization unless the
roadmap is explicitly changed.

## Current authorization boundary

The controlled application of migrations 037–049 was separately authorized,
executed once, reconciled, and closed in Phase 15C3. That authorization is
consumed and does not authorize another migration invocation.

The completed Phase 15C and Phase 15E1 work does not authorize:

- Exposing or invoking the WhatsApp executor
- Supplying provider credentials outside protected local configuration
- Contacting a provider endpoint
- Sending a WhatsApp message
- Performing more than one delivery attempt
- Retrying an ambiguous delivery
- Broader commercial production
- Declaring Phase 15 complete before Phase 15D reconciliation
- Declaring Phase 16 multi-model AI orchestration complete

Phase 15D requires its own configuration seal, execution boundary, exactly-once
attempt control, and permanent reconciliation evidence.
