cat > architecture/004-Core-vs-Plugin-Boundaries.md <<'EOF'
# PropertyOS Core vs Plugin Boundaries

## Purpose

This document defines what belongs inside PropertyOS Core and what must be built as plugins.

This is one of the most important architectural boundaries in PropertyOS.

PropertyOS must remain a platform, not a single-purpose property management application.

---

## Core Principle

PropertyOS Core owns platform infrastructure.

Plugins own business-specific functionality.

Themes own presentation.

Workflows own automation.

Distributions package core, plugins, themes, workflows, and configuration for a specific market.

---

## PropertyOS Core Owns

Core should contain only shared platform capabilities needed by many property types.

### 1. Identity

Core owns:

- Users
- Login
- Sessions
- Roles
- Permissions
- Access control

### 2. Organization

Core owns:

- Organizations
- Organization members
- Organization settings

### 3. Property Structure

Core owns generic physical structure:

- Property
- Building
- Zone
- Space

Core must not assume whether the property is residential, commercial, coworking, campus, industrial, or managed facility.

### 4. People

Core owns generic person records.

Core may know that a person exists.

Plugins define the business meaning of the person.

Examples:

- Resident
- Visitor
- Vendor
- Tenant
- Staff
- Owner

### 5. Event Bus

Core owns:

- Event publishing
- Event subscription
- Event log
- Event retry
- Event standards

### 6. Workflow Engine

Core owns:

- Workflow definitions
- Triggers
- Conditions
- Actions
- Workflow execution status

Plugins may register workflow triggers and actions.

### 7. Notification Engine

Core owns notification infrastructure.

Channels may include:

- WhatsApp
- Email
- SMS
- Push notification

Plugins may request notifications but should not directly bypass the notification engine.

### 8. Plugin Engine

Core owns:

- Plugin installation
- Plugin activation
- Plugin deactivation
- Plugin update
- Plugin rollback
- Plugin configuration
- Plugin permission registration
- Plugin event registration

### 9. Theme Engine

Core owns:

- Theme installation
- Theme preview
- Theme activation
- Theme settings

Themes must not contain business logic.

### 10. API Layer

Core owns public platform APIs.

Plugins must use approved APIs instead of modifying core directly.

### 11. AI Provider Layer

Core owns the AI integration boundary.

AI features should be provider-agnostic and should not lock PropertyOS to one AI vendor.

---

## Plugins Own

Plugins own business-specific capabilities.

A plugin can depend on core infrastructure, but must not modify core directly.

### Visitor Management Plugin

Owns:

- Visitor invitation
- Visitor pass
- QR generation
- Visitor approval
- Check-in
- Check-out
- Visitor history
- Visitor-specific workflows

### Asset Management Plugin

Owns:

- Asset register
- Asset maintenance
- Asset assignment
- Asset inspection
- Asset service history

### Helpdesk Plugin

Owns:

- Complaints
- Tickets
- Requests
- Escalations
- Resolution workflows

### Booking Plugin

Owns:

- Booking rules
- Booking calendar
- Space reservation
- Availability rules
- Booking approvals

### Facility Management Plugin

Owns:

- Maintenance operations
- Service schedules
- Facility tasks
- Vendor work orders

### Community Plugin

Owns:

- Community announcements
- Polls
- Discussions
- Resident engagement
- Community-specific workflows

### Billing Plugin

Owns:

- Invoices
- Charges
- Dues
- Receipts
- Payment rules
- Billing cycles

Billing must not be part of core.

### Marketplace Plugin

Owns:

- Marketplace listings
- Paid plugin discovery
- Plugin purchase flow
- Publisher profiles

Marketplace should not be required for version 0.1.

---

## Themes Own

Themes control presentation and user experience.

Themes may define:

- Layouts
- Visual style
- Branding
- Navigation appearance
- Component presentation

Themes must not define:

- Permissions
- Business rules
- Billing logic
- Approval logic
- Workflow logic
- Database structure

---

## Distributions Own

Distributions package PropertyOS for a specific market.

A distribution may include:

- Default plugins
- Default theme
- Default workflows
- Default settings
- Default terminology

Examples:

- CommunityOS
- CommercialOS
- CoworkOS

A distribution must not fork core unnecessarily.

---

## Boundary Examples

### Example 1: Visitor Entry

Core owns:

- Person record
- Property
- Space
- Event bus
- Notification engine
- Workflow engine
- Permissions

Visitor Plugin owns:

- Visitor invite
- Visitor pass
- QR code
- Check-in rule
- Check-out rule
- Visitor history

### Example 2: Maintenance Complaint

Core owns:

- Person
- Property
- Space
- Event bus
- Workflow engine
- Notification engine

Helpdesk Plugin owns:

- Complaint
- Ticket
- Assignment
- Escalation
- Resolution status

### Example 3: Rent Billing

Core owns:

- Organization
- Property
- Space
- Person
- Notification infrastructure

Billing Plugin owns:

- Invoice
- Charges
- Payment rules
- Receipts
- Dues
- Billing cycles

---

## What Must Never Go Into Core

Core must not directly implement:

- Apartment billing
- Rent collection
- Visitor business rules
- Complaint categories
- Coworking plans
- Commercial lease rules
- Marketplace monetization
- Community polls
- Facility-specific workflows
- Accounting
- CRM
- ERP features

These must be delivered through plugins or distributions.

---

## Version 0.1 Boundary

Version 0.1 Core should include:

- Identity
- Organization
- Property
- Building
- Zone
- Space
- Person
- Role
- Permission
- Event Bus
- Workflow Engine foundation
- Notification Engine foundation
- Plugin Engine foundation
- Theme Engine foundation

Version 0.1 Plugin should include:

- Visitor Management Plugin foundation

Version 0.1 should not include:

- Billing
- Accounting
- Marketplace
- CRM
- Native mobile apps
- Complex SaaS multi-tenancy
- Advanced AI agents

---

## Final Rule

When unsure, ask:

Is this feature required by almost every PropertyOS deployment?

If yes, consider core.

Is this feature specific to a property type, business process, or market?

If yes, make it a plugin.
EOF
