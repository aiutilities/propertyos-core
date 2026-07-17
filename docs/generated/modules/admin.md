<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Admin

> Module ID: `admin`

## Overview

| Field | Value |
|---|---|
| Class | `AdminModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `13.0` |
| Blast radius | `0` |
| Dependency surface | `14` |
| Source | `backend/src/core/admin/admin.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 4 |
| Direct dependencies | 7 |
| Direct dependents | 0 |
| Transitive dependencies | 14 |
| Transitive dependents | 0 |

## Direct Dependencies

- `agreement`
- `invoice`
- `plugin`
- `property`
- `receipt`
- `rent`
- `tenant`

## Direct Dependents

_None_

## Transitive Impact

A change to `admin` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AdminController` | `/admin` | 4 | Bearer | `backend/src/core/admin/controllers/admin.controller.ts:7` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/admin/dashboard` | `dashboard` |  | `backend/src/core/admin/controllers/admin.controller.ts:19` |
| `GET` | `/admin/menu` | `menu` |  | `backend/src/core/admin/controllers/admin.controller.ts:27` |
| `GET` | `/admin/platform` | `platform` |  | `backend/src/core/admin/controllers/admin.controller.ts:11` |
| `GET` | `/admin/widgets` | `widgets` |  | `backend/src/core/admin/controllers/admin.controller.ts:35` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `AdminController` | `backend/src/core/admin/controllers/admin.controller.ts` |
| service | `AdminService` | `backend/src/core/admin/services/admin.service.ts` |
