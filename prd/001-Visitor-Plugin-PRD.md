# Visitor Plugin PRD

## PropertyOS Version 0.1

---

# Document Information

| Field   | Value                |
| ------- | -------------------- |
| Product | PropertyOS           |
| Module  | Visitor Plugin       |
| Version | 0.1                  |
| Status  | Draft                |
| Type    | Core Business Plugin |

---

# Executive Summary

The Visitor Plugin enables properties to manage visitor invitations, approvals, arrivals, departures and visitor history.

The plugin must be installable into any PropertyOS deployment.

Examples:

* Apartment Community
* Villa Community
* Office Building
* Commercial Complex
* Coworking Space
* Educational Campus
* Industrial Facility
* Managed Property

The plugin must remain property-neutral and reusable.

---

# Problem Statement

Most visitor management systems are:

* Closed source
* Expensive
* Property-specific
* Difficult to customize
* Difficult to integrate

PropertyOS requires a reusable visitor management capability that can be installed as a plugin without modifying Core.

---

# Goals

The Visitor Plugin must:

1. Manage visitor invitations
2. Generate visitor passes
3. Generate QR codes
4. Support visitor approvals
5. Support visitor check-in
6. Support visitor check-out
7. Maintain visitor history
8. Integrate with Notification Module
9. Integrate with Event Bus
10. Integrate with Audit Module
11. Integrate with Document Module

---

# Non Goals

Version 0.1 will NOT include:

* Facial Recognition
* Vehicle Recognition
* OCR
* Visitor Blacklists
* Biometric Verification
* Visitor Analytics
* Multi-property Dashboards
* Visitor Pre-screening AI
* Mobile Apps

These can be future enhancements.

---

# Primary Users

## Administrator

Responsibilities:

```text
Configure plugin
Manage visitor policies
View reports
```

---

## Host

Responsibilities:

```text
Invite visitors
Approve visitors
View visitor history
```

---

## Security Staff

Responsibilities:

```text
Verify visitor
Scan QR code
Check-in visitor
Check-out visitor
```

---

## Visitor

Responsibilities:

```text
Receive invite
Receive QR code
Present QR code
Enter property
Exit property
```

---

# Core Concepts

## Visitor

A visitor is a person temporarily visiting a property.

Examples:

```text
Guest
Vendor
Delivery Agent
Contractor
Interview Candidate
Maintenance Technician
Consultant
```

---

## Host

The person responsible for the visitor.

Examples:

```text
Resident
Tenant
Employee
Manager
Property Staff
```

---

## Visit

A visit represents a planned or actual visitor entry.

Examples:

```text
Meeting
Maintenance Work
Delivery
Inspection
Guest Visit
Interview
```

---

# Visitor Lifecycle

```text
Invite
  ↓
Approved
  ↓
QR Generated
  ↓
Arrived
  ↓
Checked In
  ↓
Checked Out
  ↓
Completed
```

---

# Visitor Statuses

Supported statuses:

```text
draft
invited
approved
rejected
expired
arrived
checked_in
checked_out
completed
cancelled
```

---

# Functional Requirements

## FR-001 Create Visitor Invite

Host can create visitor invitation.

Required fields:

```text
Visitor Name
Mobile Number
Visit Date
Visit Purpose
Host
Property
```

Output:

```text
Visitor Record
Visitor Invite
```

---

## FR-002 Approve Visitor

If approval workflow enabled:

```text
Host approves
```

Status:

```text
approved
```

---

## FR-003 Reject Visitor

Host may reject invitation.

Status:

```text
rejected
```

---

## FR-004 Generate QR Pass

System generates unique QR code.

QR contains:

```text
Visit ID
Token
Expiry
```

Output:

```text
QR Pass
```

---

## FR-005 Send Visitor Invite

Notification Module sends:

```text
Visitor Details
Visit Date
QR Pass Link
```

Preferred channel:

```text
WhatsApp
```

---

## FR-006 Visitor Arrival

Visitor arrives at property.

Security may:

```text
Scan QR
Search Visitor
Approve Manual Entry
```

Status:

```text
arrived
```

---

## FR-007 Visitor Check-In

