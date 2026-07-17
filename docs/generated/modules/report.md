<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Report

> Module ID: `report`

## Overview

| Field | Value |
|---|---|
| Class | `ReportModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `medium` |
| Risk score | `23.2` |
| Blast radius | `7` |
| Dependency surface | `3` |
| Source | `backend/src/core/report/report.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 6 |
| Direct dependencies | 2 |
| Direct dependents | 1 |
| Transitive dependencies | 3 |
| Transitive dependents | 7 |

## Direct Dependencies

- `database:database`
- `identity`

## Direct Dependents

- `scheduler`

## Transitive Impact

A change to `report` can potentially affect **7** modules transitively.

- `communications`
- `health`
- `helpdesk`
- `maintenance`
- `plugin:visitor`
- `reservation`
- `scheduler`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `medium` |
| Risk score | `23.2` |
| Direct dependents | `1` |
| Transitive dependents | `7` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `ReportController` | `/reports` | 6 | Bearer | `backend/src/core/report/controllers/report.controller.ts:21` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/reports/outstanding-rent` | `getOutstandingRent` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:71` |
| `GET` | `/reports/outstanding-rent/export.csv` | `exportOutstandingRentCsv` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:82` |
| `GET` | `/reports/outstanding-rent/export.pdf` | `exportOutstandingRentPdf` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:100` |
| `GET` | `/reports/rent-collection` | `getRentCollection` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:26` |
| `GET` | `/reports/rent-collection/export.csv` | `exportRentCollectionCsv` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:37` |
| `GET` | `/reports/rent-collection/export.pdf` | `exportRentCollectionPdf` | `Permissions.REPORT_READ` | `backend/src/core/report/controllers/report.controller.ts:54` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `ReportController` | `backend/src/core/report/controllers/report.controller.ts` |
| service | `ReportExportService` | `backend/src/core/report/services/report-export.service.ts` |
| service | `ReportService` | `backend/src/core/report/services/report.service.ts` |
