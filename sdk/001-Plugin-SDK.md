# PropertyOS Plugin SDK

## Purpose

Define how plugins interact with PropertyOS Core.

Plugins must extend the platform without modifying core code.

---

# Plugin Principles

* Plugins own business logic.
* Core owns infrastructure.
* Plugins use public APIs.
* Plugins publish events.
* Plugins consume events.
* Plugins respect permissions.
* Plugins must be installable from the admin panel.

---

# Plugin Structure

Example:

plugin/
├── manifest.json
├── permissions/
├── events/
├── workflows/
├── api/
├── ui/
└── migrations/

---

# Plugin Manifest

Every plugin must provide:

* Name
* Version
* Author
* Description
* Dependencies
* Permissions
* Event subscriptions
* Event publications

---

# Plugin Lifecycle

States:

* Installed
* Activated
* Deactivated
* Updated
* Rolled Back
* Removed

---

# Plugin Capabilities

A plugin may:

* Register menus
* Register permissions
* Register events
* Register workflows
* Register APIs
* Register UI screens
* Register notifications

A plugin may not:

* Modify core code
* Bypass permissions
* Access another plugin directly

---

# Event Integration

Plugins should communicate through events.

Examples:

visitor.invited
visitor.checked_in
visitor.checked_out

---

# Workflow Integration

Plugins can publish events that trigger workflows.

Example:

Visitor Invited
→ Workflow Triggered
→ WhatsApp Notification Sent

---

# Security Rules

Plugins must:

* Respect permissions
* Validate inputs
* Use approved APIs
* Avoid direct database access where possible

---

---

# Plugin Boundary Rule

PropertyOS Core owns:

* Authentication
* Property
* Zone
* Space
* Person
* Organization
* Role
* Permission
* Event Bus
* Notification Engine
* Workflow Engine
* Plugin Engine
* Theme Engine

Plugins own:

* Business rules
* Plugin-specific data
* Plugin-specific workflows
* Plugin-specific screens
* Plugin-specific reports
* Plugin-specific permissions
* Plugin-specific events

---

# Data Ownership

Core data belongs to PropertyOS Core.

Plugins may reference Core entities using:

* property_id
* zone_id
* space_id
* person_id
* organization_id

Plugins should avoid duplicating Core data unless absolutely necessary.

---

# Notification Integration

Plugins must not directly depend on WhatsApp, SMS or Email providers.

Plugins should publish notification requests through PropertyOS Notification Engine.

Channel plugins such as WhatsApp Plugin may handle message delivery.

---

# API Integration

Plugins may expose API endpoints.

All plugin APIs must use:

* Core authentication
* Core permission enforcement
* Core audit logging

Plugins must not bypass Core security controls.

---

# UI Integration

Plugins may register:

* Admin Screens
* User Screens
* Configuration Screens

Themes control presentation.

Plugins should not hardcode theme behavior.

---

# Safety Rules

Plugins must not:

* Modify Core database tables directly
* Bypass authentication
* Bypass permission checks
* Store secrets in source code
* Break Core upgrade compatibility

---

# First Official Plugin

The first official PropertyOS plugin is:

plugins/visitor-management

This plugin serves as the reference implementation for SDK validation.

---

# Success Criteria

The SDK is considered successful when a plugin can:

* Install without Core modification
* Register permissions
* Publish events
* Subscribe to events
* Register workflows
* Use Notification Engine
* Own its own business data

while keeping PropertyOS Core generic and reusable.

---

# Future Direction

PropertyOS Marketplace will distribute approved plugins.

All marketplace plugins should follow SDK standards.

