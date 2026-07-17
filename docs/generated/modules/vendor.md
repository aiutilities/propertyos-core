<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Vendor

> Module ID: `vendor`

## Overview

| Field | Value |
|---|---|
| Class | `VendorModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `high` |
| Risk score | `20.25` |
| Blast radius | `0` |
| Dependency surface | `10` |
| Source | `backend/src/core/vendor/vendor.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 40 |
| Direct dependencies | 5 |
| Direct dependents | 0 |
| Transitive dependencies | 10 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `plugin`

## Direct Dependents

_None_

## Transitive Impact

A change to `vendor` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `high` |
| Risk score | `20.25` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `VendorController` | `/vendors` | 40 | Bearer | `backend/src/core/vendor/controllers/vendor.controller.ts:104` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/vendors` | `list` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:129` |
| `POST` | `/vendors` | `create` | `VENDOR_PERMISSIONS.CREATE` | `backend/src/core/vendor/controllers/vendor.controller.ts:114` |
| `GET` | `/vendors/:id` | `get` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:210` |
| `PATCH` | `/vendors/:id` | `update` | `VENDOR_PERMISSIONS.UPDATE` | `backend/src/core/vendor/controllers/vendor.controller.ts:856` |
| `POST` | `/vendors/:id/activate` | `activate` | `VENDOR_PERMISSIONS.MANAGE` | `backend/src/core/vendor/controllers/vendor.controller.ts:761` |
| `POST` | `/vendors/:id/archive` | `archive` | `VENDOR_PERMISSIONS.MANAGE` | `backend/src/core/vendor/controllers/vendor.controller.ts:837` |
| `POST` | `/vendors/:id/block` | `block` | `VENDOR_PERMISSIONS.MANAGE` | `backend/src/core/vendor/controllers/vendor.controller.ts:799` |
| `GET` | `/vendors/:id/rating-summary` | `getRatingSummary` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:251` |
| `GET` | `/vendors/:id/ratings` | `listRatings` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:237` |
| `POST` | `/vendors/:id/reactivate` | `reactivate` | `VENDOR_PERMISSIONS.MANAGE` | `backend/src/core/vendor/controllers/vendor.controller.ts:818` |
| `POST` | `/vendors/:id/suspend` | `suspend` | `VENDOR_PERMISSIONS.MANAGE` | `backend/src/core/vendor/controllers/vendor.controller.ts:780` |
| `GET` | `/vendors/categories` | `categories` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:160` |
| `GET` | `/vendors/compliance` | `listComplianceDocuments` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:507` |
| `POST` | `/vendors/compliance` | `createComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:491` |
| `GET` | `/vendors/compliance/:documentId` | `getComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:535` |
| `POST` | `/vendors/compliance/:documentId/expire` | `expireComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:611` |
| `POST` | `/vendors/compliance/:documentId/reject` | `rejectComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:571` |
| `POST` | `/vendors/compliance/:documentId/verify` | `verifyComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:551` |
| `POST` | `/vendors/compliance/:documentId/waive` | `waiveComplianceDocument` | `VENDOR_PERMISSIONS.COMPLIANCE` | `backend/src/core/vendor/controllers/vendor.controller.ts:591` |
| `GET` | `/vendors/contracts` | `listContracts` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:182` |
| `POST` | `/vendors/contracts` | `createContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:631` |
| `GET` | `/vendors/contracts/:contractId` | `getContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:645` |
| `POST` | `/vendors/contracts/:contractId/activate` | `activateContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:661` |
| `POST` | `/vendors/contracts/:contractId/cancel` | `cancelContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:741` |
| `POST` | `/vendors/contracts/:contractId/expire` | `expireContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:701` |
| `POST` | `/vendors/contracts/:contractId/renew` | `renewContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:681` |
| `POST` | `/vendors/contracts/:contractId/terminate` | `terminateContract` | `VENDOR_PERMISSIONS.CONTRACTS` | `backend/src/core/vendor/controllers/vendor.controller.ts:721` |
| `GET` | `/vendors/metrics` | `metrics` | `VENDOR_PERMISSIONS.READ` | `backend/src/core/vendor/controllers/vendor.controller.ts:171` |
| `POST` | `/vendors/ratings` | `createRating` | `VENDOR_PERMISSIONS.RATINGS` | `backend/src/core/vendor/controllers/vendor.controller.ts:223` |
| `GET` | `/vendors/work-orders` | `listWorkOrders` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:279` |
| `POST` | `/vendors/work-orders` | `createWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:265` |
| `GET` | `/vendors/work-orders/:workOrderId` | `getWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:315` |
| `POST` | `/vendors/work-orders/:workOrderId/accept` | `acceptWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:351` |
| `POST` | `/vendors/work-orders/:workOrderId/cancel` | `cancelWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:471` |
| `POST` | `/vendors/work-orders/:workOrderId/complete` | `completeWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:451` |
| `POST` | `/vendors/work-orders/:workOrderId/hold` | `holdWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:411` |
| `POST` | `/vendors/work-orders/:workOrderId/issue` | `issueWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:331` |
| `POST` | `/vendors/work-orders/:workOrderId/reject` | `rejectWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:371` |
| `POST` | `/vendors/work-orders/:workOrderId/resume` | `resumeWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:431` |
| `POST` | `/vendors/work-orders/:workOrderId/start` | `startWorkOrder` | `VENDOR_PERMISSIONS.WORK_ORDERS` | `backend/src/core/vendor/controllers/vendor.controller.ts:391` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `VendorBootstrapService` | `backend/src/core/vendor/bootstrap/vendor-bootstrap.service.ts` |
| controller | `VendorController` | `backend/src/core/vendor/controllers/vendor.controller.ts` |
| service | `VendorService` | `backend/src/core/vendor/services/vendor.service.ts` |
