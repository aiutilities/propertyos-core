<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Property

> Module ID: `property`

## Overview

| Field | Value |
|---|---|
| Class | `PropertyModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `10.85` |
| Blast radius | `1` |
| Dependency surface | `4` |
| Source | `backend/src/core/property/property.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 8 |
| Direct dependencies | 3 |
| Direct dependents | 1 |
| Transitive dependencies | 4 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:postgres`
- `identity`
- `search`

## Direct Dependents

- `admin`

## Transitive Impact

A change to `property` can potentially affect **1** modules transitively.

- `admin`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `PropertyController` | `/properties` | 8 | Bearer | `backend/src/core/property/controllers/property.controller.ts:27` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/properties` | `listProperties` | `Permissions.PROPERTY_READ` | `backend/src/core/property/controllers/property.controller.ts:56` |
| `POST` | `/properties` | `createProperty` | `Permissions.PROPERTY_CREATE` | `backend/src/core/property/controllers/property.controller.ts:33` |
| `GET` | `/properties/:id` | `getProperty` | `Permissions.PROPERTY_READ` | `backend/src/core/property/controllers/property.controller.ts:62` |
| `PATCH` | `/properties/:id` | `updateProperty` | `Permissions.PROPERTY_CREATE` | `backend/src/core/property/controllers/property.controller.ts:70` |
| `GET` | `/properties/:propertyId/spaces` | `listSpaces` | `Permissions.PROPERTY_READ` | `backend/src/core/property/controllers/property.controller.ts:135` |
| `POST` | `/properties/:propertyId/spaces` | `createSpace` | `Permissions.PROPERTY_CREATE` | `backend/src/core/property/controllers/property.controller.ts:112` |
| `GET` | `/properties/:propertyId/zones` | `listZones` | `Permissions.PROPERTY_READ` | `backend/src/core/property/controllers/property.controller.ts:102` |
| `POST` | `/properties/:propertyId/zones` | `createZone` | `Permissions.PROPERTY_CREATE` | `backend/src/core/property/controllers/property.controller.ts:81` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `PropertyController` | `backend/src/core/property/controllers/property.controller.ts` |
| search-provider | `PropertySearchProviderService` | `backend/src/core/property/property-search-provider.service.ts` |
| service | `PropertyService` | `backend/src/core/property/services/property.service.ts` |
