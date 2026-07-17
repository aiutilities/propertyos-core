<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Maintenance

> Module ID: `maintenance`

## Overview

| Field | Value |
|---|---|
| Class | `MaintenanceModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `21.75` |
| Blast radius | `0` |
| Dependency surface | `14` |
| Source | `backend/src/core/maintenance/maintenance.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 6 |
| Controllers | 1 |
| Routes | 9 |
| Direct dependencies | 9 |
| Direct dependents | 0 |
| Transitive dependencies | 14 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `identity`
- `plugin`
- `scheduler`
- `search`
- `workflow`

## Direct Dependents

_None_

## Transitive Impact

A change to `maintenance` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `21.75` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `MaintenanceController` | `/maintenance` | 9 | Bearer | `backend/src/core/maintenance/controllers/maintenance.controller.ts:35` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/maintenance` | `list` | `MAINTENANCE_PERMISSIONS.READ` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:50` |
| `POST` | `/maintenance` | `create` | `MAINTENANCE_PERMISSIONS.CREATE` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:42` |
| `GET` | `/maintenance/:id` | `get` | `MAINTENANCE_PERMISSIONS.READ` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:94` |
| `PATCH` | `/maintenance/:id` | `update` | `MAINTENANCE_PERMISSIONS.MANAGE` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:102` |
| `POST` | `/maintenance/:id/assign` | `assign` | `MAINTENANCE_PERMISSIONS.MANAGE` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:113` |
| `GET` | `/maintenance/:id/history` | `history` | `MAINTENANCE_PERMISSIONS.READ` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:135` |
| `POST` | `/maintenance/:id/transition` | `transition` | `MAINTENANCE_PERMISSIONS.MANAGE` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:124` |
| `GET` | `/maintenance/categories` | `listCategories` | `MAINTENANCE_PERMISSIONS.READ` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:76` |
| `GET` | `/maintenance/metrics` | `getMetrics` | `MAINTENANCE_PERMISSIONS.READ` | `backend/src/core/maintenance/controllers/maintenance.controller.ts:84` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `MaintenanceBootstrapService` | `backend/src/core/maintenance/bootstrap/maintenance-bootstrap.service.ts` |
| bootstrap-service | `MaintenanceWorkflowBootstrapService` | `backend/src/core/maintenance/bootstrap/maintenance-workflow-bootstrap.service.ts` |
| controller | `MaintenanceController` | `backend/src/core/maintenance/controllers/maintenance.controller.ts` |
| search-provider | `MaintenanceSearchProviderService` | `backend/src/core/maintenance/maintenance-search-provider.service.ts` |
| service | `MaintenanceService` | `backend/src/core/maintenance/services/maintenance.service.ts` |
| service | `MaintenanceSlaService` | `backend/src/core/maintenance/services/maintenance-sla.service.ts` |
