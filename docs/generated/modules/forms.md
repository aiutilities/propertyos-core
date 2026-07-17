<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Forms

> Module ID: `forms`

## Overview

| Field | Value |
|---|---|
| Class | `FormsModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `4.6` |
| Blast radius | `0` |
| Dependency surface | `3` |
| Source | `backend/src/core/forms/forms.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 7 |
| Direct dependencies | 2 |
| Direct dependents | 0 |
| Transitive dependencies | 3 |
| Transitive dependents | 0 |

## Direct Dependencies

- `database:database`
- `eventbus`

## Direct Dependents

_None_

## Transitive Impact

A change to `forms` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `FormsController` | `/forms` | 7 | Bearer | `backend/src/core/forms/controllers/forms.controller.ts:10` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/forms` | `list` |  | `backend/src/core/forms/controllers/forms.controller.ts:14` |
| `POST` | `/forms` | `create` |  | `backend/src/core/forms/controllers/forms.controller.ts:32` |
| `GET` | `/forms/:id` | `get` |  | `backend/src/core/forms/controllers/forms.controller.ts:27` |
| `PATCH` | `/forms/:id/status` | `updateStatus` |  | `backend/src/core/forms/controllers/forms.controller.ts:37` |
| `GET` | `/forms/:id/submissions` | `listSubmissions` |  | `backend/src/core/forms/controllers/forms.controller.ts:53` |
| `POST` | `/forms/:id/submit` | `submit` |  | `backend/src/core/forms/controllers/forms.controller.ts:45` |
| `GET` | `/forms/code/:code` | `getByCode` |  | `backend/src/core/forms/controllers/forms.controller.ts:22` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `FormsController` | `backend/src/core/forms/controllers/forms.controller.ts` |
| service | `FormsService` | `backend/src/core/forms/services/forms.service.ts` |
