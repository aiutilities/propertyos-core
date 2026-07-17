<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Procurement

> Module ID: `procurement`

## Overview

| Field | Value |
|---|---|
| Class | `ProcurementModule` |
| Physical location | `core` |
| Architectural role | `business` |
| Expected location | `plugin` |
| Alignment | `violation` |
| Criticality | `high` |
| Risk score | `29.1` |
| Blast radius | `0` |
| Dependency surface | `11` |
| Source | `backend/src/core/procurement/procurement.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 18 |
| Controllers | 8 |
| Routes | 65 |
| Direct dependencies | 6 |
| Direct dependents | 0 |
| Transitive dependencies | 11 |
| Transitive dependents | 0 |

## Direct Dependencies

- `audit`
- `auth`
- `database:postgres`
- `eventbus`
- `inventory`
- `plugin`

## Direct Dependents

_None_

## Transitive Impact

A change to `procurement` can potentially affect **0** modules transitively.

_None_


## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `BUSINESS_MODULE_IN_CORE` |
| Current location | `core` |
| Expected location | `plugin` |
| Migration risk | `high` |
| Risk score | `29.1` |
| Direct dependents | `0` |
| Transitive dependents | `0` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.

## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `PurchaseRequestController` | `/procurement` | 11 | Bearer | `backend/src/core/procurement/controllers/purchase-request.controller.ts:59` |
| `ProcurementGoodsReceiptController` | `/procurement/goods-receipts` | 6 | Bearer | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:59` |
| `ProcurementInvoiceMatchController` | `/procurement/invoice-matches` | 7 | Bearer | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:63` |
| `ProcurementPaymentRequestController` | `/procurement/payment-requests` | 9 | Bearer | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:71` |
| `ProcurementPurchaseOrderController` | `/procurement/purchase-orders` | 11 | Bearer | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:55` |
| `ProcurementQuotationController` | `/procurement/quotations` | 9 | Bearer | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:55` |
| `ProcurementQuotationComparisonController` | `/procurement/rfqs` | 1 | Bearer | `backend/src/core/procurement/controllers/procurement-quotation-comparison.controller.ts:37` |
| `ProcurementRfqController` | `/procurement/rfqs` | 11 | Bearer | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:59` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/procurement/categories` | `categories` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:73` |
| `GET` | `/procurement/goods-receipts` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:73` |
| `POST` | `/procurement/goods-receipts` | `create` | `PROCUREMENT_PERMISSIONS.GOODS_RECEIPT` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:104` |
| `GET` | `/procurement/goods-receipts/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:119` |
| `PATCH` | `/procurement/goods-receipts/:id` | `update` | `PROCUREMENT_PERMISSIONS.GOODS_RECEIPT` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:134` |
| `POST` | `/procurement/goods-receipts/:id/post` | `postReceipt` | `PROCUREMENT_PERMISSIONS.GOODS_RECEIPT` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:153` |
| `POST` | `/procurement/goods-receipts/:id/reverse` | `reverse` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts:172` |
| `GET` | `/procurement/invoice-matches` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:77` |
| `POST` | `/procurement/invoice-matches` | `create` | `PROCUREMENT_PERMISSIONS.INVOICE_MATCH` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:113` |
| `GET` | `/procurement/invoice-matches/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:127` |
| `PATCH` | `/procurement/invoice-matches/:id` | `update` | `PROCUREMENT_PERMISSIONS.INVOICE_MATCH` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:141` |
| `POST` | `/procurement/invoice-matches/:id/approve` | `approve` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:181` |
| `POST` | `/procurement/invoice-matches/:id/complete` | `complete` | `PROCUREMENT_PERMISSIONS.INVOICE_MATCH` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:161` |
| `POST` | `/procurement/invoice-matches/:id/reject` | `reject` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts:201` |
| `GET` | `/procurement/metrics` | `metrics` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:83` |
| `GET` | `/procurement/payment-requests` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:85` |
| `POST` | `/procurement/payment-requests` | `create` | `PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:125` |
| `GET` | `/procurement/payment-requests/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:140` |
| `PATCH` | `/procurement/payment-requests/:id` | `update` | `PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:155` |
| `POST` | `/procurement/payment-requests/:id/approve` | `approve` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:193` |
| `POST` | `/procurement/payment-requests/:id/cancel` | `cancel` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:231` |
| `POST` | `/procurement/payment-requests/:id/pay` | `pay` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:250` |
| `POST` | `/procurement/payment-requests/:id/reject` | `reject` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:212` |
| `POST` | `/procurement/payment-requests/:id/submit` | `submit` | `PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts:174` |
| `GET` | `/procurement/purchase-orders` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:69` |
| `POST` | `/procurement/purchase-orders` | `create` | `PROCUREMENT_PERMISSIONS.PURCHASE_ORDER` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:108` |
| `GET` | `/procurement/purchase-orders/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:123` |
| `PATCH` | `/procurement/purchase-orders/:id` | `update` | `PROCUREMENT_PERMISSIONS.PURCHASE_ORDER` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:138` |
| `POST` | `/procurement/purchase-orders/:id/acknowledge` | `acknowledge` | `PROCUREMENT_PERMISSIONS.PURCHASE_ORDER` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:215` |
| `POST` | `/procurement/purchase-orders/:id/approve` | `approve` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:177` |
| `POST` | `/procurement/purchase-orders/:id/cancel` | `cancel` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:274` |
| `POST` | `/procurement/purchase-orders/:id/close` | `close` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:255` |
| `POST` | `/procurement/purchase-orders/:id/issue` | `issue` | `PROCUREMENT_PERMISSIONS.PURCHASE_ORDER` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:196` |
| `POST` | `/procurement/purchase-orders/:id/received` | `markReceived` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:235` |
| `POST` | `/procurement/purchase-orders/:id/submit` | `submitForApproval` | `PROCUREMENT_PERMISSIONS.PURCHASE_ORDER` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts:157` |
| `GET` | `/procurement/quotations` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:69` |
| `POST` | `/procurement/quotations` | `create` | `PROCUREMENT_PERMISSIONS.QUOTATION` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:100` |
| `GET` | `/procurement/quotations/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:115` |
| `PATCH` | `/procurement/quotations/:id` | `update` | `PROCUREMENT_PERMISSIONS.QUOTATION` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:128` |
| `POST` | `/procurement/quotations/:id/expire` | `expire` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:223` |
| `POST` | `/procurement/quotations/:id/reject` | `reject` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:185` |
| `POST` | `/procurement/quotations/:id/select` | `select` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:166` |
| `POST` | `/procurement/quotations/:id/submit` | `submit` | `PROCUREMENT_PERMISSIONS.QUOTATION` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:147` |
| `POST` | `/procurement/quotations/:id/withdraw` | `withdraw` | `PROCUREMENT_PERMISSIONS.QUOTATION` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts:204` |
| `GET` | `/procurement/requests` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:93` |
| `POST` | `/procurement/requests` | `create` | `PROCUREMENT_PERMISSIONS.CREATE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:124` |
| `GET` | `/procurement/requests/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:139` |
| `PATCH` | `/procurement/requests/:id` | `update` | `PROCUREMENT_PERMISSIONS.UPDATE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:152` |
| `POST` | `/procurement/requests/:id/approve` | `approve` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:190` |
| `POST` | `/procurement/requests/:id/cancel` | `cancel` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:228` |
| `POST` | `/procurement/requests/:id/close` | `close` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:247` |
| `POST` | `/procurement/requests/:id/reject` | `reject` | `PROCUREMENT_PERMISSIONS.APPROVE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:209` |
| `POST` | `/procurement/requests/:id/submit` | `submit` | `PROCUREMENT_PERMISSIONS.CREATE` | `backend/src/core/procurement/controllers/purchase-request.controller.ts:171` |
| `GET` | `/procurement/rfqs` | `list` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:73` |
| `POST` | `/procurement/rfqs` | `create` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:104` |
| `GET` | `/procurement/rfqs/:id` | `get` | `PROCUREMENT_PERMISSIONS.READ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:119` |
| `PATCH` | `/procurement/rfqs/:id` | `update` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:132` |
| `POST` | `/procurement/rfqs/:id/cancel` | `cancel` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:189` |
| `POST` | `/procurement/rfqs/:id/close` | `close` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:170` |
| `POST` | `/procurement/rfqs/:id/expire` | `expire` | `PROCUREMENT_PERMISSIONS.MANAGE` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:208` |
| `POST` | `/procurement/rfqs/:id/issue` | `issue` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:151` |
| `POST` | `/procurement/rfqs/:id/vendors/:vendorId/responded` | `markVendorResponded` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:247` |
| `POST` | `/procurement/rfqs/:id/vendors/:vendorId/viewed` | `markVendorViewed` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:227` |
| `POST` | `/procurement/rfqs/:id/vendors/decline` | `declineVendor` | `PROCUREMENT_PERMISSIONS.RFQ` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts:267` |
| `GET` | `/procurement/rfqs/:rfqId/comparison` | `compare` | `PROCUREMENT_PERMISSIONS.QUOTATION` | `backend/src/core/procurement/controllers/procurement-quotation-comparison.controller.ts:51` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `ProcurementBootstrapService` | `backend/src/core/procurement/bootstrap/procurement-bootstrap.service.ts` |
| controller | `ProcurementGoodsReceiptController` | `backend/src/core/procurement/controllers/procurement-goods-receipt.controller.ts` |
| controller | `ProcurementInvoiceMatchController` | `backend/src/core/procurement/controllers/procurement-invoice-match.controller.ts` |
| controller | `ProcurementPaymentRequestController` | `backend/src/core/procurement/controllers/procurement-payment-request.controller.ts` |
| controller | `ProcurementPurchaseOrderController` | `backend/src/core/procurement/controllers/procurement-purchase-order.controller.ts` |
| controller | `ProcurementQuotationComparisonController` | `backend/src/core/procurement/controllers/procurement-quotation-comparison.controller.ts` |
| controller | `ProcurementQuotationController` | `backend/src/core/procurement/controllers/procurement-quotation.controller.ts` |
| controller | `ProcurementRfqController` | `backend/src/core/procurement/controllers/procurement-rfq.controller.ts` |
| controller | `PurchaseRequestController` | `backend/src/core/procurement/controllers/purchase-request.controller.ts` |
| service | `ProcurementGoodsReceiptService` | `backend/src/core/procurement/services/procurement-goods-receipt.service.ts` |
| service | `ProcurementInventoryPostingService` | `backend/src/core/procurement/services/procurement-inventory-posting.service.ts` |
| service | `ProcurementInvoiceMatchService` | `backend/src/core/procurement/services/procurement-invoice-match.service.ts` |
| service | `ProcurementPaymentRequestService` | `backend/src/core/procurement/services/procurement-payment-request.service.ts` |
| service | `ProcurementPurchaseOrderService` | `backend/src/core/procurement/services/procurement-purchase-order.service.ts` |
| service | `ProcurementQuotationComparisonService` | `backend/src/core/procurement/services/procurement-quotation-comparison.service.ts` |
| service | `ProcurementQuotationService` | `backend/src/core/procurement/services/procurement-quotation.service.ts` |
| service | `ProcurementRfqService` | `backend/src/core/procurement/services/procurement-rfq.service.ts` |
| service | `PurchaseRequestService` | `backend/src/core/procurement/services/purchase-request.service.ts` |
