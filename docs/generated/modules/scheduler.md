<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Scheduler

> Module ID: `scheduler`

## Overview

| Field | Value |
|---|---|
| Class | `SchedulerModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `medium` |
| Risk score | `35.6` |
| Blast radius | `6` |
| Dependency surface | `6` |
| Source | `backend/src/core/scheduler/scheduler.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 5 |
| Direct dependencies | 5 |
| Direct dependents | 6 |
| Transitive dependencies | 6 |
| Transitive dependents | 6 |

## Direct Dependencies

- `database:database`
- `eventbus`
- `identity`
- `platform`
- `report`

## Direct Dependents

- `communications`
- `health`
- `helpdesk`
- `maintenance`
- `plugin:visitor`
- `reservation`

## Transitive Impact

A change to `scheduler` can potentially affect **6** modules transitively.

- `communications`
- `health`
- `helpdesk`
- `maintenance`
- `plugin:visitor`
- `reservation`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `SchedulerController` | `/scheduler` | 5 | Bearer | `backend/src/core/scheduler/controllers/scheduler.controller.ts:13` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/scheduler/handlers` | `listHandlers` | `Permissions.SCHEDULER_READ` | `backend/src/core/scheduler/controllers/scheduler.controller.ts:62` |
| `GET` | `/scheduler/jobs` | `listJobs` | `Permissions.SCHEDULER_READ` | `backend/src/core/scheduler/controllers/scheduler.controller.ts:29` |
| `POST` | `/scheduler/jobs` | `createJob` | `Permissions.SCHEDULER_MANAGE` | `backend/src/core/scheduler/controllers/scheduler.controller.ts:18` |
| `GET` | `/scheduler/jobs/:id` | `getJob` | `Permissions.SCHEDULER_READ` | `backend/src/core/scheduler/controllers/scheduler.controller.ts:40` |
| `POST` | `/scheduler/jobs/:id/run` | `runJob` | `Permissions.SCHEDULER_MANAGE` | `backend/src/core/scheduler/controllers/scheduler.controller.ts:51` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `SchedulerController` | `backend/src/core/scheduler/controllers/scheduler.controller.ts` |
| scheduler-service | `SchedulerService` | `backend/src/core/scheduler/services/scheduler.service.ts` |
| scheduler-service | `SchedulerWorkerService` | `backend/src/core/scheduler/services/scheduler-worker.service.ts` |
