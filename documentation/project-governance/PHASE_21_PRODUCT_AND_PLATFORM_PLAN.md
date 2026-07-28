# PropertyOS Phase 21 Product and Platform Plan

## Document Status

- Status: Active continuation contract
- Created: 28 July 2026
- Phase 20 closure commit: 38c729367177d4208d510181b917e98fc561f115
- Phase 20 closure tag: phase-20-inventory-fat-complete
- Current canonical phase: Phase 21
- Pilot property: Advaith's Nest
- Runtime authorization: absent
- Pilot authorization: absent
- Production authorization: absent

This document is the persistent strategy and execution reference for future
PropertyOS conversations.

## 1. Current Product Position

PropertyOS has completed its principal platform and domain-engineering
foundation.

Completed foundations include:

- identity, authentication and RBAC
- properties, zones and spaces
- tenants, agreements and leases
- rent ledgers, payments, receipts and invoices
- maintenance and helpdesk
- facilities and assets
- staff, vehicles and access control
- reservations and resident workflows
- communications and notifications
- vendors and procurement
- inventory and stock operations
- documents, forms and storage
- workflows, scheduler and event bus
- configuration, metrics and health
- plugin engine and trust lifecycle
- theme engine
- marketplace foundation
- AI runtime and orchestration
- production contracts and runbooks
- observability
- Founder Acceptance Testing
- immutable acceptance evidence

Phase 20 Inventory FAT closed with:

- 25 of 25 FAT suites passed
- 203 of 203 FAT tests passed
- 23 lifecycle contracts complete
- 34 of 34 coverage flags complete
- immutable evidence snapshot validated
- runtime authorization absent
- production authorization absent
- repository clean and tagged

PropertyOS must now be treated as a product and platform rather than as an
unfinished collection of backend modules.

## 2. Strategic Transition

Phases 1 through 20 optimized for:

- architectural correctness
- domain completeness
- transaction safety
- testing
- governance
- immutable evidence
- operational containment

Phase 21 onward optimizes for:

- product clarity
- daily usability
- coherent navigation
- workflow efficiency
- visual quality
- installation experience
- pilot reliability
- measurable operational value
- adoption
- extensibility

The central question changes from whether the code behaves correctly to
whether a property manager would choose to use PropertyOS every day.

## 3. Product Principles

### 3.1 Freeze unnecessary backend expansion

No major backend module may be added unless it is:

- required for the Advaith's Nest pilot
- required to complete an existing end-to-end workflow
- required for security or reliability
- explicitly approved through governance

### 3.2 Procurement remains the workflow reference

Procurement is the reference implementation for:

- end-to-end lifecycle completeness
- workflow progression
- domain-state visibility
- FAT structure
- idempotency
- evidence capture
- governance
- acceptance closure

### 3.3 Inventory remains the acceptance reference

Inventory is the reference implementation for:

- granular lifecycle contracts
- posting safety
- balance integrity
- Batch handling
- reservations
- insufficient-stock protection
- HTTP idempotency
- immutable acceptance evidence

### 3.4 Pilot requirements take priority

Work that materially improves the Advaith's Nest pilot takes priority over:

- speculative platform features
- additional vertical modules
- premature marketplace work
- BankOps implementation
- premature shared-platform extraction

### 3.5 No architectural deviation

Phase 21 work must preserve:

- modular boundaries
- event-driven integration
- plugin architecture
- platform idempotency
- audit evidence
- authorization gates
- strict repository scope
- small immutable commits
- fail-closed execution

## 4. Definition of Done 2.0

A capability is not pilot-ready merely because backend tests pass.

Pilot readiness requires:

- business logic complete
- persistence complete
- authorization complete
- integration tests complete
- UI route complete
- navigation complete
- empty state complete
- error state complete
- loading state complete
- form validation complete
- responsive usability
- accessibility review
- workflow documentation
- analytics instrumentation
- pilot validation

