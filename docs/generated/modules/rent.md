<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Rent

> Module ID: `rent`

## Overview

| Field | Value |
|---|---|
| Class | `RentModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `16.4` |
| Blast radius | `1` |
| Dependency surface | `4` |
| Source | `backend/src/core/rent/rent.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 5 |
| Direct dependencies | 4 |
| Direct dependents | 1 |
| Transitive dependencies | 4 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`
- `search`

## Direct Dependents

- `admin`

## Transitive Impact

A change to `rent` can potentially affect **1** modules transitively.

- `admin`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `16.4` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `RentController` | `/rent-ledgers` | 5 | Bearer | `backend/src/core/rent/controllers/rent.controller.ts:22` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/rent-ledgers` | `listRentLedgers` | `'rent.read'` | `backend/src/core/rent/controllers/rent.controller.ts:38` |
| `POST` | `/rent-ledgers` | `createRentLedger` | `'rent.create'` | `backend/src/core/rent/controllers/rent.controller.ts:27` |
| `GET` | `/rent-ledgers/:id` | `getRentLedger` | `'rent.read'` | `backend/src/core/rent/controllers/rent.controller.ts:49` |
| `GET` | `/rent-ledgers/:id/payments` | `listPayments` | `'rent.read'` | `backend/src/core/rent/controllers/rent.controller.ts:74` |
| `POST` | `/rent-ledgers/:id/payments` | `postPayment` | `'rent.create'` | `backend/src/core/rent/controllers/rent.controller.ts:60` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `RentController` | `backend/src/core/rent/controllers/rent.controller.ts` |
| search-provider | `RentSearchProviderService` | `backend/src/core/rent/rent-search-provider.service.ts` |
| service | `RentService` | `backend/src/core/rent/services/rent.service.ts` |
