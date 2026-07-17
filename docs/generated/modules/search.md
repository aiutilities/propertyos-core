<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Search

> Module ID: `search`

## Overview

| Field | Value |
|---|---|
| Class | `SearchModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `87.85` |
| Blast radius | `22` |
| Dependency surface | `3` |
| Source | `backend/src/core/search/search.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 2 |
| Direct dependencies | 2 |
| Direct dependents | 17 |
| Transitive dependencies | 3 |
| Transitive dependents | 22 |

## Direct Dependencies

- `eventbus`
- `identity`

## Direct Dependents

- `access-control`
- `agreement`
- `communications`
- `document`
- `facility`
- `helpdesk`
- `inventory`
- `maintenance`
- `plugin`
- `plugin:visitor`
- `property`
- `rent`
- `reservation`
- `staff`
- `tenant`
- `vehicle`
- `workflow`

## Transitive Impact

A change to `search` can potentially affect **22** modules transitively.

- `access-control`
- `admin`
- `agreement`
- `communications`
- `document`
- `facility`
- `health`
- `helpdesk`
- `inventory`
- `maintenance`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `property`
- `rent`
- `reservation`
- `staff`
- `tenant`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `SearchController` | `/search` | 2 | Bearer | `backend/src/core/search/controllers/search.controller.ts:13` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/search` | `search` | `Permissions.SEARCH_READ` | `backend/src/core/search/controllers/search.controller.ts:18` |
| `GET` | `/search/providers` | `providers` | `Permissions.SEARCH_READ` | `backend/src/core/search/controllers/search.controller.ts:24` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `SearchController` | `backend/src/core/search/controllers/search.controller.ts` |
| service | `SearchService` | `backend/src/core/search/services/search.service.ts` |