AI assistance is added only when it materially improves a workflow.

## 5. Phase 21 Workstreams

### Workstream A — Product Experience

Objectives:

- review every major route visually
- classify every screen
- improve the application shell
- improve navigation and grouping
- improve dashboards
- improve empty states
- improve forms and validation
- improve first-run onboarding
- reduce unnecessary clicks
- improve mobile usability
- create consistent reusable components

Screen classifications:

- Production ready
- Functional but needs polish
- Pilot blocker
- Missing
- Not required for pilot

### Workstream B — Pilot Readiness

Objectives:

- reproducible deployment
- environment and secrets inventory
- backup and restore validation
- observability validation
- health and readiness validation
- synthetic pilot dataset
- Advaith's Nest migration plan
- rollback and teardown plan
- explicit runtime authorization workflow
- controlled pilot execution
- daily operational checklist

No live or production mutation may occur without explicit authorization.

### Workstream C — Platform Engineering

Objectives:

- identify reusable platform capabilities
- document vertical and platform boundaries
- avoid premature extraction
- preserve API and event contracts
- extract reusable packages only after pilot validation

Candidate shared capabilities include:

- identity
- RBAC
- audit
- workflow
- event bus
- forms
- documents
- storage
- notifications
- scheduler
- search
- configuration
- metrics
- health
- plugin engine
- marketplace
- AI runtime

### Workstream D — AI Experience

Priority AI experiences include:

- dashboard priorities
- rent and collection insights
- maintenance-pattern detection
- inventory shortage and expiry insights
- procurement comparison insights
- vendor-performance summaries
- natural-language reporting
- contextual action recommendations

AI must not bypass authorization, audit, business rules, transactional
safety, or human confirmation for consequential actions.

## 6. Phase 21 Execution Plan

### Phase 21A — Product Experience Audit

Deliverables:

- verified local runtime
- visual walkthrough of major routes
- screenshots or recording
- route-by-route scorecard
- product gap register
- pilot blocker list
- no speculative feature implementation

### Phase 21B — Product Shell and Design System

Deliverables:

- coherent sidebar grouping
- breadcrumbs
- page headers
- spacing and typography standards
- reusable button, form, table and dialog standards
- loading, error and empty-state standards
- responsive application shell

### Phase 21C — Dashboard and First-Run Experience

Deliverables:

- founder dashboard
- property-manager dashboard
- resident dashboard
- quick actions
- operational priorities
- alerts
- onboarding path
- first-property setup
- first-tenant setup
- import entry points

### Phase 21D — Pilot Workflow Completion

Priority workflows:

1. Property and room setup
2. Tenant onboarding
3. Space allocation
4. Agreement creation
5. Rent generation
6. Payment recording
7. Receipt generation
8. Maintenance request and closure
9. Helpdesk request and closure
10. Vendor and procurement lifecycle
11. Goods receipt and inventory posting
12. Material issue and return
13. Staff and vehicle management
14. Visitor and access workflows
15. Operational reports

### Phase 21E — Pilot Deployment Preparation

Deliverables:

- deployment contract
- environment contract
- secrets contract
- backup contract
- restore rehearsal
- health validation
- observability validation
- synthetic migration rehearsal
- rollback plan
- explicit authorization request

### Phase 21F — Advaith's Nest Controlled Pilot

Pilot rules:

- use real operational workflows
- record every issue
- distinguish defects, UX friction, missing workflows and training issues
- retain rollback capability
- preserve evidence

### Phase 21G — Pilot Stabilization and Closure

Deliverables:

- pilot metrics
- defect register
- UX improvements
- workflow improvements
- performance evidence
- backup and restore evidence
- operational acceptance
- immutable pilot snapshot
- release decision

## 7. Advaith's Nest Pilot Metrics

Measure:

- tenant-onboarding time
- room-allocation time
- rent-generation time
- payment-recording time
- receipt-generation time
- maintenance-resolution time
- inventory-issue time
- inventory-adjustment time
- procurement-cycle time
- report-generation time
- external spreadsheets used
- manual WhatsApp actions
- operational errors
- daily active users
- user satisfaction

