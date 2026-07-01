# Audit Module Design

## 1. Purpose

The Audit Module is responsible for recording important activities that occur inside PropertyOS.

It provides accountability, traceability and compliance by maintaining a history of system actions.

Every significant action performed by users, administrators, plugins or the system should be auditable.

---

## 2. Why Audit Module Is Needed

PropertyOS will manage:

* Properties
* People
* Visitors
* Organizations
* Documents
* Permissions
* Plugins

For operational, security and legal reasons, the platform must be able to answer:

```text
Who did it?
What changed?
When did it happen?
Where did it happen?
Why did it happen?
```

Audit provides those answers.

---

## 3. Core Responsibilities

The Audit Module is responsible for:

1. Recording audit events
2. Recording user activity
3. Recording system activity
4. Recording plugin activity
5. Recording security activity
6. Recording document activity
7. Providing audit search
8. Publishing audit events

---

## 4. Initial Scope

Version 0.1 should support:

* Audit record creation
* Audit log storage
* Entity tracking
* Actor tracking
* Source tracking
* Event Bus integration
* Search APIs
* Read-only audit history

Do not build compliance reporting now.

Do not build legal retention policies now.

Do not build analytics now.

---

## 5. Audit Philosophy

Audit should be:

```text
Append-only
Immutable
Traceable
Reliable
Independent
```

Audit history should never be silently modified.

Corrections should generate new audit records.

---

## 6. Audit Record Structure

