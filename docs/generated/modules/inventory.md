<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Inventory

> Module ID: `inventory`

## Overview

| Field | Value |
|---|---|
| Class | `InventoryModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `high` |
| Risk score | `33.5` |
| Blast radius | `1` |
| Dependency surface | `10` |
| Source | `backend/src/core/inventory/inventory.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 19 |
| Controllers | 8 |
| Routes | 65 |
| Direct dependencies | 6 |
| Direct dependents | 1 |
| Transitive dependencies | 10 |
| Transitive dependents | 1 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `plugin`
- `search`

## Direct Dependents

- `procurement`

## Transitive Impact

A change to `inventory` can potentially affect **1** modules transitively.

- `procurement`


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `high` |
| Risk score | `33.5` |
| Direct dependents | `1` |
| Transitive dependents | `1` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `InventoryController` | `/inventory` | 29 | Bearer | `backend/src/core/inventory/controllers/inventory.controller.ts:64` |
| `InventoryStockAdjustmentController` | `/inventory/adjustments` | 5 | Bearer | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:48` |
| `InventoryBatchAllocationController` | `/inventory/batch-allocations` | 1 | Bearer | `backend/src/core/inventory/controllers/inventory-batch-allocation.controller.ts:43` |
| `InventoryCycleCountController` | `/inventory/cycle-counts` | 8 | Bearer | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:51` |
| `InventoryMaterialIssueController` | `/inventory/material-issues` | 5 | Bearer | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:50` |
| `InventoryMaterialReturnController` | `/inventory/material-returns` | 5 | Bearer | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:50` |
| `InventoryStockReservationController` | `/inventory/reservations` | 6 | Bearer | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:49` |
| `InventoryStockTransferController` | `/inventory/transfers` | 6 | Bearer | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:49` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/inventory/adjustments` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:58` |
| `POST` | `/inventory/adjustments` | `create` | `INVENTORY_PERMISSIONS.ADJUST` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:104` |
| `GET` | `/inventory/adjustments/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:90` |
| `POST` | `/inventory/adjustments/:id/cancel` | `cancel` | `INVENTORY_PERMISSIONS.ADJUST` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:140` |
| `POST` | `/inventory/adjustments/:id/post` | `postAdjustment` | `INVENTORY_PERMISSIONS.ADJUST` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts:119` |
| `POST` | `/inventory/batch-allocations/preview` | `preview` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-batch-allocation.controller.ts:53` |
| `GET` | `/inventory/bins` | `listBins` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:539` |
| `POST` | `/inventory/bins` | `createBin` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:525` |
| `GET` | `/inventory/bins/:id` | `getBin` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:555` |
| `PATCH` | `/inventory/bins/:id` | `updateBin` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:569` |
| `GET` | `/inventory/brands` | `listBrands` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:208` |
| `POST` | `/inventory/brands` | `createBrand` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:241` |
| `GET` | `/inventory/brands/:id` | `getBrand` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:227` |
| `PATCH` | `/inventory/brands/:id` | `updateBrand` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:255` |
| `GET` | `/inventory/categories` | `listCategories` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:141` |
| `POST` | `/inventory/categories` | `createCategory` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:174` |
| `GET` | `/inventory/categories/:id` | `getCategory` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:160` |
| `PATCH` | `/inventory/categories/:id` | `updateCategory` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:188` |
| `GET` | `/inventory/cycle-counts` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:61` |
| `POST` | `/inventory/cycle-counts` | `create` | `INVENTORY_PERMISSIONS.COUNT` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:107` |
| `GET` | `/inventory/cycle-counts/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:93` |
| `POST` | `/inventory/cycle-counts/:id/cancel` | `cancel` | `INVENTORY_PERMISSIONS.COUNT` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:206` |
| `POST` | `/inventory/cycle-counts/:id/complete` | `complete` | `INVENTORY_PERMISSIONS.COUNT` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:164` |
| `POST` | `/inventory/cycle-counts/:id/post` | `postCount` | `INVENTORY_PERMISSIONS.ADJUST` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:185` |
| `POST` | `/inventory/cycle-counts/:id/record` | `record` | `INVENTORY_PERMISSIONS.COUNT` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:143` |
| `POST` | `/inventory/cycle-counts/:id/start` | `start` | `INVENTORY_PERMISSIONS.COUNT` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts:122` |
| `GET` | `/inventory/items` | `listItems` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:289` |
| `POST` | `/inventory/items` | `createItem` | `INVENTORY_PERMISSIONS.ITEMS` | `backend/src/core/inventory/controllers/inventory.controller.ts:275` |
| `GET` | `/inventory/items/:id` | `getItem` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:328` |
| `PATCH` | `/inventory/items/:id` | `updateItem` | `INVENTORY_PERMISSIONS.ITEMS` | `backend/src/core/inventory/controllers/inventory.controller.ts:342` |
| `POST` | `/inventory/items/:id/activate` | `activateItem` | `INVENTORY_PERMISSIONS.ITEMS` | `backend/src/core/inventory/controllers/inventory.controller.ts:362` |
| `POST` | `/inventory/items/:id/deactivate` | `deactivateItem` | `INVENTORY_PERMISSIONS.ITEMS` | `backend/src/core/inventory/controllers/inventory.controller.ts:382` |
| `GET` | `/inventory/material-issues` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:62` |
| `POST` | `/inventory/material-issues` | `create` | `INVENTORY_PERMISSIONS.ISSUE` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:110` |
| `GET` | `/inventory/material-issues/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:94` |
| `POST` | `/inventory/material-issues/:id/cancel` | `cancel` | `INVENTORY_PERMISSIONS.ISSUE` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:148` |
| `POST` | `/inventory/material-issues/:id/post` | `postMaterialIssue` | `INVENTORY_PERMISSIONS.ISSUE` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts:127` |
| `GET` | `/inventory/material-returns` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:62` |
| `POST` | `/inventory/material-returns` | `create` | `INVENTORY_PERMISSIONS.RETURN` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:114` |
| `GET` | `/inventory/material-returns/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:98` |
| `POST` | `/inventory/material-returns/:id/cancel` | `cancel` | `INVENTORY_PERMISSIONS.RETURN` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:152` |
| `POST` | `/inventory/material-returns/:id/post` | `postMaterialReturn` | `INVENTORY_PERMISSIONS.RETURN` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts:131` |
| `GET` | `/inventory/reservations` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:59` |
| `POST` | `/inventory/reservations` | `create` | `INVENTORY_PERMISSIONS.STOCK` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:113` |
| `GET` | `/inventory/reservations/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:99` |
| `POST` | `/inventory/reservations/:id/expire` | `expire` | `INVENTORY_PERMISSIONS.MANAGE` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:170` |
| `POST` | `/inventory/reservations/:id/fulfill` | `fulfill` | `INVENTORY_PERMISSIONS.STOCK` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:149` |
| `POST` | `/inventory/reservations/:id/release` | `release` | `INVENTORY_PERMISSIONS.STOCK` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts:128` |
| `GET` | `/inventory/stock-balances` | `listStockBalances` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:589` |
| `GET` | `/inventory/stores` | `listStores` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:416` |
| `POST` | `/inventory/stores` | `createStore` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:402` |
| `GET` | `/inventory/stores/:id` | `getStore` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:451` |
| `PATCH` | `/inventory/stores/:id` | `updateStore` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:465` |
| `POST` | `/inventory/stores/:id/activate` | `activateStore` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:485` |
| `POST` | `/inventory/stores/:id/deactivate` | `deactivateStore` | `INVENTORY_PERMISSIONS.STORES` | `backend/src/core/inventory/controllers/inventory.controller.ts:505` |
| `GET` | `/inventory/transfers` | `list` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:59` |
| `POST` | `/inventory/transfers` | `create` | `INVENTORY_PERMISSIONS.TRANSFER` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:109` |
| `GET` | `/inventory/transfers/:id` | `get` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:95` |
| `POST` | `/inventory/transfers/:id/cancel` | `cancel` | `INVENTORY_PERMISSIONS.TRANSFER` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:166` |
| `POST` | `/inventory/transfers/:id/dispatch` | `dispatch` | `INVENTORY_PERMISSIONS.TRANSFER` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:124` |
| `POST` | `/inventory/transfers/:id/receive` | `receive` | `INVENTORY_PERMISSIONS.TRANSFER` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts:145` |
| `GET` | `/inventory/units` | `listUnits` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:74` |
| `POST` | `/inventory/units` | `createUnit` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:107` |
| `GET` | `/inventory/units/:id` | `getUnit` | `INVENTORY_PERMISSIONS.READ` | `backend/src/core/inventory/controllers/inventory.controller.ts:93` |
| `PATCH` | `/inventory/units/:id` | `updateUnit` | `INVENTORY_PERMISSIONS.CONFIGURE` | `backend/src/core/inventory/controllers/inventory.controller.ts:121` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `InventoryBootstrapService` | `backend/src/core/inventory/bootstrap/inventory-bootstrap.service.ts` |
| controller | `InventoryBatchAllocationController` | `backend/src/core/inventory/controllers/inventory-batch-allocation.controller.ts` |
| controller | `InventoryController` | `backend/src/core/inventory/controllers/inventory.controller.ts` |
| controller | `InventoryCycleCountController` | `backend/src/core/inventory/controllers/inventory-cycle-count.controller.ts` |
| controller | `InventoryMaterialIssueController` | `backend/src/core/inventory/controllers/inventory-material-issue.controller.ts` |
| controller | `InventoryMaterialReturnController` | `backend/src/core/inventory/controllers/inventory-material-return.controller.ts` |
| controller | `InventoryStockAdjustmentController` | `backend/src/core/inventory/controllers/inventory-stock-adjustment.controller.ts` |
| controller | `InventoryStockReservationController` | `backend/src/core/inventory/controllers/inventory-stock-reservation.controller.ts` |
| controller | `InventoryStockTransferController` | `backend/src/core/inventory/controllers/inventory-stock-transfer.controller.ts` |
| search-provider | `InventorySearchProviderService` | `backend/src/core/inventory/inventory-search-provider.service.ts` |
| service | `InventoryBatchAllocationService` | `backend/src/core/inventory/services/inventory-batch-allocation.service.ts` |
| service | `InventoryBatchService` | `backend/src/core/inventory/services/inventory-batch.service.ts` |
| service | `InventoryCycleCountService` | `backend/src/core/inventory/services/inventory-cycle-count.service.ts` |
| service | `InventoryMaterialIssueService` | `backend/src/core/inventory/services/inventory-material-issue.service.ts` |
| service | `InventoryMaterialReturnService` | `backend/src/core/inventory/services/inventory-material-return.service.ts` |
| service | `InventoryService` | `backend/src/core/inventory/services/inventory.service.ts` |
| service | `InventoryStockAdjustmentService` | `backend/src/core/inventory/services/inventory-stock-adjustment.service.ts` |
| service | `InventoryStockReservationService` | `backend/src/core/inventory/services/inventory-stock-reservation.service.ts` |
| service | `InventoryStockTransferService` | `backend/src/core/inventory/services/inventory-stock-transfer.service.ts` |
