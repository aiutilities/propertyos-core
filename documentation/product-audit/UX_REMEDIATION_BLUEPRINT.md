# PropertyOS UX Remediation Blueprint

## Status

- Phase: 21C6
- Status: Approved design contract
- Scope: Root, login, administration shell and dashboard
- Implementation authorization: Not granted by this document
- Pilot authorization: Absent
- Production authorization: Absent

## Objective

Establish one coherent product-experience contract before modifying frontend
components.

This blueprint governs the first remediation sequence:

1. Administration shell and navigation
2. Dashboard
3. Login
4. Landing page
5. Reusable page patterns
6. Remaining audited routes

## Design Principles

### Operational clarity

Every screen must answer:

- Where am I?
- What requires attention?
- What can I do next?
- What changed recently?
- What happens after this action?

### Progressive disclosure

Primary actions and daily work remain visible.

Advanced configuration, platform administration and developer tooling remain
available without dominating the everyday property-manager experience.

### Role separation

Resident navigation and administrator navigation must not appear together in
the same primary sidebar.

### Consistency

Every module must use shared patterns for:

- page headers
- breadcrumbs
- buttons
- cards
- tables
- forms
- filters
- badges
- empty states
- loading states
- error states
- success feedback

### Accessibility

All remediated components must preserve:

- keyboard navigation
- visible focus states
- semantic headings
- labelled controls
- sufficient contrast
- descriptive link and button text
- responsive usability

## Visual Foundation

### Spacing scale

Use an eight-pixel base scale:

- 4 px: compact inline spacing
- 8 px: control spacing
- 16 px: component spacing
- 24 px: card spacing
- 32 px: section spacing
- 48 px: major-page spacing

### Typography hierarchy

- Page eyebrow: context
- Page title: primary destination
- Page description: purpose and current scope
- Section title: operational grouping
- Card title: metric or action
- Supporting text: explanation
- Metadata: secondary detail

A page must not render duplicate top-level headings.

### Surface hierarchy

Use three levels:

1. Application background
2. Page sections
3. Interactive cards, tables and forms

Avoid excessive borders. Use spacing, grouping and subtle surface contrast.

### Status language

Statuses must be understandable without colour alone.

Standard semantic groups:

- Success
- Information
- Warning
- Critical
- Neutral
- Inactive

## Administration Shell Contract

### Sidebar objectives

The sidebar must:

- prioritise administrator workflows
- separate resident experiences
- use collapsible domain groups
- preserve active-route visibility
- avoid duplicate labels
- avoid continuous unstructured scrolling
- support keyboard navigation
- remain usable on smaller screens

### Proposed administrator groups

#### Overview

- Dashboard
- Notifications
- Operations Center

#### Property

- Properties
- Tenants
- Leases
- Visitors
- Reservations

#### Service Operations

- Maintenance
- Helpdesk
- Facilities and Assets
- Staff
- Vehicles
- Access Control
- Security

#### Finance

- Rent Ledgers
- Receipts
- Invoices
- Reports

#### Procurement

- Procurement Dashboard
- Purchase Requests
- RFQs
- Quotations
- Comparison
- Purchase Orders
- Goods Receipts
- Invoice Matching
- Payment Requests
- Vendors

#### Inventory

Inventory routes must be grouped under one dedicated section when their
frontend navigation is introduced or expanded.

#### Automation

- Workflows
- Scheduler
- Communications
- Notifications

#### Platform Administration

- Plugins
- Marketplace
- Themes
- Documentation
- Platform settings

### Resident navigation

Resident functionality must use a separate resident shell or resident
navigation context.

Resident routes must not appear as primary administrator navigation items.

### Sidebar behaviour

Desktop:

- persistent sidebar
- collapsible groups
- active item highlighted
- group containing active route expanded
- optional compact mode later

Mobile:

- hidden by default
- accessible through a menu button
- closes after navigation
- focus returns to the menu control

### Top bar

The top bar must contain:

- current section title
- optional property context
- notification entry point
- authenticated-user menu
- logout action

The page body must not repeat the same title already displayed by the shell
unless the page header adds meaningful context.

## Dashboard Contract

### Primary purpose

The dashboard is the daily operational command centre.

It must prioritise action and exceptions before aggregate totals.

### Dashboard hierarchy

#### Welcome and context

Display:

- time-appropriate greeting
- authenticated user
- selected property or portfolio context
- current date
- concise operational summary

#### Today's priorities

Display actionable items such as:

- overdue rent
- rent due today
- unresolved critical maintenance
- breached or near-breach helpdesk SLAs
- pending procurement approvals
- low-stock items
- arrivals and departures
- leases nearing expiry
- reservations requiring action

