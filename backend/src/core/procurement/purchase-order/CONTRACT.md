# PropertyOS Purchase Order Contract

## Module

- Sprint: 28
- Bounded context: Purchase Order Management
- Release: PropertyOS v2.5 Procurement
- Source of truth:
  - `procurement.types.ts`
  - Migration 032
  - Current PostgreSQL schema
  - Procurement constants

## Implementation Principles

1. Use the existing `PurchaseOrderStatus`, `PurchaseOrder`, and `PurchaseOrderItem` domain types.
2. Repository SQL must exactly match Migration 032 and the active PostgreSQL schema.
3. A Purchase Order may only be created from a `SELECTED` quotation.
4. Only one Purchase Order may exist for a quotation unless the schema explicitly permits otherwise.
5. Purchase Order items are copied from the selected quotation as a commercial snapshot.
6. Draft orders may be updated.
7. Lifecycle actions must create status history, audit records, and EventBus events.
8. Goods Receipt, invoice matching, and payment workflows must reference the Purchase Order.

---

## Extracted Runtime Contract

===== PurchaseOrderStatus =====
export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

===== PurchaseOrder =====
export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  propertyId: string;
  vendorId: string;
  purchaseRequestId?: string;
  rfqId?: string;
  quotationId?: string;
  vendorContractId?: string;
  title: string;
  description?: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  shippingAddress?: string;
  billingAddress?: string;
  createdByPersonId: string;
  approvedByPersonId?: string;
  issuedByPersonId?: string;
  acknowledgedByPersonId?: string;
  cancelledByPersonId?: string;
  approvedAt?: Date;
  issuedAt?: Date;
  acknowledgedAt?: Date;
  closedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

===== PurchaseOrderItem =====
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  quotationItemId?: string;
  purchaseRequestItemId?: string;
  lineNumber: number;
  itemType: ProcurementItemType;
  itemCode?: string;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

===== Purchase Order Constants =====
9:   PURCHASE_ORDER: 'procurement.purchase-order',
73:   PURCHASE_ORDER_CREATED:
74:     'procurement.purchase_order.created',
75:   PURCHASE_ORDER_SUBMITTED:
76:     'procurement.purchase_order.submitted',
77:   PURCHASE_ORDER_APPROVED:
78:     'procurement.purchase_order.approved',
79:   PURCHASE_ORDER_ISSUED:
80:     'procurement.purchase_order.issued',
81:   PURCHASE_ORDER_ACKNOWLEDGED:
82:     'procurement.purchase_order.acknowledged',
83:   PURCHASE_ORDER_RECEIVED:
84:     'procurement.purchase_order.received',
85:   PURCHASE_ORDER_CLOSED:
86:     'procurement.purchase_order.closed',
87:   PURCHASE_ORDER_CANCELLED:
88:     'procurement.purchase_order.cancelled',

===== PostgreSQL Purchase Order Columns =====
procurement_purchase_order_items|1|id|uuid|NO|
procurement_purchase_order_items|2|purchase_order_id|uuid|NO|
procurement_purchase_order_items|3|quotation_item_id|uuid|YES|
procurement_purchase_order_items|4|purchase_request_item_id|uuid|YES|
procurement_purchase_order_items|5|line_number|integer|NO|
procurement_purchase_order_items|6|item_type|character varying|NO|
procurement_purchase_order_items|7|item_code|character varying|YES|
procurement_purchase_order_items|8|description|text|NO|
procurement_purchase_order_items|9|ordered_quantity|numeric|NO|
procurement_purchase_order_items|10|received_quantity|numeric|NO|0
procurement_purchase_order_items|11|unit|character varying|NO|
procurement_purchase_order_items|12|unit_price|numeric|NO|
procurement_purchase_order_items|13|discount_amount|numeric|NO|0
procurement_purchase_order_items|14|tax_rate|numeric|NO|0
procurement_purchase_order_items|15|tax_amount|numeric|NO|0
procurement_purchase_order_items|16|line_total|numeric|NO|
procurement_purchase_order_items|17|created_at|timestamp with time zone|NO|now()
procurement_purchase_order_items|18|updated_at|timestamp with time zone|NO|now()
procurement_purchase_orders|1|id|uuid|NO|
procurement_purchase_orders|2|purchase_order_number|character varying|NO|
procurement_purchase_orders|3|property_id|uuid|NO|
procurement_purchase_orders|4|vendor_id|uuid|NO|
procurement_purchase_orders|5|purchase_request_id|uuid|YES|
procurement_purchase_orders|6|rfq_id|uuid|YES|
procurement_purchase_orders|7|quotation_id|uuid|YES|
procurement_purchase_orders|8|vendor_contract_id|uuid|YES|
procurement_purchase_orders|9|title|character varying|NO|
procurement_purchase_orders|10|description|text|YES|
procurement_purchase_orders|11|status|character varying|NO|'DRAFT'::character varying
procurement_purchase_orders|12|order_date|date|NO|
procurement_purchase_orders|13|expected_delivery_date|date|YES|
procurement_purchase_orders|14|subtotal|numeric|NO|0
procurement_purchase_orders|15|discount_amount|numeric|NO|0
procurement_purchase_orders|16|tax_amount|numeric|NO|0
procurement_purchase_orders|17|freight_amount|numeric|NO|0
procurement_purchase_orders|18|total_amount|numeric|NO|0
procurement_purchase_orders|19|currency|character varying|NO|'INR'::character varying
procurement_purchase_orders|20|payment_terms|text|YES|
procurement_purchase_orders|21|delivery_terms|text|YES|
procurement_purchase_orders|22|shipping_address|text|YES|
procurement_purchase_orders|23|billing_address|text|YES|
procurement_purchase_orders|24|created_by_person_id|uuid|NO|
procurement_purchase_orders|25|approved_by_person_id|uuid|YES|
procurement_purchase_orders|26|issued_by_person_id|uuid|YES|
procurement_purchase_orders|27|acknowledged_by_person_id|uuid|YES|
procurement_purchase_orders|28|cancelled_by_person_id|uuid|YES|
procurement_purchase_orders|29|approved_at|timestamp with time zone|YES|
procurement_purchase_orders|30|issued_at|timestamp with time zone|YES|
procurement_purchase_orders|31|acknowledged_at|timestamp with time zone|YES|
procurement_purchase_orders|32|closed_at|timestamp with time zone|YES|
procurement_purchase_orders|33|cancelled_at|timestamp with time zone|YES|
procurement_purchase_orders|34|cancellation_reason|text|YES|
procurement_purchase_orders|35|created_at|timestamp with time zone|NO|now()
procurement_purchase_orders|36|updated_at|timestamp with time zone|NO|now()

