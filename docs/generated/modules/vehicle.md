<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Vehicle

> Module ID: `vehicle`

## Overview

| Field | Value |
|---|---|
| Class | `VehicleModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `17.7` |
| Blast radius | `0` |
| Dependency surface | `10` |
| Source | `backend/src/core/vehicle/vehicle.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 8 |
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

A change to `vehicle` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `17.7` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `VehicleController` | `/vehicles` | 8 | Bearer | `backend/src/core/vehicle/controllers/vehicle.controller.ts:39` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/vehicles` | `list` | `VEHICLE_PERMISSIONS.READ` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:49` |
| `POST` | `/vehicles` | `create` | `VEHICLE_PERMISSIONS.CREATE` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:78` |
| `GET` | `/vehicles/:id` | `get` | `VEHICLE_PERMISSIONS.READ` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:120` |
| `PATCH` | `/vehicles/:id` | `update` | `VEHICLE_PERMISSIONS.MANAGE` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:130` |
| `POST` | `/vehicles/:id/movements` | `recordMovement` | `VEHICLE_PERMISSIONS.SECURITY` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:162` |
| `POST` | `/vehicles/:id/status` | `updateStatus` | `VEHICLE_PERMISSIONS.MANAGE` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:146` |
| `GET` | `/vehicles/lookup/:registrationNumber` | `lookup` | `VEHICLE_PERMISSIONS.SECURITY` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:104` |
| `GET` | `/vehicles/metrics` | `metrics` | `VEHICLE_PERMISSIONS.READ` | `backend/src/core/vehicle/controllers/vehicle.controller.ts:90` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `VehicleBootstrapService` | `backend/src/core/vehicle/bootstrap/vehicle-bootstrap.service.ts` |
| controller | `VehicleController` | `backend/src/core/vehicle/controllers/vehicle.controller.ts` |
| search-provider | `VehicleSearchProviderService` | `backend/src/core/vehicle/vehicle-search-provider.service.ts` |
| service | `VehicleService` | `backend/src/core/vehicle/services/vehicle.service.ts` |
