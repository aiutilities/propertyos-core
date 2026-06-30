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

# Future Direction

PropertyOS Marketplace will distribute approved plugins.

All marketplace plugins should follow SDK standards.

