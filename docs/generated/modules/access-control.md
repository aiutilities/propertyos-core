<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Access Control

> Module ID: `access-control`

## Overview

| Field | Value |
|---|---|
| Class | `AccessControlModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `medium` |
| Risk score | `13.65` |
| Blast radius | `0` |
| Dependency surface | `11` |
| Source | `backend/src/core/access-control/access-control.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 12 |
| Direct dependencies | 7 |
| Direct dependents | 0 |
| Transitive dependencies | 11 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `credential`
- `database:postgres`
- `eventbus`
- `plugin`
- `search`

## Direct Dependents

_None_

## Transitive Impact

A change to `access-control` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AccessControlController` | `/access-control` | 12 | Bearer | `backend/src/core/access-control/controllers/access-control.controller.ts:35` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/access-control/evaluate` | `evaluate` | `ACCESS_CONTROL_PERMISSIONS.OPERATE` | `backend/src/core/access-control/controllers/access-control.controller.ts:146` |
| `GET` | `/access-control/events` | `listEvents` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:152` |
| `GET` | `/access-control/grants` | `listGrants` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:103` |
| `POST` | `/access-control/grants` | `createGrant` | `ACCESS_CONTROL_PERMISSIONS.CREATE` | `backend/src/core/access-control/controllers/access-control.controller.ts:125` |
| `GET` | `/access-control/grants/:id` | `getGrant` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:131` |
| `POST` | `/access-control/grants/:id/revoke` | `revokeGrant` | `ACCESS_CONTROL_PERMISSIONS.MANAGE` | `backend/src/core/access-control/controllers/access-control.controller.ts:137` |
| `GET` | `/access-control/metrics` | `metrics` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:189` |
| `GET` | `/access-control/points` | `listAccessPoints` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:40` |
| `POST` | `/access-control/points` | `createAccessPoint` | `ACCESS_CONTROL_PERMISSIONS.CREATE` | `backend/src/core/access-control/controllers/access-control.controller.ts:68` |
| `GET` | `/access-control/points/:id` | `getAccessPoint` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:86` |
| `PATCH` | `/access-control/points/:id` | `updateAccessPoint` | `ACCESS_CONTROL_PERMISSIONS.MANAGE` | `backend/src/core/access-control/controllers/access-control.controller.ts:92` |
| `GET` | `/access-control/points/lookup/:code` | `lookupAccessPoint` | `ACCESS_CONTROL_PERMISSIONS.READ` | `backend/src/core/access-control/controllers/access-control.controller.ts:74` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `AccessControlBootstrapService` | `backend/src/core/access-control/bootstrap/access-control-bootstrap.service.ts` |
| controller | `AccessControlController` | `backend/src/core/access-control/controllers/access-control.controller.ts` |
| search-provider | `AccessControlSearchProviderService` | `backend/src/core/access-control/access-control-search-provider.service.ts` |
| service | `AccessControlService` | `backend/src/core/access-control/services/access-control.service.ts` |
