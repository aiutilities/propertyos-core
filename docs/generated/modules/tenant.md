<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Tenant

> Module ID: `tenant`

## Overview

| Field | Value |
|---|---|
| Class | `TenantModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `low` |
| Risk score | `16.75` |
| Blast radius | `1` |
| Dependency surface | `5` |
| Source | `backend/src/core/tenant/tenant.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 5 |
| Direct dependencies | 4 |
| Direct dependents | 1 |
| Transitive dependencies | 5 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:database`
- `eventbus`
- `identity`
- `search`

## Direct Dependents

- `admin`

## Transitive Impact

A change to `tenant` can potentially affect **1** modules transitively.

- `admin`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `low` |
| Risk score | `16.75` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `TenantController` | `/tenants` | 5 | Bearer | `backend/src/core/tenant/controllers/tenant.controller.ts:15` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/tenants` | `listTenants` | `Permissions.TENANT_READ` | `backend/src/core/tenant/controllers/tenant.controller.ts:36` |
| `POST` | `/tenants` | `createTenant` | `Permissions.TENANT_CREATE` | `backend/src/core/tenant/controllers/tenant.controller.ts:21` |
| `GET` | `/tenants/:id` | `getTenant` | `Permissions.TENANT_READ` | `backend/src/core/tenant/controllers/tenant.controller.ts:42` |
| `POST` | `/tenants/:tenantId/assign-space` | `assignSpace` | `Permissions.TENANT_CREATE` | `backend/src/core/tenant/controllers/tenant.controller.ts:48` |
| `GET` | `/tenants/:tenantId/spaces` | `listTenantSpaces` | `Permissions.TENANT_READ` | `backend/src/core/tenant/controllers/tenant.controller.ts:59` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `TenantController` | `backend/src/core/tenant/controllers/tenant.controller.ts` |
| search-provider | `TenantSearchProviderService` | `backend/src/core/tenant/tenant-search-provider.service.ts` |
| service | `TenantService` | `backend/src/core/tenant/services/tenant.service.ts` |
