<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Agreement

> Module ID: `agreement`

## Overview

| Field | Value |
|---|---|
| Class | `AgreementModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `16.25` |
| Blast radius | `1` |
| Dependency surface | `4` |
| Source | `backend/src/core/agreement/agreement.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 4 |
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

A change to `agreement` can potentially affect **1** modules transitively.

- `admin`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `16.25` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AgreementController` | `/agreements` | 4 | Bearer | `backend/src/core/agreement/controllers/agreement.controller.ts:21` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/agreements` | `listAgreements` | `'agreement.read'` | `backend/src/core/agreement/controllers/agreement.controller.ts:37` |
| `POST` | `/agreements` | `createAgreement` | `'agreement.create'` | `backend/src/core/agreement/controllers/agreement.controller.ts:26` |
| `GET` | `/agreements/:id` | `getAgreement` | `'agreement.read'` | `backend/src/core/agreement/controllers/agreement.controller.ts:48` |
| `GET` | `/agreements/:id/versions` | `listAgreementVersions` | `'agreement.read'` | `backend/src/core/agreement/controllers/agreement.controller.ts:59` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `AgreementController` | `backend/src/core/agreement/controllers/agreement.controller.ts` |
| search-provider | `AgreementSearchProviderService` | `backend/src/core/agreement/agreement-search-provider.service.ts` |
| service | `AgreementService` | `backend/src/core/agreement/services/agreement.service.ts` |