Each item must link directly to the relevant filtered workflow.

#### Quick actions

Initial quick actions:

- Add tenant
- Create property
- Record payment
- Raise maintenance request
- Create purchase request
- Receive goods

Quick actions must respect permissions.

#### Portfolio metrics

Retain useful totals such as:

- properties
- spaces
- tenants
- active leases
- occupancy
- outstanding rent

Metrics must include context where possible:

- current value
- comparison period
- trend direction
- meaningful label

#### Financial overview

Display:

- billed amount
- amount collected
- amount outstanding
- collection percentage
- overdue amount
- recent trend

Currency must use the configured property or platform locale.

#### Operations overview

Display:

- open maintenance
- critical maintenance
- open helpdesk tickets
- reservations today
- visitors today
- low-stock alerts

#### Recent activity

Display a chronological summary of meaningful platform activity.

Examples:

- tenant created
- lease activated
- payment recorded
- receipt generated
- maintenance assigned
- purchase order approved
- goods received
- inventory movement posted

#### Platform health

Platform-health information remains available but must not dominate the
property-manager dashboard.

Move detailed platform health to Operations Center when practical.

### Dashboard states

Loading:

- structured skeletons
- no plain loading paragraph

Error:

- clear explanation
- retry action
- unaffected dashboard sections remain visible when possible

Empty:

- explain why no data exists
- provide the correct first action

### Dashboard acceptance requirements

- no duplicate page heading
- primary priorities visible without scrolling on a standard laptop
- every actionable alert links to a workflow
- quick actions permission-aware
- responsive at mobile and tablet widths
- no horizontal overflow
- no console errors
- existing dashboard API compatibility preserved unless separately approved

## Login Contract

### Immediate pilot requirement

Remove browser-visible prefilled credentials.

Email and password fields must initialise as empty strings.

### Required states

- idle
- submitting
- invalid credentials
- network failure
- successful redirect

### Required behaviour

- email input uses email autocomplete
- password input uses current-password autocomplete
- password remains masked
- submit disabled while processing
- errors are announced accessibly
- credentials are never logged
- token is not printed or exposed

### Deferred features

These may be implemented later through separate contracts:

- forgot password
- remember me
- single sign-on
- multi-factor authentication

## Landing Page Contract

### Purpose

Communicate what PropertyOS is within a few seconds.

### Required content

- clear open-source positioning
- supported property and shared-space use cases
- modular and plugin-driven architecture
- operational capabilities
- documentation entry point
- administrator login
- product preview
- repository or community link when public release is authorised

### Pilot priority

Landing-page enhancement is lower priority than login safety, navigation and
dashboard usability.

## Reusable Page Contract

Every operational list page should provide:

- page title
- concise description
- primary action
- search when useful
- relevant filters
- active-filter summary
- table or content view
- pagination when required
- purposeful empty state
- loading state
- error state
- permission-aware actions

Every form page should provide:

- clear purpose
- grouped fields
- required-field indication
- inline validation
- submission state
- cancel or return action
- preserved input after recoverable errors
- clear success destination

Every detail page should provide:

- identity and current status
- primary actions
- related records
- lifecycle or activity history
- audit context when appropriate
- return navigation

## Implementation Sequence

### Phase 21C7

Remove prefilled login credentials and add regression coverage.

### Phase 21C8

Refactor the administration navigation into coherent domain groups.

### Phase 21C9

Redesign the dashboard information hierarchy using existing data first.

### Phase 21C10

Improve dashboard states, quick actions and operational links.

### Phase 21C11

Enhance the landing page.

### Phase 21C12

Re-audit root, login and dashboard.

No remaining route may inherit a new design pattern until the first three
routes pass re-audit.

## Defect Mapping

### UX-001

Prefilled administrator credentials.

Resolution phase: 21C7.

### UX-002

Dashboard lacks actionable priorities.

Resolution phases: 21C9 and 21C10.

### UX-003

Sidebar information architecture is excessive and mixed.

Resolution phase: 21C8.

### UX-004

Landing page does not explain platform differentiation.

Resolution phase: 21C11.

## Non-Goals

This remediation does not authorise:

- backend domain expansion
- database migration
- live pilot deployment
- production deployment
- ForgeOS extraction
- BankOps implementation
- public marketplace launch
- replacement of established backend contracts

## Validation Requirements

Every implementation checkpoint must include:

- exact changed-file scope
- frontend typecheck
- frontend production build
- relevant component or integration tests
- repository-clean validation
- browser re-audit
- defect-status update
- immutable commit

## Next Checkpoint

Phase 21C7 — Login Credential Safety Remediation.
