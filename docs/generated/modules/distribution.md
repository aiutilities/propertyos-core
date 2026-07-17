<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Distribution

> Module ID: `distribution`

## Overview

| Field | Value |
|---|---|
| Class | `DistributionModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `3.25` |
| Blast radius | `0` |
| Dependency surface | `2` |
| Source | `backend/src/core/distribution/distribution.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 7 |
| Direct dependencies | 1 |
| Direct dependents | 0 |
| Transitive dependencies | 2 |
| Transitive dependents | 0 |

## Direct Dependencies

- `eventbus`

## Direct Dependents

_None_

## Transitive Impact

A change to `distribution` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `DistributionController` | `/distributions` | 7 | Bearer | `backend/src/core/distribution/controllers/distribution.controller.ts:9` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/distributions` | `list` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:18` |
| `POST` | `/distributions` | `register` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:13` |
| `GET` | `/distributions/:id` | `get` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:28` |
| `PATCH` | `/distributions/:id/activate` | `activate` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:38` |
| `PATCH` | `/distributions/:id/archive` | `archive` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:43` |
| `GET` | `/distributions/active` | `getActive` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:23` |
| `PATCH` | `/distributions/install` | `install` |  | `backend/src/core/distribution/controllers/distribution.controller.ts:33` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `DistributionController` | `backend/src/core/distribution/controllers/distribution.controller.ts` |
| service | `DistributionService` | `backend/src/core/distribution/services/distribution.service.ts` |
