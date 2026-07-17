<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Audit

> Module ID: `audit`

## Overview

| Field | Value |
|---|---|
| Class | `AuditModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `54.35` |
| Blast radius | `11` |
| Dependency surface | `3` |
| Source | `backend/src/core/audit/audit.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 2 |
| Direct dependencies | 3 |
| Direct dependents | 11 |
| Transitive dependencies | 3 |
| Transitive dependents | 11 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`

## Direct Dependents

- `access-control`
- `communications`
- `facility`
- `helpdesk`
- `inventory`
- `maintenance`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`

## Transitive Impact

A change to `audit` can potentially affect **11** modules transitively.

- `access-control`
- `communications`
- `facility`
- `helpdesk`
- `inventory`
- `maintenance`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AuditController` | `/audit` | 2 | Bearer | `backend/src/core/audit/controllers/audit.controller.ts:13` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/audit` | `list` | `Permissions.AUDIT_READ` | `backend/src/core/audit/controllers/audit.controller.ts:18` |
| `GET` | `/audit/entity` | `listByEntity` | `Permissions.AUDIT_READ` | `backend/src/core/audit/controllers/audit.controller.ts:35` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `AuditController` | `backend/src/core/audit/controllers/audit.controller.ts` |
| service | `AuditService` | `backend/src/core/audit/audit.service.ts` |
