<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Receipt

> Module ID: `receipt`

## Overview

| Field | Value |
|---|---|
| Class | `ReceiptModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `14.5` |
| Blast radius | `1` |
| Dependency surface | `3` |
| Source | `backend/src/core/receipt/receipt.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 3 |
| Direct dependencies | 3 |
| Direct dependents | 1 |
| Transitive dependencies | 3 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`

## Direct Dependents

- `admin`

## Transitive Impact

A change to `receipt` can potentially affect **1** modules transitively.

- `admin`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `14.5` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `ReceiptController` | `/receipts` | 3 | Bearer | `backend/src/core/receipt/controllers/receipt.controller.ts:22` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/receipts` | `findAll` | `Permissions.RECEIPT_READ` | `backend/src/core/receipt/controllers/receipt.controller.ts:33` |
| `POST` | `/receipts` | `create` | `Permissions.RECEIPT_CREATE` | `backend/src/core/receipt/controllers/receipt.controller.ts:27` |
| `GET` | `/receipts/:id` | `findById` | `Permissions.RECEIPT_READ` | `backend/src/core/receipt/controllers/receipt.controller.ts:42` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `ReceiptController` | `backend/src/core/receipt/controllers/receipt.controller.ts` |
| service | `ReceiptService` | `backend/src/core/receipt/services/receipt.service.ts` |
