<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Auth

> Module ID: `auth`

## Overview

| Field | Value |
|---|---|
| Class | `AuthModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `51.85` |
| Blast radius | `11` |
| Dependency surface | `2` |
| Source | `backend/src/core/auth/auth.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 1 |
| Direct dependencies | 1 |
| Direct dependents | 11 |
| Transitive dependencies | 2 |
| Transitive dependents | 11 |

## Direct Dependencies

- `identity`

## Direct Dependents

- `access-control`
- `communications`
- `facility`
- `helpdesk`
- `inventory`
- `maintenance`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`

## Transitive Impact

A change to `auth` can potentially affect **11** modules transitively.

- `access-control`
- `communications`
- `facility`
- `helpdesk`
- `inventory`
- `maintenance`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AuthController` | `/auth` | 1 | Bearer | `backend/src/core/auth/auth.controller.ts:9` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/auth/login` | `login` |  | `backend/src/core/auth/auth.controller.ts:13` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `AuthController` | `backend/src/core/auth/auth.controller.ts` |
| service | `AuthService` | `backend/src/core/auth/services/auth.service.ts` |
