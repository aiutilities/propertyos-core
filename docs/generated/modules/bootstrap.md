<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Bootstrap

> Module ID: `bootstrap`

## Overview

| Field | Value |
|---|---|
| Class | `BootstrapModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `2.5` |
| Blast radius | `0` |
| Dependency surface | `2` |
| Source | `backend/src/core/bootstrap/bootstrap.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 2 |
| Direct dependencies | 1 |
| Direct dependents | 0 |
| Transitive dependencies | 2 |
| Transitive dependents | 0 |

## Direct Dependencies

- `identity`

## Direct Dependents

_None_

## Transitive Impact

A change to `bootstrap` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `BootstrapController` | `/bootstrap` | 2 | None detected | `backend/src/core/bootstrap/controllers/bootstrap.controller.ts:8` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/bootstrap/setup` | `setup` |  | `backend/src/core/bootstrap/controllers/bootstrap.controller.ts:17` |
| `GET` | `/bootstrap/status` | `status` |  | `backend/src/core/bootstrap/controllers/bootstrap.controller.ts:12` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `BootstrapService` | `backend/src/core/bootstrap/services/bootstrap.service.ts` |
| controller | `BootstrapController` | `backend/src/core/bootstrap/controllers/bootstrap.controller.ts` |
