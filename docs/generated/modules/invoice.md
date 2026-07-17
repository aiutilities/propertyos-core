<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Invoice

> Module ID: `invoice`

## Overview

| Field | Value |
|---|---|
| Class | `InvoiceModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `14.85` |
| Blast radius | `1` |
| Dependency surface | `4` |
| Source | `backend/src/core/invoice/invoice.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 3 |
| Direct dependencies | 3 |
| Direct dependents | 1 |
| Transitive dependencies | 4 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:database`
- `eventbus`
- `identity`

## Direct Dependents

- `admin`

## Transitive Impact

A change to `invoice` can potentially affect **1** modules transitively.

- `admin`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `14.85` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `InvoiceController` | `/invoices` | 3 | Bearer | `backend/src/core/invoice/controllers/invoice.controller.ts:21` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/invoices` | `findAll` | `'invoice.read'` | `backend/src/core/invoice/controllers/invoice.controller.ts:37` |
| `POST` | `/invoices` | `create` | `'invoice.create'` | `backend/src/core/invoice/controllers/invoice.controller.ts:26` |
| `GET` | `/invoices/:id` | `findById` | `'invoice.read'` | `backend/src/core/invoice/controllers/invoice.controller.ts:46` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `InvoiceController` | `backend/src/core/invoice/controllers/invoice.controller.ts` |
| service | `InvoiceService` | `backend/src/core/invoice/services/invoice.service.ts` |
