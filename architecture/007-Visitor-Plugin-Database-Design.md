# Visitor Plugin Database Design

## PropertyOS Version 0.1

---

# Purpose

This document defines the database schema for the Visitor Plugin.

The design must support:

* Visitor invitations
* Visitor approvals
* QR passes
* Check-in
* Check-out
* Visitor history
* Audit integration
* Event-driven architecture

The design must remain property-neutral and reusable across all PropertyOS deployments.

---

# Design Principles

1. Plugin owns visitor business data.
2. Core owns platform data.
3. UUID primary keys.
4. Soft delete preferred.
5. Event-driven lifecycle.
6. History preserved.
7. QR tokens never reused.

---

# Table Overview

```text
visitors
visits
visitor_qr_passes
visitor_status_history
visitor_plugin_settings
```

---

# VISITORS

Represents a person who may visit a property.

A visitor can have multiple visits over time.

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
```

---

# VISITS

Represents one visit attempt or visit lifecycle.

```sql
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
```

---

# Visit Status Values

Allowed values:

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

# VISITOR QR PASSES

Stores QR credentials associated with a visit.

```sql
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
```

---

# QR Status Values

```text
active
expired
used
cancelled
invalid
```

---

# VISITOR STATUS HISTORY

Tracks all state transitions.

This table becomes the source of truth for lifecycle history.

```sql
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
```

---

# Example Status History

```text
invited
   ↓
approved
   ↓
arrived
   ↓
checked_in
   ↓
checked_out
   ↓
completed
```

Every transition generates a history row.

---

# VISITOR PLUGIN SETTINGS

Stores plugin configuration.

```sql
CREATE TABLE visitor_plugin_settings (
    id UUID PRIMARY KEY,

    property_id UUID,

    settings JSONB NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# Example Settings

```json
{
  "allowQrInvite": true,
  "hostApprovalRequired": false,
  "notifyHostOnCheckIn": true,
  "notifyHostOnCheckOut": true,
  "defaultVisitDurationHours": 4
}
```

---

# Relationship Diagram

```text
Visitor
   ↓
Visit
   ↓
QR Pass

Visit
   ↓
Status History

Property
   ↓
Visitor Plugin Settings
```

---

# Visitor Reuse Strategy

A visitor should not be duplicated unnecessarily.

Before creating:

```text
Search by:
mobile
email
```

If existing visitor found:

```text
Reuse visitor record
Create new visit record
```

---

# Check-In Data

Stored in:

```text
visits.checked_in_at
```

Future enhancements:

```text
check_in_gate
security_person_id
device_id
```

Version 0.1 keeps schema minimal.

---

# Check-Out Data

Stored in:

```text
visits.checked_out_at
```

Future enhancements:

```text
check_out_gate
security_person_id
```

---

# Indexes

```sql
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

# Event Mapping

| Event                | Table Impact      |
| -------------------- | ----------------- |
| visitor.invited      | visits            |
| visitor.approved     | visits            |
| visitor.rejected     | visits            |
| visitor.arrived      | visits            |
| visitor.checked_in   | visits            |
| visitor.checked_out  | visits            |
| visitor.qr_generated | visitor_qr_passes |

---

# Soft Delete Strategy

Version 0.1:

```text
Use deleted_at
```

Never physically delete:

```text
visitors
visits
history
```

Historical integrity is important.

---

# Future Enhancements

Possible future tables:

```text
visitor_vehicles
visitor_documents
visitor_watchlists
visitor_approvals
visitor_access_rules
visitor_recurring_visits
```

Not part of Version 0.1.

---

# Version 0.1 Success Criteria

Database design is successful when:

1. Visitor can be invited.
2. Visitor can be approved.
3. QR can be generated.
4. QR can be validated.
5. Visitor can check in.
6. Visitor can check out.
7. Full status history exists.
8. Visitor history is searchable.
9. Multiple visits per visitor supported.
10. Property-neutral implementation achieved.

---

# Simple Mental Model

```text
Visitor
   ↓
Visit
   ↓
QR Pass

Visit
   ↓
Status History
```

The Visitor record represents the person.

The Visit record represents the visit.

The QR Pass represents entry authorization.

The Status History represents lifecycle tracking.

