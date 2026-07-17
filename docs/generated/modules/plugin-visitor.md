<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Visitor

> Module ID: `plugin:visitor`

## Overview

| Field | Value |
|---|---|
| Class | `VisitorModule` |
| Physical location | `plugin` |
| Architectural role | `plugin` |
| Expected location | `plugin` |
| Alignment | `aligned` |
| Criticality | `medium` |
| Risk score | `13.3` |
| Blast radius | `0` |
| Dependency surface | `12` |
| Source | `backend/src/plugins/visitor/visitor.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 14 |
| Direct dependencies | 6 |
| Direct dependents | 0 |
| Transitive dependencies | 12 |
| Transitive dependents | 0 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`
- `notification`
- `scheduler`
- `search`

## Direct Dependents

_None_

## Transitive Impact

A change to `plugin:visitor` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `VisitorController` | `/plugins/visitor` | 14 | Bearer | `backend/src/plugins/visitor/visitor.controller.ts:30` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/plugins/visitor` | `listVisitors` | `Permissions.VISITOR_READ` | `backend/src/plugins/visitor/visitor.controller.ts:104` |
| `GET` | `/plugins/visitor/:visitId` | `getVisit` | `Permissions.VISITOR_READ` | `backend/src/plugins/visitor/visitor.controller.ts:127` |
| `POST` | `/plugins/visitor/:visitId/approve` | `approveVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:41` |
| `POST` | `/plugins/visitor/:visitId/arrive` | `markArrived` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:65` |
| `POST` | `/plugins/visitor/:visitId/cancel` | `cancelVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:89` |
| `POST` | `/plugins/visitor/:visitId/check-in` | `checkInVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:71` |
| `POST` | `/plugins/visitor/:visitId/check-out` | `checkOutVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:80` |
| `POST` | `/plugins/visitor/:visitId/generate-qr` | `generateQrPass` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:59` |
| `GET` | `/plugins/visitor/:visitId/history` | `getHistory` | `Permissions.VISITOR_READ` | `backend/src/plugins/visitor/visitor.controller.ts:133` |
| `POST` | `/plugins/visitor/:visitId/reject` | `rejectVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:50` |
| `POST` | `/plugins/visitor/invite` | `inviteVisitor` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:35` |
| `GET` | `/plugins/visitor/settings` | `getSettings` | `Permissions.VISITOR_READ` | `backend/src/plugins/visitor/visitor.controller.ts:110` |
| `PATCH` | `/plugins/visitor/settings` | `updateSettings` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:116` |
| `POST` | `/plugins/visitor/validate-qr` | `validateQr` | `Permissions.VISITOR_CREATE` | `backend/src/plugins/visitor/visitor.controller.ts:98` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `VisitorNotificationBootstrapService` | `backend/src/plugins/visitor/bootstrap/visitor-notification-bootstrap.service.ts` |
| controller | `VisitorController` | `backend/src/plugins/visitor/visitor.controller.ts` |
| search-provider | `VisitorSearchProviderService` | `backend/src/plugins/visitor/visitor-search-provider.service.ts` |
| service | `VisitorService` | `backend/src/plugins/visitor/visitor.service.ts` |
