<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Communications

> Module ID: `communications`

## Overview

| Field | Value |
|---|---|
| Class | `CommunicationsModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `20.2` |
| Blast radius | `0` |
| Dependency surface | `13` |
| Source | `backend/src/core/communications/communications.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 5 |
| Controllers | 1 |
| Routes | 16 |
| Direct dependencies | 7 |
| Direct dependents | 0 |
| Transitive dependencies | 13 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `plugin`
- `scheduler`
- `search`

## Direct Dependents

_None_

## Transitive Impact

A change to `communications` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `20.2` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `CommunicationsController` | `/communications` | 16 | Bearer | `backend/src/core/communications/controllers/communications.controller.ts:65` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/communications` | `list` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:88` |
| `POST` | `/communications` | `create` | `COMMUNICATIONS_PERMISSIONS.CREATE` | `backend/src/core/communications/controllers/communications.controller.ts:75` |
| `GET` | `/communications/:id` | `get` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:152` |
| `PATCH` | `/communications/:id` | `update` | `COMMUNICATIONS_PERMISSIONS.MANAGE` | `backend/src/core/communications/controllers/communications.controller.ts:332` |
| `POST` | `/communications/:id/acknowledge` | `acknowledge` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:273` |
| `POST` | `/communications/:id/archive` | `archive` | `COMMUNICATIONS_PERMISSIONS.ARCHIVE` | `backend/src/core/communications/controllers/communications.controller.ts:219` |
| `POST` | `/communications/:id/cancel` | `cancel` | `COMMUNICATIONS_PERMISSIONS.ARCHIVE` | `backend/src/core/communications/controllers/communications.controller.ts:237` |
| `GET` | `/communications/:id/engagement` | `engagement` | `COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS` | `backend/src/core/communications/controllers/communications.controller.ts:304` |
| `POST` | `/communications/:id/expire` | `expire` | `COMMUNICATIONS_PERMISSIONS.PUBLISH` | `backend/src/core/communications/controllers/communications.controller.ts:201` |
| `GET` | `/communications/:id/history` | `history` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:319` |
| `POST` | `/communications/:id/publish` | `publish` | `COMMUNICATIONS_PERMISSIONS.PUBLISH` | `backend/src/core/communications/controllers/communications.controller.ts:183` |
| `POST` | `/communications/:id/read` | `markRead` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:255` |
| `GET` | `/communications/:id/reads` | `reads` | `COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS` | `backend/src/core/communications/controllers/communications.controller.ts:291` |
| `POST` | `/communications/:id/schedule` | `schedule` | `COMMUNICATIONS_PERMISSIONS.PUBLISH` | `backend/src/core/communications/controllers/communications.controller.ts:165` |
| `GET` | `/communications/categories` | `categories` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:127` |
| `GET` | `/communications/metrics` | `metrics` | `COMMUNICATIONS_PERMISSIONS.READ` | `backend/src/core/communications/controllers/communications.controller.ts:137` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `CommunicationsBootstrapService` | `backend/src/core/communications/bootstrap/communications-bootstrap.service.ts` |
| controller | `CommunicationsController` | `backend/src/core/communications/controllers/communications.controller.ts` |
| scheduler-service | `CommunicationsSchedulerService` | `backend/src/core/communications/services/communications-scheduler.service.ts` |
| search-provider | `CommunicationsSearchProviderService` | `backend/src/core/communications/communications-search-provider.service.ts` |
| service | `CommunicationsService` | `backend/src/core/communications/services/communications.service.ts` |
