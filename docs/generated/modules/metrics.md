<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Metrics

> Module ID: `metrics`

## Overview

| Field | Value |
|---|---|
| Class | `MetricsModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `8.3` |
| Blast radius | `1` |
| Dependency surface | `2` |
| Source | `backend/src/core/metrics/metrics.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 4 |
| Direct dependencies | 2 |
| Direct dependents | 1 |
| Transitive dependencies | 2 |
| Transitive dependents | 1 |

## Direct Dependencies

- `database:postgres`
- `identity`

## Direct Dependents

- `health`

## Transitive Impact

A change to `metrics` can potentially affect **1** modules transitively.

- `health`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `MetricsController` | `/metrics` | 4 | Bearer | `backend/src/core/metrics/controllers/metrics.controller.ts:12` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/metrics` | `getMetrics` | `Permissions.METRICS_READ` | `backend/src/core/metrics/controllers/metrics.controller.ts:17` |
| `GET` | `/metrics/prometheus` | `getPrometheusMetrics` | `Permissions.METRICS_READ` | `backend/src/core/metrics/controllers/metrics.controller.ts:57` |
| `GET` | `/metrics/runtime` | `getRuntimeMetrics` | `Permissions.METRICS_READ` | `backend/src/core/metrics/controllers/metrics.controller.ts:28` |
| `GET` | `/metrics/samples` | `listPersistentSamples` | `Permissions.METRICS_READ` | `backend/src/core/metrics/controllers/metrics.controller.ts:39` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `MetricsController` | `backend/src/core/metrics/controllers/metrics.controller.ts` |
| service | `MetricsService` | `backend/src/core/metrics/services/metrics.service.ts` |
