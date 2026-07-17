<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Credential

> Module ID: `credential`

## Overview

| Field | Value |
|---|---|
| Class | `CredentialModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `9.95` |
| Blast radius | `1` |
| Dependency surface | `3` |
| Source | `backend/src/core/credential/credential.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 6 |
| Direct dependencies | 3 |
| Direct dependents | 1 |
| Transitive dependencies | 3 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`

## Direct Dependents

- `access-control`

## Transitive Impact

A change to `credential` can potentially affect **1** modules transitively.

- `access-control`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `CredentialController` | `/access-credentials` | 6 | Bearer | `backend/src/core/credential/controllers/credential.controller.ts:16` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/access-credentials` | `listCredentials` | `Permissions.ACCESS_CREDENTIAL_READ` | `backend/src/core/credential/controllers/credential.controller.ts:33` |
| `POST` | `/access-credentials` | `issueCredential` | `Permissions.ACCESS_CREDENTIAL_MANAGE` | `backend/src/core/credential/controllers/credential.controller.ts:21` |
| `GET` | `/access-credentials/:id` | `getCredential` | `Permissions.ACCESS_CREDENTIAL_READ` | `backend/src/core/credential/controllers/credential.controller.ts:49` |
| `PATCH` | `/access-credentials/:id/revoke` | `revokeCredential` | `Permissions.ACCESS_CREDENTIAL_MANAGE` | `backend/src/core/credential/controllers/credential.controller.ts:61` |
| `GET` | `/access-credentials/:id/usage` | `listUsage` | `Permissions.ACCESS_CREDENTIAL_READ` | `backend/src/core/credential/controllers/credential.controller.ts:55` |
| `POST` | `/access-credentials/validate` | `validateCredential` | `Permissions.ACCESS_CREDENTIAL_MANAGE` | `backend/src/core/credential/controllers/credential.controller.ts:27` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `CredentialController` | `backend/src/core/credential/controllers/credential.controller.ts` |
| service | `CredentialService` | `backend/src/core/credential/services/credential.service.ts` |
