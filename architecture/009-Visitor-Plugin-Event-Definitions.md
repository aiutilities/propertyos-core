# Visitor Plugin Event Definitions

## PropertyOS Version 0.1

---

# Purpose

This document defines all events published and consumed by the Visitor Plugin.

These event definitions serve as the contract between:

* Visitor Plugin
* Event Bus
* Notification Module
* Audit Module
* Document Module
* WhatsApp Plugin
* Future Plugins

---

# Event Naming Rules

Format:

```text
visitor.action
```

Examples:

```text
visitor.invited
visitor.approved
visitor.checked_in
```

Rules:

1. Lowercase only
2. Dot notation
3. Past tense preferred
4. Property-neutral naming

---

# Standard Event Structure

All visitor events must follow:

```ts
export interface VisitorEvent {
  id: string;
  name: string;
  source: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

Example:

```json
{
  "id": "evt_001",
  "name": "visitor.invited",
  "source": "visitor-plugin",
  "payload": {},
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

# Visitor Lifecycle Events

```text
visitor.invited
visitor.approved
visitor.rejected
visitor.cancelled
visitor.expired

visitor.arrived

visitor.checked_in
visitor.checked_out

visitor.completed
```

---

# Event: visitor.invited

## Purpose

Published when a visitor invitation is created.

## Trigger

```text
Host creates invitation
```

## Payload

```json
{
  "visitId": "visit_001",
  "visitorId": "visitor_001",
  "propertyId": "property_001",
  "hostPersonId": "person_001",
  "visitDate": "2026-07-15",
  "status": "invited"
}
```

## Subscribers

```text
Notification Module
Audit Module
WhatsApp Plugin
```

---

# Event: visitor.approved

## Purpose

Published when invitation is approved.

## Payload

```json
{
  "visitId": "visit_001",
  "approvedBy": "person_001",
  "status": "approved"
}
```

## Subscribers

```text
Notification Module
Audit Module
QR Generator
```

---

# Event: visitor.rejected

## Purpose

Published when invitation is rejected.

## Payload

```json
{
  "visitId": "visit_001",
  "reason": "Host unavailable",
  "status": "rejected"
}
```

## Subscribers

```text
Notification Module
Audit Module
```

---

# Event: visitor.cancelled

## Purpose

Published when invitation is cancelled.

## Payload

```json
{
  "visitId": "visit_001",
  "reason": "Meeting cancelled",
  "status": "cancelled"
}
```

## Subscribers

```text
Notification Module
Audit Module
QR Service
```

---

# Event: visitor.expired

## Purpose

Published when invitation expires.

## Payload

```json
{
  "visitId": "visit_001",
  "status": "expired"
}
```

## Subscribers

```text
Audit Module
Notification Module
```

---

# Event: visitor.qr_generated

## Purpose

Published when QR pass is generated.

## Payload

```json
{
  "visitId": "visit_001",
  "qrPassId": "qr_001",
  "expiresAt": "2026-07-15T18:00:00Z"
}
```

## Subscribers

```text
Notification Module
Audit Module
Document Module
```

---

# Event: visitor.qr_scanned

## Purpose

Published when QR code is scanned.

## Payload

```json
{
  "visitId": "visit_001",
  "qrPassId": "qr_001",
  "scannedAt": "2026-07-15T10:00:00Z"
}
```

## Subscribers

```text
Audit Module
Security Monitoring
```

---

# Event: visitor.qr_invalid

## Purpose

Published when QR validation fails.

## Payload

```json
{
  "visitId": "visit_001",
  "reason": "QR_EXPIRED"
}
```

## Subscribers

```text
Audit Module
Security Monitoring
```

---

# Event: visitor.arrived

## Purpose

Published when visitor arrives.

## Payload

```json
{
  "visitId": "visit_001",
  "arrivedAt": "2026-07-15T10:00:00Z"
}
```

## Subscribers

```text
Audit Module
Notification Module
```

---

# Event: visitor.checked_in

## Purpose

Published when visitor enters property.

## Payload

```json
{
  "visitId": "visit_001",
  "checkedInAt": "2026-07-15T10:05:00Z",
  "gate": "Main Gate",
  "securityPersonId": "person_010"
}
```

## Subscribers

```text
Notification Module
Audit Module
```

---

# Event: visitor.checked_out

## Purpose

Published when visitor exits property.

## Payload

```json
{
  "visitId": "visit_001",
  "checkedOutAt": "2026-07-15T12:30:00Z",
  "gate": "Main Gate",
  "securityPersonId": "person_010"
}
```

## Subscribers

```text
Notification Module
Audit Module
```

---

# Event: visitor.completed

## Purpose

Published when visit lifecycle is complete.

## Payload

```json
{
  "visitId": "visit_001",
  "status": "completed"
}
```

## Subscribers

```text
Audit Module
Reporting Plugins
```

---

# Event Flow

```text
visitor.invited
        ↓
visitor.approved
        ↓
visitor.qr_generated
        ↓
visitor.arrived
        ↓
visitor.checked_in
        ↓
visitor.checked_out
        ↓
visitor.completed
```

---

# Notification Mapping

| Event               | Notification           |
| ------------------- | ---------------------- |
| visitor.invited     | Visitor Invite         |
| visitor.approved    | Approval Notification  |
| visitor.rejected    | Rejection Notification |
| visitor.checked_in  | Host Alert             |
| visitor.checked_out | Host Alert             |

---

# Audit Mapping

All visitor lifecycle events must be recorded by Audit Module.

Required:

```text
visitor.invited
visitor.approved
visitor.rejected
visitor.cancelled
visitor.arrived
visitor.checked_in
visitor.checked_out
visitor.completed
```

---

# Document Mapping

Document Module may react to:

```text
visitor.qr_generated
```

Possible outputs:

```text
Visitor Pass PDF
Visitor QR Pass
```

---

# WhatsApp Mapping

WhatsApp Plugin may react to:

```text
visitor.invited
visitor.approved
visitor.checked_in
visitor.checked_out
```

Possible outputs:

```text
Invite Message
Approval Message
Arrival Alert
Departure Alert
```

---

# Security Rules

Event payloads must never contain:

```text
Passwords
Access Tokens
Private Keys
Sensitive Secrets
Binary Files
```

Allowed:

```text
IDs
Status
Timestamps
References
Metadata
```

---

# Retry Considerations

Version 0.1:

```text
No automatic retries
```

Future:

```text
Dead Letter Queue
Retry Policies
Replay Support
```

---

# Version 0.1 Mandatory Events

Required events:

```text
visitor.invited
visitor.approved
visitor.rejected

visitor.qr_generated

visitor.arrived

visitor.checked_in
visitor.checked_out
```

---

# Version 0.1 Success Criteria

The event design is successful when:

1. Visitor lifecycle is fully represented.
2. Notification Module can react.
3. Audit Module can react.
4. WhatsApp Plugin can react.
5. Event Bus can route events.
6. Future plugins can integrate without modifying Visitor Plugin.

---

# Simple Mental Model

```text
Invite Visitor
      ↓
Publish Event

Approve Visitor
      ↓
Publish Event

Generate QR
      ↓
Publish Event

Check-In
      ↓
Publish Event

Check-Out
      ↓
Publish Event
```

The Visitor Plugin performs business actions.

The Event Bus broadcasts them.

Other modules decide how to react.

