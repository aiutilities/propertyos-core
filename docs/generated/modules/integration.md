<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Integration

> Module ID: `integration`

## Overview

| Field | Value |
|---|---|
| Class | `IntegrationModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `3.25` |
| Blast radius | `0` |
| Dependency surface | `2` |
| Source | `backend/src/core/integration/integration.module.ts` |

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

A change to `integration` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `IntegrationController` | `/integrations` | 7 | Bearer | `backend/src/core/integration/controllers/integration.controller.ts:9` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/integrations` | `list` |  | `backend/src/core/integration/controllers/integration.controller.ts:23` |
| `POST` | `/integrations` | `register` |  | `backend/src/core/integration/controllers/integration.controller.ts:18` |
| `GET` | `/integrations/:id` | `get` |  | `backend/src/core/integration/controllers/integration.controller.ts:28` |
| `PATCH` | `/integrations/:id/activate` | `activate` |  | `backend/src/core/integration/controllers/integration.controller.ts:33` |
| `PATCH` | `/integrations/:id/deactivate` | `deactivate` |  | `backend/src/core/integration/controllers/integration.controller.ts:38` |
| `GET` | `/integrations/connectors` | `listConnectors` |  | `backend/src/core/integration/controllers/integration.controller.ts:13` |
| `POST` | `/integrations/execute` | `execute` |  | `backend/src/core/integration/controllers/integration.controller.ts:43` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `IntegrationController` | `backend/src/core/integration/controllers/integration.controller.ts` |
| service | `IntegrationService` | `backend/src/core/integration/services/integration.service.ts` |