===== PostgreSQL Purchase Order Constraints =====
procurement_purchase_order_items|ck_procurement_po_item_amounts|CHECK (((unit_price >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_rate >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (line_total >= (0)::numeric)))
procurement_purchase_order_items|ck_procurement_po_item_quantities|CHECK (((ordered_quantity > (0)::numeric) AND (received_quantity >= (0)::numeric) AND (received_quantity <= ordered_quantity)))
procurement_purchase_order_items|ck_procurement_po_item_type|CHECK (((item_type)::text = ANY ((ARRAY['GOODS'::character varying, 'SERVICE'::character varying, 'ASSET'::character varying, 'CONSUMABLE'::character varying, 'OTHER'::character varying])::text[])))
procurement_purchase_order_items|procurement_purchase_order_items_pkey|PRIMARY KEY (id)
procurement_purchase_order_items|procurement_purchase_order_items_purchase_order_id_fkey|FOREIGN KEY (purchase_order_id) REFERENCES procurement_purchase_orders(id) ON DELETE CASCADE
procurement_purchase_order_items|procurement_purchase_order_items_purchase_request_item_id_fkey|FOREIGN KEY (purchase_request_item_id) REFERENCES procurement_purchase_request_items(id) ON DELETE SET NULL
procurement_purchase_order_items|procurement_purchase_order_items_quotation_item_id_fkey|FOREIGN KEY (quotation_item_id) REFERENCES procurement_quotation_items(id) ON DELETE SET NULL
procurement_purchase_order_items|uq_procurement_po_item_line|UNIQUE (purchase_order_id, line_number)
procurement_purchase_orders|ck_procurement_po_amounts|CHECK (((subtotal >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (freight_amount >= (0)::numeric) AND (total_amount >= (0)::numeric)))
procurement_purchase_orders|ck_procurement_po_delivery_date|CHECK (((expected_delivery_date IS NULL) OR (expected_delivery_date >= order_date)))
procurement_purchase_orders|ck_procurement_po_status|CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING_APPROVAL'::character varying, 'APPROVED'::character varying, 'ISSUED'::character varying, 'ACKNOWLEDGED'::character varying, 'PARTIALLY_RECEIVED'::character varying, 'RECEIVED'::character varying, 'CLOSED'::character varying, 'CANCELLED'::character varying])::text[])))
procurement_purchase_orders|procurement_purchase_orders_acknowledged_by_person_id_fkey|FOREIGN KEY (acknowledged_by_person_id) REFERENCES persons(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_approved_by_person_id_fkey|FOREIGN KEY (approved_by_person_id) REFERENCES persons(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_cancelled_by_person_id_fkey|FOREIGN KEY (cancelled_by_person_id) REFERENCES persons(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_created_by_person_id_fkey|FOREIGN KEY (created_by_person_id) REFERENCES persons(id)
procurement_purchase_orders|procurement_purchase_orders_issued_by_person_id_fkey|FOREIGN KEY (issued_by_person_id) REFERENCES persons(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_pkey|PRIMARY KEY (id)
procurement_purchase_orders|procurement_purchase_orders_property_id_fkey|FOREIGN KEY (property_id) REFERENCES properties(id)
procurement_purchase_orders|procurement_purchase_orders_purchase_order_number_key|UNIQUE (purchase_order_number)
procurement_purchase_orders|procurement_purchase_orders_purchase_request_id_fkey|FOREIGN KEY (purchase_request_id) REFERENCES procurement_purchase_requests(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_quotation_id_fkey|FOREIGN KEY (quotation_id) REFERENCES procurement_quotations(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_rfq_id_fkey|FOREIGN KEY (rfq_id) REFERENCES procurement_rfqs(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_vendor_contract_id_fkey|FOREIGN KEY (vendor_contract_id) REFERENCES vendor_contracts(id) ON DELETE SET NULL
procurement_purchase_orders|procurement_purchase_orders_vendor_id_fkey|FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT

---

## Implementation Checklist

- [ ] Purchase Order DTOs
- [ ] Repository contract
- [ ] PostgreSQL repository
- [ ] Purchase Order service
- [ ] Controller
- [ ] Procurement module registration
- [ ] Index exports
- [ ] Creation from selected quotation
- [ ] Duplicate-order prevention
- [ ] Draft update
- [ ] Issue lifecycle
- [ ] Acknowledge lifecycle
- [ ] Complete lifecycle
- [ ] Close lifecycle
- [ ] Cancel lifecycle
- [ ] Status history
- [ ] Audit
- [ ] EventBus
- [ ] Integration tests
