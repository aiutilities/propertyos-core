<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Helpdesk

> Module ID: `helpdesk`

## Overview

| Field | Value |
|---|---|
| Class | `HelpdeskModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `20.35` |
| Blast radius | `0` |
| Dependency surface | `13` |
| Source | `backend/src/core/helpdesk/helpdesk.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 5 |
| Controllers | 1 |
| Routes | 17 |
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

A change to `helpdesk` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `20.35` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `HelpdeskController` | `/helpdesk` | 17 | Bearer | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:37` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/helpdesk` | `list` | `HELPDESK_PERMISSIONS.READ` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:54` |
| `POST` | `/helpdesk` | `create` | `HELPDESK_PERMISSIONS.CREATE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:44` |
| `GET` | `/helpdesk/:id` | `get` | `HELPDESK_PERMISSIONS.READ` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:105` |
| `PATCH` | `/helpdesk/:id` | `update` | `HELPDESK_PERMISSIONS.MANAGE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:113` |
| `POST` | `/helpdesk/:id/assign` | `assign` | `HELPDESK_PERMISSIONS.ASSIGN` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:124` |
| `POST` | `/helpdesk/:id/cancel` | `cancel` | `HELPDESK_PERMISSIONS.RESOLVE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:193` |
| `POST` | `/helpdesk/:id/close` | `close` | `HELPDESK_PERMISSIONS.RESOLVE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:182` |
| `POST` | `/helpdesk/:id/comments` | `addComment` | `HELPDESK_PERMISSIONS.COMMENT` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:204` |
| `POST` | `/helpdesk/:id/escalate` | `escalate` | `HELPDESK_PERMISSIONS.MANAGE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:149` |
| `POST` | `/helpdesk/:id/feedback` | `submitFeedback` | `HELPDESK_PERMISSIONS.CREATE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:232` |
| `GET` | `/helpdesk/:id/history` | `history` | `HELPDESK_PERMISSIONS.READ` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:246` |
| `POST` | `/helpdesk/:id/reopen` | `reopen` | `HELPDESK_PERMISSIONS.RESOLVE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:171` |
| `POST` | `/helpdesk/:id/resolve` | `resolve` | `HELPDESK_PERMISSIONS.RESOLVE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:160` |
| `POST` | `/helpdesk/:id/start-progress` | `startProgress` | `HELPDESK_PERMISSIONS.MANAGE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:135` |
| `POST` | `/helpdesk/:id/worklogs` | `addWorklog` | `HELPDESK_PERMISSIONS.MANAGE` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:218` |
| `GET` | `/helpdesk/categories` | `listCategories` | `HELPDESK_PERMISSIONS.READ` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:85` |
| `GET` | `/helpdesk/metrics` | `getMetrics` | `HELPDESK_PERMISSIONS.READ` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts:93` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `HelpdeskBootstrapService` | `backend/src/core/helpdesk/bootstrap/helpdesk-bootstrap.service.ts` |
| controller | `HelpdeskController` | `backend/src/core/helpdesk/controllers/helpdesk.controller.ts` |
| search-provider | `HelpdeskSearchProviderService` | `backend/src/core/helpdesk/helpdesk-search-provider.service.ts` |
| service | `HelpdeskService` | `backend/src/core/helpdesk/services/helpdesk.service.ts` |
| service | `HelpdeskSlaService` | `backend/src/core/helpdesk/services/helpdesk-sla.service.ts` |
