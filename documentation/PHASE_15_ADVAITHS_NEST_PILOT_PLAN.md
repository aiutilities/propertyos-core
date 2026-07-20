# Phase 15 — Advaith's Nest Controlled Pilot

## Status

Phase 14 established MVP pilot readiness but did not authorize a live
deployment, database migration, executor exposure, or external WhatsApp
message.

Phase 15 prepares and conducts the first controlled operational pilot at
Advaith's Nest.

Current state:

- Repository checkpoint before Phase 15B3:
  `a500ccd53b754aad0eb666a9d0f0cb3f5ad583f2`
- Source database state: `1|37|0`
- Controlled migration range: `037–049`
- Controlled migrations in the range: 13
- Controlled migrations applied to the source database: 0
- WhatsApp executor exposed: false
- Explicit live authorization present: false
- External WhatsApp message sent: false

Pilot readiness is not live authorization.

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
3. One approved real HTTPS provider endpoint
4. One securely supplied provider token
5. One named operator
6. One separate approver
7. One separate reconciliation owner
8. One execution request
9. A maximum of one delivery attempt
10. Post-delivery reconciliation before any further action

The initial pilot does not require Inventory UI completion.

## Explicitly deferred work

The following work remains outside the initial controlled pilot:

- Inventory frontend
- Broader frontend interaction and browser automation coverage
- Production application of migrations 037–049
- General commercial rollout
- Long-lived feature-branch merge and release
- Multi-model AI orchestration

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

## Authorization boundary

Nothing in Phase 15A or Phase 15B authorizes:

- Applying migrations 037–049 to the source or production database
- Exposing the WhatsApp executor
- Supplying a live provider token
- Contacting a real provider endpoint
- Sending a WhatsApp message
- Retrying an ambiguous delivery
- Deploying to production

Each live action requires its own explicit authorization and evidence.
