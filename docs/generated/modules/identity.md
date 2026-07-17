<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Identity

> Module ID: `identity`

## Overview

| Field | Value |
|---|---|
| Class | `IdentityModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `critical` |
| Risk score | `124.55` |
| Blast radius | `34` |
| Dependency surface | `1` |
| Source | `backend/src/core/identity/identity.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 18 |
| Direct dependencies | 1 |
| Direct dependents | 23 |
| Transitive dependencies | 1 |
| Transitive dependents | 34 |

## Direct Dependencies

- `database:postgres`

## Direct Dependents

- `agreement`
- `audit`
- `auth`
- `bootstrap`
- `credential`
- `facility`
- `invoice`
- `maintenance`
- `metrics`
- `notification`
- `plugin`
- `plugin:visitor`
- `property`
- `receipt`
- `rent`
- `report`
- `scheduler`
- `search`
- `staff`
- `storage`
- `tenant`
- `vehicle`
- `workflow`

## Transitive Impact

A change to `identity` can potentially affect **34** modules transitively.

- `access-control`
- `admin`
- `agreement`
- `audit`
- `auth`
- `bootstrap`
- `communications`
- `credential`
- `document`
- `facility`
- `health`
- `helpdesk`
- `inventory`
- `invoice`
- `maintenance`
- `metrics`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `property`
- `receipt`
- `rent`
- `report`
- `reservation`
- `scheduler`
- `search`
- `staff`
- `storage`
- `tenant`
- `upload`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `IdentityController` | `/` | 18 | Bearer | `backend/src/core/identity/controllers/identity.controller.ts:27` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/credentials` | `listCredentials` | `Permissions.PERSON_READ` | `backend/src/core/identity/controllers/identity.controller.ts:173` |
| `POST` | `/credentials` | `createCredential` | `Permissions.PERSON_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:158` |
| `GET` | `/organizations` | `listOrganizations` | `Permissions.ORGANIZATION_READ` | `backend/src/core/identity/controllers/identity.controller.ts:73` |
| `POST` | `/organizations` | `createOrganization` | `Permissions.ORGANIZATION_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:61` |
| `GET` | `/organizations/:id` | `getOrganization` | `Permissions.ORGANIZATION_READ` | `backend/src/core/identity/controllers/identity.controller.ts:80` |
| `GET` | `/permissions` | `listPermissions` | `Permissions.PERMISSION_READ` | `backend/src/core/identity/controllers/identity.controller.ts:142` |
| `POST` | `/permissions` | `createPermission` | `Permissions.PERMISSION_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:132` |
| `GET` | `/permissions/:id` | `getPermission` | `Permissions.PERMISSION_READ` | `backend/src/core/identity/controllers/identity.controller.ts:149` |
| `GET` | `/persons` | `listPersons` | `Permissions.PERSON_READ` | `backend/src/core/identity/controllers/identity.controller.ts:45` |
| `POST` | `/persons` | `createPerson` | `Permissions.PERSON_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:33` |
| `GET` | `/persons/:id` | `getPerson` | `Permissions.PERSON_READ` | `backend/src/core/identity/controllers/identity.controller.ts:54` |
| `GET` | `/persons/:personId/roles` | `listPersonRoles` | `Permissions.ROLE_READ` | `backend/src/core/identity/controllers/identity.controller.ts:190` |
| `POST` | `/persons/:personId/roles` | `assignRoleToPerson` | `Permissions.ROLE_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:180` |
| `GET` | `/roles` | `listRoles` | `Permissions.ROLE_READ` | `backend/src/core/identity/controllers/identity.controller.ts:99` |
| `POST` | `/roles` | `createRole` | `Permissions.ROLE_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:89` |
| `GET` | `/roles/:id` | `getRole` | `Permissions.ROLE_READ` | `backend/src/core/identity/controllers/identity.controller.ts:106` |
| `GET` | `/roles/:roleId/permissions` | `listRolePermissions` | `Permissions.PERMISSION_READ` | `backend/src/core/identity/controllers/identity.controller.ts:123` |
| `POST` | `/roles/:roleId/permissions` | `assignPermissionToRole` | `Permissions.PERMISSION_CREATE` | `backend/src/core/identity/controllers/identity.controller.ts:113` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `IdentityController` | `backend/src/core/identity/controllers/identity.controller.ts` |
| service | `IdentityService` | `backend/src/core/identity/services/identity.service.ts` |
