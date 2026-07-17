<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Postgres

> Module ID: `database:postgres`

## Overview

| Field | Value |
|---|---|
| Class | `PostgresModule` |
| Physical location | `database` |
| Architectural role | `database` |
| Expected location | `database` |
| Alignment | `aligned` |
| Criticality | `critical` |
| Risk score | `136.75` |
| Blast radius | `43` |
| Dependency surface | `0` |
| Source | `backend/src/database/postgres/postgres.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 1 |
| Controllers | 0 |
| Routes | 0 |
| Direct dependencies | 0 |
| Direct dependents | 24 |
| Transitive dependencies | 0 |
| Transitive dependents | 43 |

## Direct Dependencies

_None_

## Direct Dependents

- `access-control`
- `agreement`
- `audit`
- `communications`
- `credential`
- `database:database`
- `document`
- `eventbus`
- `facility`
- `helpdesk`
- `identity`
- `inventory`
- `maintenance`
- `metrics`
- `plugin`
- `plugin:visitor`
- `procurement`
- `property`
- `receipt`
- `rent`
- `reservation`
- `staff`
- `vehicle`
- `vendor`

## Transitive Impact

A change to `database:postgres` can potentially affect **43** modules transitively.

- `access-control`
- `admin`
- `agreement`
- `ai`
- `audit`
- `auth`
- `bootstrap`
- `communications`
- `configuration`
- `credential`
- `database:database`
- `distribution`
- `document`
- `eventbus`
- `facility`
- `forms`
- `health`
- `helpdesk`
- `identity`
- `integration`
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
- `theme`
- `upload`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

_No controllers discovered._

## Routes

_No HTTP routes discovered._

## Components

| Kind | Class | Source |
|---|---|---|
| service | `PostgresShutdownService` | `backend/src/database/postgres/postgres-shutdown.service.ts` |
