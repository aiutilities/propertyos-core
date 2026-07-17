<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Database

> Module ID: `database:database`

## Overview

| Field | Value |
|---|---|
| Class | `DatabaseModule` |
| Physical location | `database` |
| Architectural role | `database` |
| Expected location | `database` |
| Alignment | `aligned` |
| Criticality | `critical` |
| Risk score | `68.85` |
| Blast radius | `25` |
| Dependency surface | `1` |
| Source | `backend/src/database/database.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 0 |
| Controllers | 0 |
| Routes | 0 |
| Direct dependencies | 1 |
| Direct dependents | 10 |
| Transitive dependencies | 1 |
| Transitive dependents | 25 |

## Direct Dependencies

- `database:postgres`

## Direct Dependents

- `configuration`
- `forms`
- `health`
- `invoice`
- `notification`
- `report`
- `scheduler`
- `storage`
- `tenant`
- `workflow`

## Transitive Impact

A change to `database:database` can potentially affect **25** modules transitively.

- `access-control`
- `admin`
- `communications`
- `configuration`
- `facility`
- `forms`
- `health`
- `helpdesk`
- `inventory`
- `invoice`
- `maintenance`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `report`
- `reservation`
- `scheduler`
- `staff`
- `storage`
- `tenant`
- `upload`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

_No controllers discovered._

## Routes

_No HTTP routes discovered._

## Components

_No components discovered._
