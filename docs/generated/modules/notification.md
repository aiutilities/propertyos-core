<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Notification

> Module ID: `notification`

## Overview

| Field | Value |
|---|---|
| Class | `NotificationModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `12.6` |
| Blast radius | `1` |
| Dependency surface | `8` |
| Source | `backend/src/core/notification/notification.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 2 |
| Direct dependencies | 4 |
| Direct dependents | 1 |
| Transitive dependencies | 8 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:database`
- `eventbus`
- `identity`
- `plugin`

## Direct Dependents

- `plugin:visitor`

## Transitive Impact

A change to `notification` can potentially affect **1** modules transitively.

- `plugin:visitor`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `NotificationController` | `/notifications` | 2 | Bearer | `backend/src/core/notification/controllers/notification.controller.ts:11` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/notifications` | `listNotifications` | `'notification.read'` | `backend/src/core/notification/controllers/notification.controller.ts:30` |
| `GET` | `/notifications/templates` | `listTemplates` | `'notification.read'` | `backend/src/core/notification/controllers/notification.controller.ts:19` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `NotificationBootstrapService` | `backend/src/core/notification/bootstrap/notification-bootstrap.service.ts` |
| controller | `NotificationController` | `backend/src/core/notification/controllers/notification.controller.ts` |
| service | `NotificationDispatcherService` | `backend/src/core/notification/services/notification-dispatcher.service.ts` |
| service | `NotificationService` | `backend/src/core/notification/services/notification.service.ts` |
