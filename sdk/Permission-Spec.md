# PropertyOS Permission Specification

## Purpose

This document defines how permissions are declared, registered and enforced within PropertyOS.

PropertyOS follows a permission-driven security model.

All access decisions must be based on permissions.

---

# Security Model

PropertyOS uses:

```text
User
↓
Role
↓
Permission
↓
Action
```

Example:

```text
Anand
↓
Property Manager
↓
visitor.approve
↓
Approve Visitor
```

---

# Permission Naming Standard

Format:

```text
resource.action
```

Examples:

```text
visitor.create
visitor.view
visitor.approve
visitor.checkin
visitor.checkout

rent.invoice.create
rent.payment.record

maintenance.ticket.create
maintenance.ticket.close

person.create
person.view

property.create
property.update
```

Rules:

* Lowercase only
* Dot notation
* Verb at the end
* Singular resource names preferred

---

# Core Permissions

Managed by PropertyOS Core.

Examples:

```text
property.create
property.view
property.update
property.delete

zone.create
zone.view
zone.update
zone.delete

space.create
space.view
space.update
space.delete

person.create
person.view
person.update
person.delete

role.create
role.view
role.update
role.delete

permission.create
permission.view
permission.update
permission.delete
```

---

# Plugin Permissions

Plugins may register permissions.

Example:

Visitor Plugin:

```text
visitor.create
visitor.view
visitor.approve
visitor.reject
visitor.checkin
visitor.checkout
visitor.export
visitor.admin
```

Example:

RentOps Plugin:

```text
rent.invoice.create
rent.invoice.view
rent.payment.record
rent.report.export
```

Core stores and enforces permissions.

Plugins only declare them.

---

# Permission Registration

Permissions should be declared in plugin manifests.

Example:

```json
{
  "permissions": [
    "visitor.create",
    "visitor.view",
    "visitor.checkin"
  ]
}
```

During installation:

```text
Plugin Installed
↓
Permissions Registered
↓
Roles Can Be Assigned
```

---

# Role Assignment

Permissions are granted through roles.

Example:

Administrator

```text
property.*
visitor.*
rent.*
maintenance.*
```

Property Manager

```text
visitor.create
visitor.view
visitor.approve
visitor.export
```

Security Personnel

```text
visitor.view
visitor.checkin
visitor.checkout
```

Host

```text
visitor.create
visitor.view
```

---

# Wildcard Permissions

Future versions may support:

```text
visitor.*
rent.*
maintenance.*
```

This is optional for v0.1.

---

# Permission Enforcement

Every API endpoint must:

1. Authenticate user
2. Validate permission
3. Execute action
4. Record audit entry

Example:

```text
User Requests Check-In
↓
Has visitor.checkin?
↓
Yes → Continue
No  → Deny
```

---

# Permission Audit

Permission-sensitive actions should generate audit events.

Examples:

```text
visitor.approved
visitor.checkedin
visitor.checkedout

role.assigned
role.removed

permission.granted
permission.revoked
```

---

# Security Rules

Permissions must never:

* Be hardcoded
* Be bypassed
* Depend on UI visibility
* Depend on client-side validation

All permission checks must occur on the server.

---

# First Official Permission Domains

```text
property
zone
space
person
organization

visitor
rent
maintenance

workflow
notification

plugin
theme
audit
```

---

# Success Criteria

The Permission Framework succeeds when:

* Core permissions are reusable
* Plugins can register permissions
* Roles can be assigned without code changes
* APIs enforce permissions consistently
* Audit trails are generated automatically
* New plugins require no security framework changes

---

# End of Document

