# Visitor Plugin NestJS Scaffolding Plan

## PropertyOS Version 0.1

---

# Purpose

This document translates the Visitor Plugin PRD, database design, API contracts and event definitions into an implementation-ready NestJS scaffolding plan.

This file should be given to the Backend Agent before code generation.

---

# Implementation Goal

Build the first installable PropertyOS plugin:

```text
Visitor Plugin
```

The plugin must support:

```text
Invite visitor
Approve visitor
Reject visitor
Generate QR pass
Validate QR pass
Visitor arrival
Visitor check-in
Visitor check-out
Visitor history
Plugin settings
Event publishing
Audit integration
Notification integration
```

---

# Plugin Location

```text
backend/src/plugins/visitor/
```

---

# Required Folder Structure

```text
backend/src/plugins/visitor/
├── plugin.json
├── visitor.module.ts
├── visitor.controller.ts
├── visitor.service.ts
├── visitor.repository.ts
├── visitor.types.ts
├── visitor.constants.ts
├── dto/
│   ├── create-visitor-invite.dto.ts
│   ├── approve-visitor.dto.ts
│   ├── reject-visitor.dto.ts
│   ├── validate-qr.dto.ts
│   ├── check-in-visitor.dto.ts
│   ├── check-out-visitor.dto.ts
│   └── update-visitor-settings.dto.ts
├── entities/
│   ├── visitor.entity.ts
│   ├── visit.entity.ts
│   ├── visitor-qr-pass.entity.ts
│   ├── visitor-status-history.entity.ts
│   └── visitor-plugin-setting.entity.ts
└── migrations/
    └── 001-create-visitor-plugin-tables.sql
```

---

# Plugin Manifest

File:

```text
backend/src/plugins/visitor/plugin.json
```

Content:

```json
{
  "name": "visitor",
  "displayName": "Visitor Plugin",
  "version": "0.1.0",
  "description": "Property-neutral visitor invitation, QR pass, check-in and check-out plugin.",
  "author": "PropertyOS",
  "type": "business",
  "main": "visitor.module.ts",
  "permissions": [
    "visitor.create",
    "visitor.read",
    "visitor.update",
    "visitor.delete",
    "visitor.approve",
    "visitor.reject",
    "visitor.check_in",
    "visitor.check_out",
    "visitor.history.read",
    "visitor.settings.manage"
  ],
  "eventsPublished": [
    "visitor.invited",
    "visitor.approved",
    "visitor.rejected",
    "visitor.cancelled",
    "visitor.expired",
    "visitor.arrived",
    "visitor.qr_generated",
    "visitor.qr_scanned",
    "visitor.qr_invalid",
    "visitor.checked_in",
    "visitor.checked_out",
    "visitor.completed"
  ],
  "eventsSubscribed": [
    "notification.sent",
    "notification.failed"
  ],
  "dependencies": [
    "eventbus",
    "notification",
    "document",
    "audit",
    "people",
    "property",
    "identity"
  ],
  "configSchema": {
    "allowQrInvite": true,
    "hostApprovalRequired": false,
    "defaultVisitDurationHours": 4,
    "notifyHostOnCheckIn": true,
    "notifyHostOnCheckOut": true
  }
}
```

---

# Constants

File:

```text
visitor.constants.ts
```

Required constants:

```ts
export const VISITOR_EVENTS = {
  INVITED: 'visitor.invited',
  APPROVED: 'visitor.approved',
  REJECTED: 'visitor.rejected',
  CANCELLED: 'visitor.cancelled',
  EXPIRED: 'visitor.expired',
  ARRIVED: 'visitor.arrived',
  QR_GENERATED: 'visitor.qr_generated',
  QR_SCANNED: 'visitor.qr_scanned',
  QR_INVALID: 'visitor.qr_invalid',
  CHECKED_IN: 'visitor.checked_in',
  CHECKED_OUT: 'visitor.checked_out',
  COMPLETED: 'visitor.completed',
};

export const VISITOR_STATUSES = {
  DRAFT: 'draft',
  INVITED: 'invited',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARRIVED: 'arrived',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const QR_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  USED: 'used',
  CANCELLED: 'cancelled',
  INVALID: 'invalid',
};
```

---

# DTOs

## create-visitor-invite.dto.ts

```ts
export class CreateVisitorInviteDto {
  visitorName: string;
  mobile: string;
  email?: string;
  visitDate: string;
  visitPurpose?: string;
  hostPersonId: string;
  propertyId: string;
}
```

