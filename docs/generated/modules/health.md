<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Health

> Module ID: `health`

## Overview

| Field | Value |
|---|---|
| Class | `HealthModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `13.65` |
| Blast radius | `0` |
| Dependency surface | `13` |
| Source | `backend/src/core/health/health.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 4 |
| Direct dependencies | 8 |
| Direct dependents | 0 |
| Transitive dependencies | 13 |
| Transitive dependents | 0 |

## Direct Dependencies

- `configuration`
- `database:database`
- `eventbus`
- `metrics`
- `plugin`
- `scheduler`
- `storage`
- `workflow`

## Direct Dependents

_None_

## Transitive Impact

A change to `health` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `HealthController` | `/health` | 4 | Bearer | `backend/src/core/health/health.controller.ts:7` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/health` | `getHealth` |  | `backend/src/core/health/health.controller.ts:11` |
| `GET` | `/health/database` | `getDatabaseHealth` |  | `backend/src/core/health/health.controller.ts:26` |
| `GET` | `/health/live` | `getLiveness` |  | `backend/src/core/health/health.controller.ts:16` |
| `GET` | `/health/ready` | `getReadiness` |  | `backend/src/core/health/health.controller.ts:21` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `HealthController` | `backend/src/core/health/health.controller.ts` |
| service | `HealthService` | `backend/src/core/health/health.service.ts` |
