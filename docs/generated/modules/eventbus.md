<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Eventbus

> Module ID: `eventbus`

## Overview

| Field | Value |
|---|---|
| Class | `EventBusModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `critical` |
| Risk score | `144.1` |
| Blast radius | `33` |
| Dependency surface | `1` |
| Source | `backend/src/core/eventbus/eventbus.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 1 |
| Controllers | 0 |
| Routes | 0 |
| Direct dependencies | 1 |
| Direct dependents | 31 |
| Transitive dependencies | 1 |
| Transitive dependents | 33 |

## Direct Dependencies

- `database:postgres`

## Direct Dependents

- `access-control`
- `agreement`
- `ai`
- `audit`
- `communications`
- `credential`
- `distribution`
- `document`
- `facility`
- `forms`
- `health`
- `helpdesk`
- `integration`
- `inventory`
- `invoice`
- `maintenance`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `receipt`
- `rent`
- `reservation`
- `scheduler`
- `search`
- `staff`
- `tenant`
- `theme`
- `vehicle`
- `vendor`
- `workflow`

## Transitive Impact

A change to `eventbus` can potentially affect **33** modules transitively.

- `access-control`
- `admin`
- `agreement`
- `ai`
- `audit`
- `communications`
- `credential`
- `distribution`
- `document`
- `facility`
- `forms`
- `health`
- `helpdesk`
- `integration`
- `inventory`
- `invoice`
- `maintenance`
- `notification`
- `plugin`
- `plugin:visitor`
- `procurement`
- `property`
- `receipt`
- `rent`
- `reservation`
- `scheduler`
- `search`
- `staff`
- `tenant`
- `theme`
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
| service | `EventBusService` | `backend/src/core/eventbus/services/eventbus.service.ts` |
