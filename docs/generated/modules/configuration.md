<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Configuration

> Module ID: `configuration`

## Overview

| Field | Value |
|---|---|
| Class | `ConfigurationModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `40.45` |
| Blast radius | `19` |
| Dependency surface | `2` |
| Source | `backend/src/core/configuration/configuration.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 5 |
| Direct dependencies | 1 |
| Direct dependents | 3 |
| Transitive dependencies | 2 |
| Transitive dependents | 19 |

## Direct Dependencies

- `database:database`

## Direct Dependents

- `health`
- `storage`
- `upload`

## Transitive Impact

A change to `configuration` can potentially affect **19** modules transitively.

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
- `storage`
- `upload`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `ConfigurationController` | `/configuration` | 5 | Bearer | `backend/src/core/configuration/controllers/configuration.controller.ts:19` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/configuration/settings` | `list` |  | `backend/src/core/configuration/controllers/configuration.controller.ts:35` |
| `POST` | `/configuration/settings` | `upsert` |  | `backend/src/core/configuration/controllers/configuration.controller.ts:25` |
| `DELETE` | `/configuration/settings/:id` | `delete` |  | `backend/src/core/configuration/controllers/configuration.controller.ts:79` |
| `PATCH` | `/configuration/settings/:id` | `update` |  | `backend/src/core/configuration/controllers/configuration.controller.ts:66` |
| `GET` | `/configuration/settings/:scopeType/:key` | `getByScopeAndKey` |  | `backend/src/core/configuration/controllers/configuration.controller.ts:48` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `ConfigurationController` | `backend/src/core/configuration/controllers/configuration.controller.ts` |
| service | `ConfigurationService` | `backend/src/core/configuration/services/configuration.service.ts` |