A workflow requiring an external spreadsheet is treated as a product gap
unless explicitly excluded from pilot scope.

## 8. Product Experience Priorities

### Priority 1 — Application shell

- sidebar grouping
- coherent navigation
- breadcrumbs
- property context
- user context
- responsive behaviour

### Priority 2 — Dashboard

The dashboard must become the operational command centre with:

- occupancy
- rent due
- overdue rent
- open maintenance
- unresolved helpdesk
- procurement approvals
- inventory alerts
- upcoming renewals
- quick actions
- contextual recommendations

### Priority 3 — Empty states

Every empty state must explain:

- what the module does
- why it matters
- what action to take
- how to import existing data when applicable

### Priority 4 — Forms and workflows

Forms should:

- minimize unnecessary fields
- provide clear validation
- preserve entered data after errors
- use guided steps for complex workflows
- expose next actions after completion

### Priority 5 — Reports and search

Users must be able to find operational information without navigating
through many modules.

## 9. ForgeOS and Cogzidel Platform Direction

The PropertyOS engineering workflow has revealed a future internal
development operating system called ForgeOS.

ForgeOS represents the repeatable discipline used to build PropertyOS:

- governance
- phased execution
- AI-assisted implementation
- repository-scope control
- acceptance contracts
- FAT
- immutable evidence
- authorization gates
- recovery scripts
- release closure

ForgeOS must not be prematurely extracted.

Extraction prerequisites:

1. PropertyOS pilot complete
2. repeated patterns observed in live operation
3. second-product requirements available
4. reusable boundaries demonstrated
5. extraction does not destabilize PropertyOS

Future products may include:

- PropertyOS
- BankOps
- FoodOS
- PortOS
- other vertical operating systems

PropertyOS remains the first reference product.

BankOps must not begin full implementation until the PropertyOS pilot is
stable and the shared-platform boundaries are proven.

## 10. Recommended Strategic Sequence

### 2026–2027

1. Complete the Phase 21 Product Experience Audit.
2. Complete Advaith's Nest pilot readiness.
3. Operate Advaith's Nest using PropertyOS.
4. Stabilize real-world workflows.
5. Prepare the public open-source release.
6. Begin measured ForgeOS extraction.

### 2027–2028

1. Release PropertyOS publicly.
2. Build the initial plugin ecosystem.
3. Validate ForgeOS using a second product.
4. Begin BankOps only on the proven shared foundation.
5. Expand the AI and marketplace ecosystems.

BankOps must not begin full implementation before the PropertyOS pilot
validates the shared architecture and operating model.

## 11. Rules for Future Conversations

Every new PropertyOS conversation must:

1. Read this document first.
2. Treat it as a continuation contract.
3. Verify branch, HEAD, tag and repository cleanliness.
4. Never rediscover completed phases unless validation fails.
5. Use terminal commands only.
6. Use small verifiable checkpoints.
7. Validate exact changed-file scope.
8. Create immutable commits.
9. Preserve the existing architecture.
10. Preserve runtime authorization boundaries.
11. Avoid speculative backend-module expansion.
12. Prioritize product experience and pilot readiness.
13. Use Procurement as the workflow reference.
14. Use Inventory as the FAT and acceptance reference.
15. Keep future recommendations aligned with this plan unless governance
    is explicitly amended.

## 12. Immediate Next Checkpoint

### Phase 21A2 — Product Experience Runtime Foundation

The next checkpoint will:

- validate the closed Phase 20 baseline
- validate backend and frontend build commands
- inspect runtime scripts and ports
- inspect authentication-bootstrap requirements
- identify the safest complete-application launch procedure
- produce repeatable visual-audit runtime commands
- avoid repository mutation

No product code will be modified until the visual audit establishes the
pilot gap register.