Security checks visitor in.

Capture:

```text
Time
Gate
Security Staff
```

Status:

```text
checked_in
```

---

## FR-008 Visitor Check-Out

Security checks visitor out.

Capture:

```text
Time
Gate
Security Staff
```

Status:

```text
checked_out
```

---

## FR-009 Visitor History

System stores:

```text
All Visits
All Status Changes
Check-in Time
Check-out Time
Host
Purpose
```

---

## FR-010 Visitor Search

Search by:

```text
Visitor Name
Mobile
Visit Date
Status
Host
```

---

# Configuration

Plugin configuration:

```json
{
  "allowQrInvite": true,
  "hostApprovalRequired": false,
  "defaultVisitDurationHours": 4,
  "notifyHostOnCheckIn": true,
  "notifyHostOnCheckOut": true
}
```

---

# Permissions

Required permissions:

```text
visitor.create
visitor.read
visitor.update
visitor.delete

visitor.approve
visitor.reject

visitor.check_in
visitor.check_out

visitor.history.read
visitor.settings.manage
```

---

# Notifications

Trigger notifications for:

```text
Visitor Invite
Visitor Approved
Visitor Rejected
Visitor Checked In
Visitor Checked Out
```

---

# Documents

Plugin may generate:

```text
Visitor Pass PDF
Visitor QR Pass
Visit Receipt (future)
```

All documents should use Document Module.

---

# Audit Requirements

Audit must record:

```text
Visitor Invited
Visitor Approved
Visitor Rejected
Visitor Checked In
Visitor Checked Out
Visitor Cancelled
```

Audit records generated through Event Bus.

---

# Events Published

Visitor Plugin publishes:

```text
visitor.invited
visitor.approved
visitor.rejected

visitor.qr_generated

visitor.arrived

visitor.checked_in
visitor.checked_out

visitor.cancelled
visitor.expired
```

---

# Events Consumed

Visitor Plugin listens to:

```text
notification.sent
notification.failed
```

Future versions may consume additional events.

---

# Data Model

## Visitor

```text
id
name
mobile
email
status
createdAt
updatedAt
```

---

## Visit

```text
id
visitorId
hostPersonId
propertyId

visitDate
visitPurpose

status

approvedAt
checkedInAt
checkedOutAt

createdAt
updatedAt
```

---

## Visitor QR Pass

```text
id
visitId
token
expiresAt
generatedAt
```

---

# API Endpoints

Base Route:

```text
/plugins/visitor
```

Endpoints:

```text
POST   /plugins/visitor/invite

POST   /plugins/visitor/:id/approve

POST   /plugins/visitor/:id/reject

POST   /plugins/visitor/:id/check-in

POST   /plugins/visitor/:id/check-out

GET    /plugins/visitor

GET    /plugins/visitor/:id

GET    /plugins/visitor/history
```

---

# UI Screens

Version 0.1 screens:

```text
Visitor List
Create Visitor
Visitor Details
Check-In Screen
Check-Out Screen
Visitor History
Plugin Settings
```

---

# Success Metrics

Version 0.1 succeeds when:

1. Host can invite visitor.
2. QR code is generated.
3. Visitor receives invitation.
4. Security can verify visitor.
5. Visitor can check in.
6. Visitor can check out.
7. History is stored.
8. Events are published.
9. Notifications are sent.
10. Audit records are generated.

---

# Future Enhancements

Potential future features:

```text
Vehicle Entry
Visitor Self Registration
Multi-Day Visits
Recurring Visitors
Facial Recognition
ID Verification
Watchlists
Visitor Analytics
AI Risk Scoring
Mobile App
```

Not part of Version 0.1.

---

# Simple Mental Model

A visitor is:

```text
Person
     ↓
Invited
     ↓
Approved
     ↓
QR Issued
     ↓
Arrives
     ↓
Checks In
     ↓
Checks Out
```

The Visitor Plugin manages that lifecycle while relying on:

```text
Event Bus
Notification
Document
Audit
Identity
People
Property
```

for platform capabilities.

The plugin owns visitor business logic.

PropertyOS Core owns infrastructure.

