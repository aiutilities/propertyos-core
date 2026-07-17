<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Staff

> Module ID: `staff`

## Overview

| Field | Value |
|---|---|
| Class | `StaffModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `18.0` |
| Blast radius | `0` |
| Dependency surface | `10` |
| Source | `backend/src/core/staff/staff.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 10 |
| Direct dependencies | 7 |
| Direct dependents | 0 |
| Transitive dependencies | 10 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `identity`
- `plugin`
- `search`

## Direct Dependents

_None_

## Transitive Impact

A change to `staff` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `18.0` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `StaffController` | `/staff` | 10 | Bearer | `backend/src/core/staff/controllers/staff.controller.ts:27` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/staff` | `list` | `STAFF_PERMISSIONS.READ` | `backend/src/core/staff/controllers/staff.controller.ts:32` |
| `POST` | `/staff` | `create` | `STAFF_PERMISSIONS.CREATE` | `backend/src/core/staff/controllers/staff.controller.ts:63` |
| `GET` | `/staff/:id` | `get` | `STAFF_PERMISSIONS.READ` | `backend/src/core/staff/controllers/staff.controller.ts:109` |
| `PATCH` | `/staff/:id` | `update` | `STAFF_PERMISSIONS.MANAGE` | `backend/src/core/staff/controllers/staff.controller.ts:115` |
| `POST` | `/staff/:id/attendance` | `recordAttendance` | `STAFF_PERMISSIONS.SECURITY` | `backend/src/core/staff/controllers/staff.controller.ts:130` |
| `POST` | `/staff/:id/status` | `updateStatus` | `STAFF_PERMISSIONS.MANAGE` | `backend/src/core/staff/controllers/staff.controller.ts:121` |
| `GET` | `/staff/lookup/employee/:employeeCode` | `lookupByEmployeeCode` | `STAFF_PERMISSIONS.SECURITY` | `backend/src/core/staff/controllers/staff.controller.ts:78` |
| `GET` | `/staff/lookup/qr/:qrCode` | `lookupByQrCode` | `STAFF_PERMISSIONS.SECURITY` | `backend/src/core/staff/controllers/staff.controller.ts:91` |
| `GET` | `/staff/lookup/rfid/:rfidTag` | `lookupByRfidTag` | `STAFF_PERMISSIONS.SECURITY` | `backend/src/core/staff/controllers/staff.controller.ts:100` |
| `GET` | `/staff/metrics` | `metrics` | `STAFF_PERMISSIONS.READ` | `backend/src/core/staff/controllers/staff.controller.ts:69` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `StaffBootstrapService` | `backend/src/core/staff/bootstrap/staff-bootstrap.service.ts` |
| controller | `StaffController` | `backend/src/core/staff/controllers/staff.controller.ts` |
| search-provider | `StaffSearchProviderService` | `backend/src/core/staff/staff-search-provider.service.ts` |
| service | `StaffService` | `backend/src/core/staff/services/staff.service.ts` |
