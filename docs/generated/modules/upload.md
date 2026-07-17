<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Upload

> Module ID: `upload`

## Overview

| Field | Value |
|---|---|
| Class | `UploadModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `4.4` |
| Blast radius | `0` |
| Dependency surface | `5` |
| Source | `backend/src/core/upload/upload.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 1 |
| Direct dependencies | 2 |
| Direct dependents | 0 |
| Transitive dependencies | 5 |
| Transitive dependents | 0 |

## Direct Dependencies

- `configuration`
- `storage`

## Direct Dependents

_None_

## Transitive Impact

A change to `upload` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `UploadController` | `/uploads` | 1 | Bearer | `backend/src/core/upload/controllers/upload.controller.ts:8` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/uploads` | `upload` |  | `backend/src/core/upload/controllers/upload.controller.ts:12` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `UploadController` | `backend/src/core/upload/controllers/upload.controller.ts` |
| service | `UploadService` | `backend/src/core/upload/services/upload.service.ts` |