---

## approve-visitor.dto.ts

```ts
export class ApproveVisitorDto {
  remarks?: string;
}
```

---

## reject-visitor.dto.ts

```ts
export class RejectVisitorDto {
  reason: string;
}
```

---

## validate-qr.dto.ts

```ts
export class ValidateQrDto {
  qrToken: string;
}
```

---

## check-in-visitor.dto.ts

```ts
export class CheckInVisitorDto {
  gate?: string;
  securityPersonId?: string;
}
```

---

## check-out-visitor.dto.ts

```ts
export class CheckOutVisitorDto {
  gate?: string;
  securityPersonId?: string;
}
```

---

## update-visitor-settings.dto.ts

```ts
export class UpdateVisitorSettingsDto {
  allowQrInvite?: boolean;
  hostApprovalRequired?: boolean;
  defaultVisitDurationHours?: number;
  notifyHostOnCheckIn?: boolean;
  notifyHostOnCheckOut?: boolean;
}
```

---

# Entities

## visitor.entity.ts

```ts
export interface VisitorEntity {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

---

## visit.entity.ts

```ts
export interface VisitEntity {
  id: string;
  visitorId: string;
  propertyId: string;
  hostPersonId: string;
  visitDate: string;
  visitPurpose?: string;
  status: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  arrivedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

---

## visitor-qr-pass.entity.ts

```ts
export interface VisitorQrPassEntity {
  id: string;
  visitId: string;
  qrToken: string;
  expiresAt: Date;
  generatedAt: Date;
  scannedAt?: Date;
  status: string;
  metadata?: Record<string, any>;
}
```

---

## visitor-status-history.entity.ts

```ts
export interface VisitorStatusHistoryEntity {
  id: string;
  visitId: string;
  previousStatus?: string;
  newStatus: string;
  changedByPersonId?: string;
  changeReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## visitor-plugin-setting.entity.ts

```ts
export interface VisitorPluginSettingEntity {
  id: string;
  propertyId?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

# Repository Methods

File:

```text
visitor.repository.ts
```

Required methods:

```ts
findVisitorByMobile(mobile: string)

createVisitor(data)

createVisit(data)

updateVisitStatus(visitId, status, updates)

createQrPass(data)

findQrPassByToken(qrToken)

findVisitById(visitId)

listVisits(filters)

createStatusHistory(data)

getVisitHistory(visitId)

getSettings(propertyId)

updateSettings(propertyId, settings)
```

---

# Service Methods

File:

```text
visitor.service.ts
```

Required methods:

```ts
inviteVisitor(dto: CreateVisitorInviteDto)

approveVisitor(visitId: string, dto: ApproveVisitorDto)

rejectVisitor(visitId: string, dto: RejectVisitorDto)

generateQrPass(visitId: string)

validateQr(dto: ValidateQrDto)

markArrived(visitId: string)

checkInVisitor(visitId: string, dto: CheckInVisitorDto)

checkOutVisitor(visitId: string, dto: CheckOutVisitorDto)

cancelVisitor(visitId: string, reason: string)

getVisit(visitId: string)

listVisits(filters)

getHistory(visitId: string)

getSettings(propertyId?: string)

updateSettings(propertyId: string | undefined, dto: UpdateVisitorSettingsDto)
```

---

# Controller Routes

File:

```text
visitor.controller.ts
```

Base route:

```text
/plugins/visitor
```

Routes:

```text
POST   /invite
POST   /:visitId/approve
POST   /:visitId/reject
POST   /:visitId/generate-qr
POST   /:visitId/arrive
POST   /:visitId/check-in
POST   /:visitId/check-out
POST   /:visitId/cancel
POST   /validate-qr

GET    /
GET    /:visitId
GET    /:visitId/history

GET    /settings
PATCH  /settings
```

---

# Migration SQL

File:

```text
migrations/001-create-visitor-plugin-tables.sql
```

```sql
CREATE TABLE visitors (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE visits (
    id UUID PRIMARY KEY,
    visitor_id UUID NOT NULL,
    property_id UUID NOT NULL,
    host_person_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    visit_purpose VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    arrived_at TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    expired_at TIMESTAMP,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_visit_visitor
        FOREIGN KEY (visitor_id)
        REFERENCES visitors(id)
);

CREATE TABLE visitor_qr_passes (
    id UUID PRIMARY KEY,
    visit_id UUID NOT NULL,
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    scanned_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB,
    CONSTRAINT fk_qr_visit
        FOREIGN KEY (visit_id)
        REFERENCES visits(id)
);

CREATE TABLE visitor_status_history (
    id UUID PRIMARY KEY,
    visit_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_person_id UUID,
    change_reason VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_history_visit
        FOREIGN KEY (visit_id)
        REFERENCES visits(id)
);

CREATE TABLE visitor_plugin_settings (
    id UUID PRIMARY KEY,
    property_id UUID,
    settings JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitors_mobile
ON visitors(mobile);

CREATE INDEX idx_visitors_email
ON visitors(email);

CREATE INDEX idx_visits_property
ON visits(property_id);

CREATE INDEX idx_visits_host
ON visits(host_person_id);

CREATE INDEX idx_visits_status
ON visits(status);

CREATE INDEX idx_qr_token
ON visitor_qr_passes(qr_token);

CREATE INDEX idx_status_history_visit
ON visitor_status_history(visit_id);
```

---

# Event Publishing Requirements

Each service method must publish events.

| Service Method  | Event                                    |
| --------------- | ---------------------------------------- |
| inviteVisitor   | visitor.invited                          |
| approveVisitor  | visitor.approved                         |
| rejectVisitor   | visitor.rejected                         |
| generateQrPass  | visitor.qr_generated                     |
| validateQr      | visitor.qr_scanned or visitor.qr_invalid |
| markArrived     | visitor.arrived                          |
| checkInVisitor  | visitor.checked_in                       |
| checkOutVisitor | visitor.checked_out                      |
| cancelVisitor   | visitor.cancelled                        |

---

# Notification Requirements

Visitor Plugin should not directly send WhatsApp.

It should publish events.

Notification Module and WhatsApp Plugin should react.

---

# Audit Requirements

Visitor Plugin should not directly write audit records.

It should publish events.

Audit Module should listen and record.

---

# Validation Rules

```text
visitorName required
mobile required
visitDate required
hostPersonId required
propertyId required
qrToken required for QR validation
approved visitor required before check-in unless manual override is enabled later
checked_in required before check-out
cancelled visit cannot be checked in
expired visit cannot be checked in
```

---

# Status Transition Rules

Allowed transitions:

```text
draft → invited
invited → approved
invited → rejected
invited → cancelled
approved → arrived
approved → checked_in
arrived → checked_in
checked_in → checked_out
checked_out → completed
```

Blocked transitions:

```text
rejected → checked_in
cancelled → checked_in
expired → checked_in
checked_out → checked_in
```

---

# Backend Agent Prompt

Use this prompt for Claude Backend Agent:

```text
You are the Backend Agent for PropertyOS.

Build the Visitor Plugin scaffolding in NestJS using the attached documents:
- Visitor Plugin PRD
- Visitor Plugin User Stories
- Visitor Plugin Database Design
- Visitor Plugin API Contracts
- Visitor Plugin Event Definitions
- Plugin SDK Design
- NestJS Module Layout

Rules:
1. Do not change PropertyOS Core architecture.
2. Do not hardcode any specific property name.
3. Keep Visitor Plugin property-neutral.
4. Use /plugins/visitor route prefix.
5. Use DTOs for all requests.
6. Use service layer for business logic.
7. Use repository layer for database access.
8. Publish visitor lifecycle events through Event Bus.
9. Do not send WhatsApp directly.
10. Do not write audit logs directly.
11. Do not implement future features.
12. Generate only Version 0.1 scaffolding.

Output:
- Folder structure
- Files to create
- TypeScript code
- SQL migration
- Basic tests
- README update
```

---

# Implementation Order

```text
1. Create plugin folder
2. Add plugin.json
3. Add constants
4. Add DTOs
5. Add entities
6. Add migration SQL
7. Add repository
8. Add service
9. Add controller
10. Add module
11. Wire Event Bus
12. Add basic tests
13. Update README
```

---

# Version 0.1 Success Criteria

The scaffolding is successful when:

1. Visitor Plugin folder exists.
2. Manifest exists.
3. DTOs exist.
4. Entities exist.
5. Migration exists.
6. Controller routes exist.
7. Service methods exist.
8. Repository methods exist.
9. Events are published.
10. No property-specific logic exists.
11. Code is ready for Backend Agent implementation.

