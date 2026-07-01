# Event Catalog

## PropertyOS Version 0.1

---

# Purpose

This document defines the official event catalog for PropertyOS.

All modules and plugins should publish and subscribe using these event names.

This ensures:

* Consistency
* Loose coupling
* Plugin interoperability
* Predictable integrations

---

# Event Naming Standard

Format:

```text
domain.action
```

Examples:

```text
property.created
person.updated
visitor.invited
plugin.activated
```

Rules:

1. Lowercase only
2. Dot separated
3. Singular domain names
4. Past-tense action preferred

Good:

```text
property.created
visitor.checked_in
```

Bad:

```text
PropertyCreated
visitorCheckin
```

---

# Event Structure

All events follow:

```ts
export interface PropertyOSEvent {
  id: string;
  name: string;
  source: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

# Identity Events

## User Events

```text
user.created
user.updated
user.deactivated
user.deleted
```

## Authentication Events

```text
login.success
login.failed
logout.completed
password.changed
```

## Role Events

```text
role.created
role.updated
role.deleted
role.assigned
role.removed
```

## Permission Events

```text
permission.created
permission.updated
permission.deleted
permission.assigned
permission.removed
```

---

# People Events

```text
person.created
person.updated
person.deleted
person.activated
person.deactivated
```

---

# Organization Events

```text
organization.created
organization.updated
organization.deleted
organization.member_added
organization.member_removed
```

---

# Property Events

```text
property.created
property.updated
property.deleted
property.activated
property.deactivated
```

---

# Zone Events

```text
zone.created
zone.updated
zone.deleted
```

---

# Space Events

```text
space.created
space.updated
space.deleted
space.activated
space.deactivated
```

---

# Asset Events

```text
asset.created
asset.updated
asset.deleted
asset.assigned
asset.unassigned
```

---

# Document Events

```text
document.uploaded
document.updated
document.deleted
document.downloaded
document.version_created
```

Example payload:

```json
{
  "documentId": "doc_001",
  "entityType": "visitor",
  "entityId": "visitor_001"
}
```

---

# Notification Events

## Request Events

```text
notification.requested
```

## Result Events

```text
notification.sent
notification.failed
notification.skipped
```

Example payload:

```json
{
  "notificationId": "noti_001",
  "channel": "whatsapp",
  "status": "sent"
}
```

---

# Event Bus Events

```text
event.published
event.failed
```

These are internal operational events.

---

# Plugin Lifecycle Events

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.uninstalled
plugin.updated
plugin.failed
plugin.config_updated
```

Example payload:

```json
{
  "pluginName": "visitor",
  "version": "0.1.0"
}
```

---

# Audit Events

```text
audit.recorded
audit.failed
```

Used mainly for operational visibility.

---

# System Events

```text
system.started
system.stopped
system.health_check_failed
system.error_detected
system.backup_completed
```

---

# Visitor Plugin Events

## Visitor Invitation

```text
visitor.invited
visitor.invite_cancelled
visitor.invite_expired
```

Example payload:

```json
{
  "visitorId": "visitor_001",
  "hostPersonId": "person_001",
  "propertyId": "property_001"
}
```

---

## Visitor Arrival

```text
visitor.checked_in
visitor.check_in_denied
visitor.arrived
```

---

## Visitor Exit

```text
visitor.checked_out
```

---

## Visitor QR Events

```text
visitor.qr_generated
visitor.qr_scanned
visitor.qr_invalid
visitor.qr_expired
```

---

# WhatsApp Plugin Events

```text
whatsapp.message_requested
whatsapp.message_sent
whatsapp.message_failed
```

Example payload:

```json
{
  "messageId": "msg_001",
  "recipient": "+919999999999",
  "status": "sent"
}
```

---

# Notification Subscribers

Notification Module should subscribe to:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
plugin.activated
plugin.deactivated
system.error_detected
```

---

# Audit Subscribers

Audit Module should subscribe to:

```text
property.created
property.updated
person.created
person.updated

document.uploaded
document.deleted

notification.sent
notification.failed

plugin.installed
plugin.activated
plugin.deactivated

visitor.invited
visitor.checked_in
visitor.checked_out

login.success
login.failed
```

---

# WhatsApp Subscribers

WhatsApp Plugin should subscribe to:

```text
notification.requested
visitor.invited
visitor.checked_in
visitor.checked_out
```

---

# Event Ownership

## Core-Owned Events

```text
user.*
role.*
permission.*
person.*
organization.*
property.*
zone.*
space.*
asset.*
document.*
notification.*
plugin.*
audit.*
system.*
```

Only Core modules may publish these.

---

## Plugin-Owned Events

```text
visitor.*
whatsapp.*
rentops.*
maintenance.*
```

Owned by corresponding plugins.

---

# Event Payload Rules

Payload should contain:

```text
IDs
References
Context
Status
Metadata
```

Payload should NOT contain:

```text
Passwords
Access Tokens
Private Keys
Large Documents
Binary Files
Sensitive Secrets
```

Good:

```json
{
  "personId": "person_001"
}
```

Bad:

```json
{
  "password": "secret123"
}
```

---

# Event Versioning

Future support:

```json
{
  "version": "1.0"
}
```

Version 0.1 can omit explicit event versions.

---

# Event Retention

Events should be persisted in:

```text
event_logs
```

Audit history should be persisted in:

```text
audit_logs
```

Events and audits serve different purposes.

---

# Event Processing Rules

1. Save event first.
2. Publish event.
3. Execute handlers.
4. Log failures.
5. Never crash system because one handler failed.

---

# Event Catalog Governance

New events must:

1. Follow naming rules.
2. Be added to this document.
3. Be reviewed through ADR if cross-module impact exists.

No unofficial event names should be introduced.

---

# Version 0.1 Mandatory Events

Minimum required events:

```text
property.created
zone.created
space.created

person.created

document.uploaded

notification.requested
notification.sent
notification.failed

plugin.installed
plugin.activated
plugin.deactivated

visitor.invited
visitor.checked_in
visitor.checked_out

audit.recorded
```

---

# Version 0.1 Success Criteria

The Event Catalog is successful when:

1. Every module uses standard event names.
2. Plugins communicate through events.
3. Event Bus can route events reliably.
4. Notification Module reacts to visitor events.
5. Audit Module records major events.
6. Future plugins can integrate without modifying Core.

---

# Simple Mental Model

Think of the Event Catalog as the official language spoken inside PropertyOS.

Modules and plugins do not call each other directly whenever possible.

Instead they announce:

```text
visitor.invited
plugin.activated
document.uploaded
```

Every component understands the same language.

That is the purpose of the Event Catalog.

