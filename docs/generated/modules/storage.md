<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Storage

> Module ID: `storage`

## Overview

| Field | Value |
|---|---|
| Class | `StorageModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `41.5` |
| Blast radius | `18` |
| Dependency surface | `4` |
| Source | `backend/src/core/storage/storage.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 4 |
| Direct dependencies | 3 |
| Direct dependents | 3 |
| Transitive dependencies | 4 |
| Transitive dependents | 18 |

## Direct Dependencies

- `configuration`
- `database:database`
- `identity`

## Direct Dependents

- `health`
- `plugin`
- `upload`

## Transitive Impact

A change to `storage` can potentially affect **18** modules transitively.

- `access-control`
- `admin`
- `communications`
- `facility`
- `health`
- `helpdesk`
- `inventory`
- `maintenance`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `reservation`
- `staff`
- `upload`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `StorageController` | `/storage` | 4 | Bearer | `backend/src/core/storage/controllers/storage.controller.ts:14` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/storage/objects` | `list` | `Permissions.STORAGE_READ` | `backend/src/core/storage/controllers/storage.controller.ts:30` |
| `POST` | `/storage/objects` | `store` | `Permissions.STORAGE_CREATE` | `backend/src/core/storage/controllers/storage.controller.ts:19` |
| `DELETE` | `/storage/objects/:id` | `delete` | `Permissions.STORAGE_CREATE` | `backend/src/core/storage/controllers/storage.controller.ts:49` |
| `GET` | `/storage/objects/:id/content` | `getContent` | `Permissions.STORAGE_READ` | `backend/src/core/storage/controllers/storage.controller.ts:41` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `StorageController` | `backend/src/core/storage/controllers/storage.controller.ts` |
| service | `StorageService` | `backend/src/core/storage/services/storage.service.ts` |
