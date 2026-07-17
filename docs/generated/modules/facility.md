<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Facility

> Module ID: `facility`

## Overview

| Field | Value |
|---|---|
| Class | `FacilityModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `19.45` |
| Blast radius | `0` |
| Dependency surface | `11` |
| Source | `backend/src/core/facility/facility.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 5 |
| Controllers | 1 |
| Routes | 9 |
| Direct dependencies | 8 |
| Direct dependents | 0 |
| Transitive dependencies | 11 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `identity`
- `plugin`
- `search`
- `workflow`

## Direct Dependents

_None_

## Transitive Impact

A change to `facility` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `19.45` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `FacilityController` | `/facilities` | 9 | Bearer | `backend/src/core/facility/controllers/facility.controller.ts:33` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/facilities/assets` | `listAssets` | `FACILITY_PERMISSIONS.READ` | `backend/src/core/facility/controllers/facility.controller.ts:58` |
| `POST` | `/facilities/assets` | `createAsset` | `FACILITY_PERMISSIONS.CREATE` | `backend/src/core/facility/controllers/facility.controller.ts:82` |
| `GET` | `/facilities/assets/:id` | `getAsset` | `FACILITY_PERMISSIONS.READ` | `backend/src/core/facility/controllers/facility.controller.ts:102` |
| `PATCH` | `/facilities/assets/:id` | `updateAsset` | `FACILITY_PERMISSIONS.MANAGE` | `backend/src/core/facility/controllers/facility.controller.ts:110` |
| `POST` | `/facilities/assets/:id/preventive-plans` | `createPreventivePlan` | `FACILITY_PERMISSIONS.MANAGE` | `backend/src/core/facility/controllers/facility.controller.ts:135` |
| `POST` | `/facilities/assets/:id/transition` | `transitionAsset` | `FACILITY_PERMISSIONS.MANAGE` | `backend/src/core/facility/controllers/facility.controller.ts:121` |
| `GET` | `/facilities/assets/metrics` | `getMetrics` | `FACILITY_PERMISSIONS.READ` | `backend/src/core/facility/controllers/facility.controller.ts:92` |
| `GET` | `/facilities/categories` | `listCategories` | `FACILITY_PERMISSIONS.READ` | `backend/src/core/facility/controllers/facility.controller.ts:40` |
| `POST` | `/facilities/categories` | `createCategory` | `FACILITY_PERMISSIONS.MANAGE` | `backend/src/core/facility/controllers/facility.controller.ts:48` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `FacilityBootstrapService` | `backend/src/core/facility/bootstrap/facility-bootstrap.service.ts` |
| bootstrap-service | `FacilityWorkflowBootstrapService` | `backend/src/core/facility/bootstrap/facility-workflow-bootstrap.service.ts` |
| controller | `FacilityController` | `backend/src/core/facility/controllers/facility.controller.ts` |
| search-provider | `FacilitySearchProviderService` | `backend/src/core/facility/facility-search-provider.service.ts` |
| service | `FacilityService` | `backend/src/core/facility/services/facility.service.ts` |