```ts
export interface AuditRecord {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorType?: string;
  actorId?: string;
  source: string;
  eventName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## 7. Example Audit Record

```json
{
  "id": "audit_001",
  "action": "visitor.checked_in",
  "entityType": "visitor",
  "entityId": "visitor_001",
  "actorType": "person",
  "actorId": "person_001",
  "source": "visitor-plugin",
  "eventName": "visitor.checked_in",
  "metadata": {
    "propertyId": "property_001",
    "securityDesk": "Gate A"
  },
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

## 8. Audit Categories

### Business Activity

```text
property.created
person.created
visitor.invited
visitor.checked_in
visitor.checked_out
```

### Security Activity

```text
login.failed
permission.denied
access.blocked
```

### Plugin Activity

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.uninstalled
```

### Document Activity

```text
document.uploaded
document.deleted
document.downloaded
```

### Notification Activity

```text
notification.sent
notification.failed
```

### System Activity

```text
system.started
system.stopped
system.error_detected
```

---

## 9. Audit Sources

Examples:

```text
identity-core
people-core
property-core
visitor-plugin
notification-core
document-core
plugin-engine
audit-core
system
```

Every audit record should identify its source.

---

## 10. Event Bus Integration

Audit Module should primarily listen to events.

Examples:

```text
property.created
zone.created
space.created
person.created
visitor.invited
visitor.checked_in
visitor.checked_out
plugin.installed
plugin.activated
plugin.deactivated
document.uploaded
document.deleted
notification.sent
notification.failed
```

When received:

```text
Event Bus
     ↓
Audit Module
     ↓
Create Audit Record
```

---

## 11. Audit Events

Audit Module may publish:

```text
audit.recorded
audit.failed
```

These events are mainly for operational visibility.

---

## 12. Backend Folder Structure

```text
backend/core/audit/
├── README.md
├── Audit-Module-Design.md
├── audit.module.ts
├── audit.service.ts
├── audit.controller.ts
├── audit.repository.ts
├── audit.types.ts
├── audit.constants.ts
└── dto/
    └── create-audit-record.dto.ts
```

---

## 13. Main Service Design

```ts
record(record: AuditRecord): Promise<void>

getAuditById(id: string): Promise<AuditRecord | null>

listAuditRecords(filters): Promise<AuditRecord[]>

searchAuditRecords(query): Promise<AuditRecord[]>
```

---

## 14. Audit Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  actor_type VARCHAR(100),
  actor_id VARCHAR(255),
  source VARCHAR(255) NOT NULL,
  event_name VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Indexes recommended:

```sql
CREATE INDEX idx_audit_action
ON audit_logs(action);

CREATE INDEX idx_audit_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_actor
ON audit_logs(actor_type, actor_id);

CREATE INDEX idx_audit_created_at
ON audit_logs(created_at);
```

---

## 15. Actor Tracking

Audit should capture who performed the action.

Examples:

```text
Admin User
Resident
Security Staff
System Process
Plugin Process
API Client
```

Example:

```json
{
  "actorType": "person",
  "actorId": "person_001"
}
```

System-generated:

```json
{
  "actorType": "system",
  "actorId": "propertyos"
}
```

---

## 16. Entity Tracking

Audit should identify what changed.

Examples:

```text
Property
Zone
Space
Person
Visitor
Document
Plugin
Organization
```

Example:

```json
{
  "entityType": "visitor",
  "entityId": "visitor_001"
}
```

---

## 17. Metadata Strategy

Metadata stores additional context.

Example:

```json
{
  "propertyId": "property_001",
  "zoneId": "zone_001",
  "ipAddress": "10.0.0.1"
}
```

Rules:

* Small payloads only
* No passwords
* No secrets
* No private keys
* No full identity documents

---

## 18. Search Capabilities

Version 0.1 should support filtering by:

```text
Action
Entity Type
Entity ID
Actor ID
Source
Date Range
```

Example:

```text
Show all visitor activity
Show all plugin activity
Show all actions by person_001
```

---

## 19. Read-Only Principle

Audit records should not be editable.

Bad:

```text
Update audit record
Delete audit record
```

Good:

```text
Create new correction audit record
```

History should remain trustworthy.

---

## 20. Audit And Notification Module

Notification Module publishes:

```text
notification.sent
notification.failed
```

Audit Module records them.

No direct coupling required.

---

## 21. Audit And Plugin Engine

Plugin Engine publishes:

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.uninstalled
```

Audit Module records them.

---

## 22. Audit And Document Module

Document Module publishes:

```text
document.uploaded
document.deleted
document.downloaded
```

Audit Module records them.

---

## 23. Audit And Identity Module

Identity Module publishes:

```text
login.success
login.failed
password.changed
role.assigned
permission.updated
```

Audit Module records them.

These are especially important for security.

---

## 24. Security Considerations

Audit logs may contain sensitive operational data.

Rules:

1. Audit is read-only.
2. Only authorized users may view audit logs.
3. Do not expose secrets.
4. Do not expose passwords.
5. Do not expose access tokens.
6. Log security events.
7. Protect audit integrity.

---

## 25. API Endpoints

Initial endpoints:

```text
GET /core/audit
GET /core/audit/:id
GET /core/audit/search
```

Version 0.1 does not require public audit creation endpoints.

Audit records should normally be generated internally.

---

## 26. Retention Strategy

Version 0.1:

```text
Keep all audit records.
```

Future versions may support:

```text
Retention rules
Archival
Export
Compliance policies
```

Do not implement now.

---

## 27. Future Enhancements

Future versions may support:

```text
Compliance reporting
Tamper detection
Digital signatures
SIEM integration
Audit exports
Retention policies
Security dashboards
Alerting
Forensic search
Audit analytics
```

Do not build these now.

---

## 28. Non-Goals

The Audit Module should not:

* Manage permissions
* Send notifications
* Store documents
* Replace Event Bus
* Replace Monitoring
* Replace Analytics
* Replace BI reporting

It only records trusted history.

---

## 29. Version 0.1 Success Criteria

The Audit Module is successful when:

1. Event Bus events are recorded.
2. Actor information can be stored.
3. Entity information can be stored.
4. Plugin activity is recorded.
5. Document activity is recorded.
6. Notification activity is recorded.
7. Security activity is recorded.
8. Audit history is searchable.
9. Audit records are immutable.
10. Admin can view audit history through backend APIs.

---

## 30. Simple Mental Model

Think of Audit Module as the black box recorder of PropertyOS.

Every important action says:

```text
I happened.
```

Audit Module says:

```text
I recorded it.
```

Later, if someone asks:

```text
Who did this?
When did it happen?
What changed?
```

Audit provides the answer.

That is the purpose of the Audit Module.

