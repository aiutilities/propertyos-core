# Core Module Blueprint

## Purpose

This document defines the minimum PropertyOS Core modules required before backend development begins.

The goal is to keep PropertyOS Core generic, reusable and plugin-ready.

---

# Core Principle

PropertyOS Core must provide infrastructure.

Plugins must provide business logic.

Core should not contain visitor, rent, maintenance, billing or community-specific workflows.

---

# 1. Identity Module

## Responsibility

The Identity Module manages people, roles, permissions and memberships.

## Core Objects

* Person
* Role
* Permission
* Membership

## Why Membership Is Needed

A person may have different roles in different properties or spaces.

Example:

* Anand may be Owner in one property.
* Anand may be Manager in another property.
* A tenant may be Host in one room.
* A staff member may be Security Personnel for one property.

## APIs

* Create Person
* View Person
* Update Person
* Create Role
* Assign Permission
* Create Membership
* Update Membership
* Revoke Membership

## Events

* person.created
* person.updated
* role.created
* role.updated
* permission.assigned
* membership.created
* membership.updated
* membership.revoked

---

# 2. Property Module

## Responsibility

The Property Module manages physical property structure.

## Core Objects

* Property
* Zone
* Space

## Definitions

## Property

A building, facility, campus, hostel, apartment, commercial complex or managed property.

## Zone

A logical or physical section inside a property.

Examples:

* Block
* Tower
* Floor
* Security Zone
* Wing

## Space

A usable unit inside a property.

Examples:

* Room
* Apartment
* Office
* Cabin
* Shop
* Parking Slot

## APIs

* Create Property
* View Property
* Update Property
* Create Zone
* View Zone
* Update Zone
* Create Space
* View Space
* Update Space

## Events

* property.created
* property.updated
* zone.created
* zone.updated
* space.created
* space.updated

---

# 3. Event Bus Module

## Responsibility

The Event Bus Module allows Core and plugins to communicate without direct dependency.

## Rules

* Events describe things that already happened.
* Events must not contain business logic.
* Plugins should publish and subscribe through the Event Bus.
* Core must not depend on plugin-specific events.

## APIs

* Publish Event
* Subscribe to Event
* View Event Log
* Replay Event

## Events

* event.published
* event.failed
* event.replayed

---

# 4. Notification Module

## Responsibility

The Notification Module manages notification requests.

It does not directly represent WhatsApp, SMS, email or push notification providers.

Channel plugins handle delivery.

## Example Flow

Visitor Plugin
↓
Notification Module
↓
WhatsApp Plugin
↓
Visitor / Host / Security

## APIs

* Create Notification Request
* View Notification Status
* Retry Notification
* Cancel Notification

## Events

* notification.requested
* notification.sent
* notification.failed
* notification.retried

---

# 5. Document Module

## Responsibility

The Document Module stores and manages files and records attached to Core or plugin entities.

## Why This Is Needed

Future plugins will require documents such as:

* Rental Agreement
* Visitor ID Proof
* Invoice
* Receipt
* NOC
* Maintenance Report
* Legal Notice
* Handover Checklist

## APIs

* Upload Document
* View Document
* Attach Document to Entity
* Remove Document
* Archive Document

## Events

* document.uploaded
* document.attached
* document.archived
* document.deleted

---

# 6. Plugin Engine Module

## Responsibility

The Plugin Engine manages plugin lifecycle.

## Lifecycle

Uploaded
↓
Validated
↓
Installed
↓
Activated
↓
Configured
↓
Updated
↓
Deactivated
↓
Removed

## APIs

* Upload Plugin
* Validate Plugin
* Install Plugin
* Activate Plugin
* Deactivate Plugin
* Update Plugin
* Rollback Plugin
* Remove Plugin

## Events

* plugin.uploaded
* plugin.validated
* plugin.installed
* plugin.activated
* plugin.deactivated
* plugin.updated
* plugin.rollback.completed
* plugin.removed

---

# 7. Audit Module

## Responsibility

The Audit Module records important system and user actions.

## Rules

* Audit logs must be append-only.
* Audit logs must not be silently edited.
* Security-sensitive actions must always be audited.

## APIs

* Record Audit Entry
* View Audit Trail
* Filter Audit Trail

## Events

* audit.recorded

---

# Modules Not Required in v0.1

The following should not be built fully in v0.1:

* Workflow Engine
* Theme Engine
* AI Engine
* Marketplace
* Billing Engine
* Payment Engine
* SaaS Multi-Tenancy

Only placeholders or future references may be created.

---

# v0.1 Backend Build Order

Build in this order:

1. Identity Module
2. Property Module
3. Event Bus Module
4. Notification Module
5. Document Module
6. Plugin Engine Module
7. Audit Module

---

# Architecture Validation

Visitor Plugin must be buildable using only:

* Identity Module
* Property Module
* Event Bus Module
* Notification Module
* Document Module
* Plugin Engine Module
* Audit Module

If Visitor Plugin requires visitor-specific logic inside Core, the architecture is invalid.

---

# End of Document

