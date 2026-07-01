# PropertyOS Event Catalog Specification

## Purpose

The Event Catalog defines the standards for publishing and consuming events within PropertyOS.

PropertyOS follows an event-driven architecture.

Plugins should communicate through events instead of directly calling each other whenever possible.

---

# Event Principles

Events represent something that has already happened.

Examples:

* Visitor Invited
* Visitor Checked In
* Rent Received
* Maintenance Ticket Created

Events must not contain business logic.

Events must describe facts.

---

# Event Naming Standard

Format:

```text
domain.action
```

Examples:

```text
visitor.invited
visitor.checkedin
visitor.checkedout

rent.invoice.generated
rent.payment.received

maintenance.ticket.created
maintenance.ticket.closed

person.created
person.updated

property.created
property.updated
```

Rules:

* Lowercase only
* Dot notation
* Past tense preferred
* No spaces
* No special characters

---

# Event Structure

Every event must contain:

```json
{
  "event_id": "uuid",
  "event_name": "visitor.invited",
  "event_version": "1.0",
  "timestamp": "2026-07-01T10:30:00Z",
  "source": "visitor-management",
  "actor_id": "person_123",
  "payload": {}
}
```

---

# Required Fields

## event_id

Globally unique identifier.

## event_name

Unique event name.

## event_version

Schema version.

## timestamp

UTC timestamp.

## source

Plugin or Core service that generated the event.

## actor_id

User or system actor responsible for the action.

## payload

Business-specific event data.

---

# Event Categories

## Core Events

Published by PropertyOS Core.

Examples:

```text
person.created
person.updated

property.created
property.updated

role.created
role.updated

permission.created
permission.updated
```

---

## Plugin Events

Published by plugins.

Examples:

```text
visitor.invited
visitor.approved
visitor.checkedin
visitor.checkedout

rent.invoice.generated
rent.payment.received

maintenance.ticket.created
maintenance.ticket.closed
```

---

## System Events

Published by infrastructure services.

Examples:

```text
notification.sent
notification.failed

workflow.started
workflow.completed

plugin.installed
plugin.activated
plugin.updated
plugin.removed
```

---

# Event Publishing Rules

Plugins may publish events when:

* Data is created
* Data is updated
* State changes occur
* Workflows complete
* Notifications are delivered

Plugins should not publish duplicate events unnecessarily.

---

# Event Subscription Rules

Plugins may subscribe to events.

Example:

```text
visitor.invited
        ↓
WhatsApp Plugin
        ↓
Send Visitor Notification
```

Example:

```text
visitor.checkedin
        ↓
Notification Plugin
        ↓
Notify Host
```

Subscribers must not assume event delivery order unless explicitly documented.

---

# Event Versioning

Event schemas may evolve.

Example:

```text
visitor.invited v1
visitor.invited v2
```

Consumers should support backward compatibility where possible.

---

# Event Retention

Events should be retained for:

* Audit
* Reporting
* Workflow replay
* Debugging

Retention policies may vary by deployment.

---

# Security Rules

Events must not contain:

* Passwords
* Secrets
* API keys
* Authentication tokens

Sensitive data should be referenced by ID rather than embedded.

---

# First Official Event Domains

```text
property
zone
space
person
organization

visitor
rent
maintenance
notification
workflow

plugin
theme
audit
```

---

# Success Criteria

The Event Catalog succeeds when:

* Plugins communicate without direct dependencies
* New plugins can subscribe to existing events
* Core remains loosely coupled
* Workflows can be built using events
* Audit trails are naturally generated

---

# End of Document

