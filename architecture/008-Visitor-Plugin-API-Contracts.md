# Visitor Plugin API Contracts

## PropertyOS Version 0.1

---

# Purpose

This document defines the REST API contracts for the Visitor Plugin.

The API layer must remain:

* Property-neutral
* Consistent
* Versionable
* DTO-driven
* Event-driven

Base Route:

```text
/plugins/visitor
```

---

# Standard API Response

## Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

---

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "VISITOR_NOT_FOUND",
    "message": "Visitor not found"
  }
}
```

---

# Visitor DTOs

## Create Visitor Invite Request

### Endpoint

```http
POST /plugins/visitor/invite
```

### Request

```json
{
  "visitorName": "Ravi Kumar",
  "mobile": "+919999999999",
  "email": "ravi@example.com",
  "visitDate": "2026-07-15",
  "visitPurpose": "Business Meeting",
  "hostPersonId": "person_001",
  "propertyId": "property_001"
}
```

### Validation

```text
visitorName required
mobile required
visitDate required
hostPersonId required
propertyId required
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "visitorId": "visitor_001",
    "status": "invited"
  }
}
```

---

# Approve Visitor

### Endpoint

```http
POST /plugins/visitor/{visitId}/approve
```

### Request

```json
{
  "remarks": "Approved"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "approved"
  }
}
```

---

# Reject Visitor

### Endpoint

```http
POST /plugins/visitor/{visitId}/reject
```

### Request

```json
{
  "reason": "Host unavailable"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "rejected"
  }
}
```

---

# Generate QR Pass

### Endpoint

```http
POST /plugins/visitor/{visitId}/generate-qr
```

### Request

```json
{}
```

### Response

```json
{
  "success": true,
  "data": {
    "qrPassId": "qr_001",
    "qrToken": "abc123xyz",
    "expiresAt": "2026-07-15T18:00:00Z"
  }
}
```

---

# Visitor Arrival

### Endpoint

```http
POST /plugins/visitor/{visitId}/arrive
```

### Request

```json
{
  "arrivalTime": "2026-07-15T10:00:00Z"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "arrived"
  }
}
```

---

# Check-In Visitor

### Endpoint

```http
POST /plugins/visitor/{visitId}/check-in
```

### Request

```json
{
  "gate": "Main Gate",
  "securityPersonId": "person_010"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "checked_in",
    "checkedInAt": "2026-07-15T10:05:00Z"
  }
}
```

---

# Check-Out Visitor

### Endpoint

```http
POST /plugins/visitor/{visitId}/check-out
```

### Request

```json
{
  "gate": "Main Gate",
  "securityPersonId": "person_010"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "checked_out",
    "checkedOutAt": "2026-07-15T12:30:00Z"
  }
}
```

---

# Validate QR

### Endpoint

```http
POST /plugins/visitor/validate-qr
```

### Request

```json
{
  "qrToken": "abc123xyz"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "visitId": "visit_001",
    "visitorName": "Ravi Kumar",
    "status": "approved"
  }
}
```

### Failure Response

```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "QR_EXPIRED"
  }
}
```

---

# Get Visitor Details

### Endpoint

```http
GET /plugins/visitor/{visitId}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "visitorName": "Ravi Kumar",
    "mobile": "+919999999999",
    "visitDate": "2026-07-15",
    "status": "approved"
  }
}
```

---

# List Visitors

### Endpoint

```http
GET /plugins/visitor
```

### Query Parameters

```text
page
pageSize
status
propertyId
hostPersonId
visitDate
```

### Example

```http
GET /plugins/visitor?status=approved&page=1&pageSize=20
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

# Visitor History

### Endpoint

```http
GET /plugins/visitor/{visitId}/history
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "previousStatus": "invited",
      "newStatus": "approved",
      "createdAt": "2026-07-15T09:00:00Z"
    }
  ]
}
```

---

# Cancel Visitor

### Endpoint

```http
POST /plugins/visitor/{visitId}/cancel
```

### Request

```json
{
  "reason": "Meeting cancelled"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "visitId": "visit_001",
    "status": "cancelled"
  }
}
```

---

# Plugin Settings

## Get Settings

### Endpoint

```http
GET /plugins/visitor/settings
```

### Response

```json
{
  "success": true,
  "data": {
    "allowQrInvite": true,
    "hostApprovalRequired": false,
    "notifyHostOnCheckIn": true,
    "notifyHostOnCheckOut": true
  }
}
```

---

## Update Settings

### Endpoint

```http
PATCH /plugins/visitor/settings
```

### Request

```json
{
  "hostApprovalRequired": true
}
```

### Response

```json
{
  "success": true,
  "message": "Settings updated"
}
```

---

# Error Codes

Supported error codes:

```text
VISITOR_NOT_FOUND
VISIT_NOT_FOUND
INVALID_STATUS
QR_EXPIRED
QR_INVALID
QR_CANCELLED
PERMISSION_DENIED
PROPERTY_NOT_FOUND
HOST_NOT_FOUND
VALIDATION_ERROR
```

---

# Security Rules

All endpoints require:

```text
Authentication
Authorization
Permission Check
Audit Recording
```

Examples:

```text
visitor.create
visitor.read
visitor.approve
visitor.check_in
visitor.check_out
visitor.settings.manage
```

---

# Event Publishing Matrix

| API         | Event                |
| ----------- | -------------------- |
| Invite      | visitor.invited      |
| Approve     | visitor.approved     |
| Reject      | visitor.rejected     |
| Generate QR | visitor.qr_generated |
| Arrive      | visitor.arrived      |
| Check-In    | visitor.checked_in   |
| Check-Out   | visitor.checked_out  |
| Cancel      | visitor.cancelled    |

---

# Versioning Strategy

Current:

```text
v1
```

Route pattern:

```text
/api/v1/plugins/visitor
```

Versioning support should be built from day one.

---

# Version 0.1 Success Criteria

The API contract is successful when:

1. All visitor lifecycle actions are exposed.
2. DTOs are clearly defined.
3. Response structure is standardized.
4. Security requirements are identified.
5. Event publishing is mapped.
6. NestJS controllers can be generated directly from this document.

