<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Reservation

> Module ID: `reservation`

## Overview

| Field | Value |
|---|---|
| Class | `ReservationModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `22.1` |
| Blast radius | `0` |
| Dependency surface | `14` |
| Source | `backend/src/core/reservation/reservation.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 6 |
| Controllers | 1 |
| Routes | 18 |
| Direct dependencies | 8 |
| Direct dependents | 0 |
| Transitive dependencies | 14 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `plugin`
- `scheduler`
- `search`
- `workflow`

## Direct Dependents

_None_

## Transitive Impact

A change to `reservation` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `22.1` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `ReservationController` | `/reservations` | 18 | Bearer | `backend/src/core/reservation/controllers/reservation.controller.ts:72` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/reservations` | `listReservations` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:209` |
| `POST` | `/reservations` | `createReservation` | `RESERVATION_PERMISSIONS.CREATE` | `backend/src/core/reservation/controllers/reservation.controller.ts:252` |
| `GET` | `/reservations/:id` | `getReservation` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:280` |
| `PATCH` | `/reservations/:id` | `updateReservation` | `RESERVATION_PERMISSIONS.UPDATE` | `backend/src/core/reservation/controllers/reservation.controller.ts:293` |
| `POST` | `/reservations/:id/approve` | `approve` | `RESERVATION_PERMISSIONS.APPROVE` | `backend/src/core/reservation/controllers/reservation.controller.ts:308` |
| `POST` | `/reservations/:id/cancel` | `cancel` | `RESERVATION_PERMISSIONS.CANCEL` | `backend/src/core/reservation/controllers/reservation.controller.ts:338` |
| `POST` | `/reservations/:id/check-in` | `checkIn` | `RESERVATION_PERMISSIONS.MANAGE` | `backend/src/core/reservation/controllers/reservation.controller.ts:353` |
| `POST` | `/reservations/:id/complete` | `complete` | `RESERVATION_PERMISSIONS.MANAGE` | `backend/src/core/reservation/controllers/reservation.controller.ts:368` |
| `POST` | `/reservations/:id/no-show` | `markNoShow` | `RESERVATION_PERMISSIONS.MANAGE` | `backend/src/core/reservation/controllers/reservation.controller.ts:383` |
| `POST` | `/reservations/:id/reject` | `reject` | `RESERVATION_PERMISSIONS.APPROVE` | `backend/src/core/reservation/controllers/reservation.controller.ts:323` |
| `POST` | `/reservations/availability` | `checkAvailability` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:195` |
| `GET` | `/reservations/metrics` | `metrics` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:266` |
| `GET` | `/reservations/resources` | `listResources` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:82` |
| `POST` | `/reservations/resources` | `createResource` | `RESERVATION_PERMISSIONS.CREATE` | `backend/src/core/reservation/controllers/reservation.controller.ts:117` |
| `GET` | `/reservations/resources/:id` | `getResource` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:131` |
| `PATCH` | `/reservations/resources/:id` | `updateResource` | `RESERVATION_PERMISSIONS.UPDATE` | `backend/src/core/reservation/controllers/reservation.controller.ts:144` |
| `GET` | `/reservations/resources/:id/blocks` | `listResourceBlocks` | `RESERVATION_PERMISSIONS.READ` | `backend/src/core/reservation/controllers/reservation.controller.ts:174` |
| `POST` | `/reservations/resources/:id/blocks` | `createResourceBlock` | `RESERVATION_PERMISSIONS.CREATE` | `backend/src/core/reservation/controllers/reservation.controller.ts:159` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `ReservationBootstrapService` | `backend/src/core/reservation/bootstrap/reservation-bootstrap.service.ts` |
| bootstrap-service | `ReservationWorkflowBootstrapService` | `backend/src/core/reservation/bootstrap/reservation-workflow-bootstrap.service.ts` |
| controller | `ReservationController` | `backend/src/core/reservation/controllers/reservation.controller.ts` |
| scheduler-service | `ReservationSchedulerService` | `backend/src/core/reservation/services/reservation-scheduler.service.ts` |
| search-provider | `ReservationSearchProviderService` | `backend/src/core/reservation/reservation-search-provider.service.ts` |
| service | `ReservationService` | `backend/src/core/reservation/services/reservation.service.ts` |
