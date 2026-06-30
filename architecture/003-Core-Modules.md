# PropertyOS Core Modules

## Purpose

This document defines the core platform modules of PropertyOS.

Core modules provide shared infrastructure. Business-specific features must be delivered through plugins.

---

## Core Rule

PropertyOS Core owns infrastructure.

Plugins own business logic.

Themes own presentation.

Workflows own automation.

Core must remain property-type neutral.

---

## 1. Identity Engine

Manages users, authentication, roles, permissions, and access control.

Responsibilities:

* User accounts
* Login
* Sessions
* Roles
* Permissions
* Access control

---

## 2. Organization Engine

Manages organizations using PropertyOS.

Responsibilities:

* Organization records
* Organization profile
* Organization settings
* Organization membership

---

## 3. Property Engine

Manages physical property structure.

Responsibilities:

* Property
* Building
* Zone
* Space

Property Engine must support residential communities, commercial complexes, coworking spaces, campuses, industrial parks, and managed facilities.

---

## 4. People Engine

Manages people connected to the platform.

Responsibilities:

* Person records
* Contact details
* Property relationship
* Organization relationship

Examples:

* Resident
* Visitor
* Staff
* Vendor
* Owner
* Tenant

---

## 5. Workflow Engine

Manages repeatable operational processes.

Responsibilities:

* Workflow definitions
* Triggers
* Conditions
* Actions
* Status tracking

Examples:

* Visitor approval
* Vendor onboarding
* Complaint handling
* Asset maintenance

---

## 6. Event Bus

Allows modules, plugins, workflows, notifications, and future AI assistants to react to system activity.

Responsibilities:

* Publish events
* Subscribe to events
* Store event logs
* Retry failed handlers
* Follow event catalog standards

---

## 7. Notification Engine

Sends communication through supported channels.

Responsibilities:

* WhatsApp notifications
* Email notifications
* SMS notifications
* Push notifications
* Templates
* Delivery tracking

---

## 8. Plugin Engine

Allows PropertyOS to be extended without modifying core.

Responsibilities:

* Install plugins
* Activate plugins
* Deactivate plugins
* Update plugins
* Roll back plugins
* Remove plugins
* Register plugin permissions
* Register plugin events
* Register plugin menus
* Register plugin APIs

---

## 9. Theme Engine

Controls presentation and branding.

Responsibilities:

* Install themes
* Preview themes
* Activate themes
* Manage theme settings

Themes must not contain business logic.

---

## 10. AI Provider Layer

Allows AI-assisted administration without vendor lock-in.

Responsibilities:

* Connect to multiple AI providers
* Manage prompts
* Manage tools
* Provide safe access to platform data
* Log AI actions

AI must assist users. It must not silently make critical operational decisions.

---

## Version 0.1 Scope

Version 0.1 should focus on:

* Identity Engine
* Organization Engine
* Property Engine
* People Engine
* Event Bus
* Notification Engine
* Plugin Engine
* Theme Engine foundation

Workflow Engine and AI Provider Layer may begin as simple foundations and mature later.

---

## Explicit Non Goals

Core should not directly implement:

* Apartment billing
* Coworking subscriptions
* Visitor business rules
* Facility-specific approvals
* Accounting
* CRM
* ERP workflows

These must be delivered through plugins.

