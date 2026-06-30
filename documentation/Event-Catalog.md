cat > architecture/003-Core-Modules.md <<'EOF'
# PropertyOS Core Modules

## Purpose

This document defines the first core modules of PropertyOS.

Core modules provide shared platform capabilities. Business-specific functionality should be built as plugins.

---

## Core Module Rule

PropertyOS Core should own infrastructure.

Plugins should own business logic.

Core must remain property-type neutral.

---

## 1. Identity Engine

Purpose:

Manage users, authentication, roles, permissions, and access control.

Responsibilities:

- User accounts
- Login
- Role management
- Permission management
- Access control
- Session handling

Not responsible for:

- Business-specific approval rules
- Plugin-specific permissions beyond registration

---

## 2. Organization Engine

Purpose:

Manage organizations using PropertyOS.

Responsibilities:

- Organization creation
- Organization profile
- Organization membership
- Organization-level settings

---

## 3. Property Engine

Purpose:

Manage physical property structure.

Responsibilities:

- Property
- Building
- Zone
- Space

This engine should remain generic enough to support residential, commercial, coworking, campus, industrial, and managed facility use cases.

---

## 4. People Engine

Purpose:

Manage people known to the platform.

Responsibilities:

- Person records
- Contact details
- Person-to-organization relationship
- Person-to-property relationship

Examples of people:

- Resident
- Visitor
- Staff
- Vendor
- Owner
- Tenant

---

## 5. Workflow Engine

Purpose:

Allow repeatable operational processes to be defined and executed.

Responsibilities:

- Workflow definition
- Workflow triggers
- Workflow conditions
- Workflow actions
- Workflow status tracking

Examples:

- Visitor approval
- Vendor onboarding
- Complaint handling
- Asset maintenance

---

## 6. Event Bus

Purpose:

Allow modules, plugins, workflows, notifications, and future AI assistants to react to system activity.

Responsibilities:

- Publish events
- Subscribe to events
- Store event logs
- Retry failed event handling
- Provide event catalog standards

---

## 7. Notification Engine

Purpose:

Send communication through multiple channels.

Responsibilities:

- WhatsApp notifications
- Email notifications
- SMS notifications
- Push notifications
- Notification templates
- Delivery status tracking

---

## 8. Plugin Engine

Purpose:

Allow PropertyOS to be extended without modifying core.

Responsibilities:

- Install plugins
- Activate plugins
- Deactivate plugins
- Update plugins
- Roll back plugins
- Remove plugins
- Register plugin permissions
- Register plugin events
- Register plugin menus
- Register plugin APIs

---

## 9. Theme Engine

Purpose:

Allow presentation and branding to be changed without modifying business logic.

Responsibilities:

- Install themes
- Preview themes
- Activate themes
- Manage theme settings

Themes should not contain business logic.

---

## 10. AI Provider Layer

Purpose:

Allow AI-assisted administration without vendor lock-in.

Responsibilities:

- Connect to multiple AI providers
- Manage AI prompts
- Manage AI tools
- Provide safe access to platform data
- Log AI actions

AI must assist, not silently make critical decisions.

---

## Version 0.1 Core Scope

Version 0.1 should include only:

- Identity Engine
- Organization Engine
- Property Engine
- People Engine
- Event Bus
- Notification Engine
- Plugin Engine
- Theme Engine foundation

Workflow Engine and AI Provider Layer may start as simple foundations and mature later.

---

## Explicit Non Goals

Core should not directly implement:

- Apartment billing
- Coworking subscriptions
- Visitor business rules
- Facility-specific approvals
- Accounting
- CRM
- ERP workflows

These should be delivered through plugins.
EOF
