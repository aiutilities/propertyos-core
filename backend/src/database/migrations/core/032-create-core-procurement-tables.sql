-- Core Procurement and Purchase Management
-- Migration: 032-create-core-procurement-tables.sql

CREATE TABLE IF NOT EXISTS procurement_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procurement_purchase_requests (
  id UUID PRIMARY KEY,
  request_number VARCHAR(60) NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  category_id UUID NOT NULL
    REFERENCES procurement_categories(id)
    ON DELETE RESTRICT,

  requested_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  title VARCHAR(300) NOT NULL,
  description TEXT,
  business_justification TEXT,

  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',

  required_by_date DATE,
  estimated_amount NUMERIC(15, 2),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  rejected_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  rejection_reason TEXT,
  cancellation_reason TEXT,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_pr_priority
    CHECK (
      priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_procurement_pr_status
    CHECK (
      status IN (
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'CONVERTED_TO_RFQ',
        'CONVERTED_TO_PO',
        'CLOSED'
      )
    ),

  CONSTRAINT ck_procurement_pr_estimated_amount
    CHECK (
      estimated_amount IS NULL
      OR estimated_amount >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_purchase_request_items (
  id UUID PRIMARY KEY,

  purchase_request_id UUID NOT NULL
    REFERENCES procurement_purchase_requests(id)
    ON DELETE CASCADE,

  line_number INTEGER NOT NULL,
  item_type VARCHAR(30) NOT NULL,
  item_code VARCHAR(100),
  description TEXT NOT NULL,

  quantity NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50) NOT NULL,

  estimated_unit_price NUMERIC(15, 2),
  estimated_amount NUMERIC(15, 2),

  specifications TEXT,

  preferred_vendor_id UUID
    REFERENCES vendors(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_pr_item_line
    UNIQUE (
      purchase_request_id,
      line_number
    ),

  CONSTRAINT ck_procurement_pr_item_type
    CHECK (
      item_type IN (
        'GOODS',
        'SERVICE',
        'ASSET',
        'CONSUMABLE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_procurement_pr_item_quantity
    CHECK (quantity > 0),

  CONSTRAINT ck_procurement_pr_item_unit_price
    CHECK (
      estimated_unit_price IS NULL
      OR estimated_unit_price >= 0
    ),

  CONSTRAINT ck_procurement_pr_item_amount
    CHECK (
      estimated_amount IS NULL
      OR estimated_amount >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_approvals (
  id UUID PRIMARY KEY,

  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,

  sequence_number INTEGER NOT NULL,
  approver_person_id UUID NOT NULL
    REFERENCES persons(id),

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  acted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_approval_sequence
    UNIQUE (
      entity_type,
      entity_id,
      sequence_number
    ),

  CONSTRAINT ck_procurement_approval_entity_type
    CHECK (
      entity_type IN (
        'PURCHASE_REQUEST',
        'PURCHASE_ORDER',
        'PAYMENT_REQUEST'
      )
    ),

  CONSTRAINT ck_procurement_approval_status
    CHECK (
      status IN (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_procurement_approval_sequence
    CHECK (sequence_number > 0)
);

CREATE TABLE IF NOT EXISTS procurement_rfqs (
  id UUID PRIMARY KEY,
  rfq_number VARCHAR(60) NOT NULL UNIQUE,

  purchase_request_id UUID NOT NULL
    REFERENCES procurement_purchase_requests(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  title VARCHAR(300) NOT NULL,
  description TEXT,

  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  issue_date DATE,
  quotation_deadline TIMESTAMPTZ NOT NULL,
  delivery_required_by DATE,

  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  terms_and_conditions TEXT,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  issued_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  awarded_quotation_id UUID,

  issued_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  awarded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_rfq_status
    CHECK (
      status IN (
        'DRAFT',
        'ISSUED',
        'OPEN',
        'CLOSED',
        'AWARDED',
        'CANCELLED',
        'EXPIRED'
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_rfq_vendors (
  id UUID PRIMARY KEY,

  rfq_id UUID NOT NULL
    REFERENCES procurement_rfqs(id)
    ON DELETE CASCADE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  status VARCHAR(20) NOT NULL DEFAULT 'INVITED',

  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,

  CONSTRAINT uq_procurement_rfq_vendor
    UNIQUE (
      rfq_id,
      vendor_id
    ),

  CONSTRAINT ck_procurement_rfq_vendor_status
    CHECK (
      status IN (
        'INVITED',
        'VIEWED',
        'RESPONDED',
        'DECLINED'
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_rfq_items (
  id UUID PRIMARY KEY,

  rfq_id UUID NOT NULL
    REFERENCES procurement_rfqs(id)
    ON DELETE CASCADE,

  purchase_request_item_id UUID
    REFERENCES procurement_purchase_request_items(id)
    ON DELETE SET NULL,

  line_number INTEGER NOT NULL,
  item_type VARCHAR(30) NOT NULL,
  item_code VARCHAR(100),
  description TEXT NOT NULL,

  quantity NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  specifications TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_rfq_item_line
    UNIQUE (
      rfq_id,
      line_number
    ),

  CONSTRAINT ck_procurement_rfq_item_type
    CHECK (
      item_type IN (
        'GOODS',
        'SERVICE',
        'ASSET',
        'CONSUMABLE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_procurement_rfq_item_quantity
    CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS procurement_quotations (
  id UUID PRIMARY KEY,
  quotation_number VARCHAR(60) NOT NULL UNIQUE,

  rfq_id UUID NOT NULL
    REFERENCES procurement_rfqs(id)
    ON DELETE CASCADE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  vendor_reference VARCHAR(150),
  quotation_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  delivery_days INTEGER,

  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  freight_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,

  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,

  submitted_at TIMESTAMPTZ,
  selected_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_rfq_vendor_quotation
    UNIQUE (
      rfq_id,
      vendor_id
    ),

  CONSTRAINT ck_procurement_quotation_status
    CHECK (
      status IN (
        'DRAFT',
        'SUBMITTED',
        'UNDER_EVALUATION',
        'SELECTED',
        'REJECTED',
        'WITHDRAWN',
        'EXPIRED'
      )
    ),

  CONSTRAINT ck_procurement_quotation_validity
    CHECK (valid_until >= quotation_date),

  CONSTRAINT ck_procurement_quotation_delivery_days
    CHECK (
      delivery_days IS NULL
      OR delivery_days >= 0
    ),

  CONSTRAINT ck_procurement_quotation_amounts
    CHECK (
      subtotal >= 0
      AND discount_amount >= 0
      AND tax_amount >= 0
      AND freight_amount >= 0
      AND total_amount >= 0
    )
);

ALTER TABLE procurement_rfqs
ADD CONSTRAINT fk_procurement_rfq_awarded_quotation
FOREIGN KEY (awarded_quotation_id)
REFERENCES procurement_quotations(id)
ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS procurement_quotation_items (
  id UUID PRIMARY KEY,

  quotation_id UUID NOT NULL
    REFERENCES procurement_quotations(id)
    ON DELETE CASCADE,

  rfq_item_id UUID NOT NULL
    REFERENCES procurement_rfq_items(id)
    ON DELETE RESTRICT,

  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,

  quantity NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_price NUMERIC(15, 2) NOT NULL,

  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(7, 4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(15, 2) NOT NULL,

  delivery_days INTEGER,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_quotation_item_line
    UNIQUE (
      quotation_id,
      line_number
    ),

  CONSTRAINT uq_procurement_quotation_rfq_item
    UNIQUE (
      quotation_id,
      rfq_item_id
    ),

  CONSTRAINT ck_procurement_quotation_item_quantity
    CHECK (quantity > 0),

  CONSTRAINT ck_procurement_quotation_item_amounts
    CHECK (
      unit_price >= 0
      AND discount_amount >= 0
      AND tax_rate >= 0
      AND tax_amount >= 0
      AND line_total >= 0
    ),

  CONSTRAINT ck_procurement_quotation_item_delivery
    CHECK (
      delivery_days IS NULL
      OR delivery_days >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_comparisons (
  id UUID PRIMARY KEY,
  comparison_number VARCHAR(60) NOT NULL UNIQUE,

  rfq_id UUID NOT NULL
    REFERENCES procurement_rfqs(id)
    ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  recommended_quotation_id UUID
    REFERENCES procurement_quotations(id)
    ON DELETE SET NULL,

  recommendation_reason TEXT,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  completed_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_comparison_rfq
    UNIQUE (rfq_id),

  CONSTRAINT ck_procurement_comparison_status
    CHECK (
      status IN (
        'DRAFT',
        'COMPLETED',
        'CANCELLED'
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_comparison_entries (
  id UUID PRIMARY KEY,

  comparison_id UUID NOT NULL
    REFERENCES procurement_comparisons(id)
    ON DELETE CASCADE,

  quotation_id UUID NOT NULL
    REFERENCES procurement_quotations(id)
    ON DELETE CASCADE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  total_amount NUMERIC(15, 2) NOT NULL,
  delivery_days INTEGER,

  commercial_score NUMERIC(7, 3),
  technical_score NUMERIC(7, 3),
  overall_score NUMERIC(7, 3),

  rank INTEGER,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_comparison_quotation
    UNIQUE (
      comparison_id,
      quotation_id
    ),

  CONSTRAINT ck_procurement_comparison_amount
    CHECK (total_amount >= 0),

  CONSTRAINT ck_procurement_comparison_delivery
    CHECK (
      delivery_days IS NULL
      OR delivery_days >= 0
    ),

  CONSTRAINT ck_procurement_comparison_scores
    CHECK (
      (
        commercial_score IS NULL
        OR commercial_score BETWEEN 0 AND 100
      )
      AND
      (
        technical_score IS NULL
        OR technical_score BETWEEN 0 AND 100
      )
      AND
      (
        overall_score IS NULL
        OR overall_score BETWEEN 0 AND 100
      )
    ),

  CONSTRAINT ck_procurement_comparison_rank
    CHECK (
      rank IS NULL
      OR rank > 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_purchase_orders (
  id UUID PRIMARY KEY,
  purchase_order_number VARCHAR(60) NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  purchase_request_id UUID
    REFERENCES procurement_purchase_requests(id)
    ON DELETE SET NULL,

  rfq_id UUID
    REFERENCES procurement_rfqs(id)
    ON DELETE SET NULL,

  quotation_id UUID
    REFERENCES procurement_quotations(id)
    ON DELETE SET NULL,

  vendor_contract_id UUID
    REFERENCES vendor_contracts(id)
    ON DELETE SET NULL,

  title VARCHAR(300) NOT NULL,
  description TEXT,

  status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',

  order_date DATE NOT NULL,
  expected_delivery_date DATE,

  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  freight_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,

  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  payment_terms TEXT,
  delivery_terms TEXT,
  shipping_address TEXT,
  billing_address TEXT,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  issued_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  acknowledged_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_po_status
    CHECK (
      status IN (
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'ISSUED',
        'ACKNOWLEDGED',
        'PARTIALLY_RECEIVED',
        'RECEIVED',
        'CLOSED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_procurement_po_delivery_date
    CHECK (
      expected_delivery_date IS NULL
      OR expected_delivery_date >= order_date
    ),

  CONSTRAINT ck_procurement_po_amounts
    CHECK (
      subtotal >= 0
      AND discount_amount >= 0
      AND tax_amount >= 0
      AND freight_amount >= 0
      AND total_amount >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_purchase_order_items (
  id UUID PRIMARY KEY,

  purchase_order_id UUID NOT NULL
    REFERENCES procurement_purchase_orders(id)
    ON DELETE CASCADE,

  quotation_item_id UUID
    REFERENCES procurement_quotation_items(id)
    ON DELETE SET NULL,

  purchase_request_item_id UUID
    REFERENCES procurement_purchase_request_items(id)
    ON DELETE SET NULL,

  line_number INTEGER NOT NULL,
  item_type VARCHAR(30) NOT NULL,
  item_code VARCHAR(100),
  description TEXT NOT NULL,

  ordered_quantity NUMERIC(15, 3) NOT NULL,
  received_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,

  unit VARCHAR(50) NOT NULL,
  unit_price NUMERIC(15, 2) NOT NULL,

  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(7, 4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(15, 2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_po_item_line
    UNIQUE (
      purchase_order_id,
      line_number
    ),

  CONSTRAINT ck_procurement_po_item_type
    CHECK (
      item_type IN (
        'GOODS',
        'SERVICE',
        'ASSET',
        'CONSUMABLE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_procurement_po_item_quantities
    CHECK (
      ordered_quantity > 0
      AND received_quantity >= 0
      AND received_quantity <= ordered_quantity
    ),

  CONSTRAINT ck_procurement_po_item_amounts
    CHECK (
      unit_price >= 0
      AND discount_amount >= 0
      AND tax_rate >= 0
      AND tax_amount >= 0
      AND line_total >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_goods_receipts (
  id UUID PRIMARY KEY,
  goods_receipt_number VARCHAR(60) NOT NULL UNIQUE,

  purchase_order_id UUID NOT NULL
    REFERENCES procurement_purchase_orders(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  receipt_date DATE NOT NULL,
  delivery_reference VARCHAR(150),
  invoice_reference VARCHAR(150),

  received_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  posted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  reversed_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  remarks TEXT,
  posted_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_grn_status
    CHECK (
      status IN (
        'DRAFT',
        'POSTED',
        'REVERSED'
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_goods_receipt_items (
  id UUID PRIMARY KEY,

  goods_receipt_id UUID NOT NULL
    REFERENCES procurement_goods_receipts(id)
    ON DELETE CASCADE,

  purchase_order_item_id UUID NOT NULL
    REFERENCES procurement_purchase_order_items(id)
    ON DELETE RESTRICT,

  ordered_quantity NUMERIC(15, 3) NOT NULL,
  previously_received_quantity NUMERIC(15, 3)
    NOT NULL DEFAULT 0,
  received_quantity NUMERIC(15, 3) NOT NULL,
  accepted_quantity NUMERIC(15, 3) NOT NULL,
  rejected_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,

  status VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED',
  rejection_reason TEXT,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_grn_po_item
    UNIQUE (
      goods_receipt_id,
      purchase_order_item_id
    ),

  CONSTRAINT ck_procurement_grn_item_status
    CHECK (
      status IN (
        'ACCEPTED',
        'PARTIALLY_ACCEPTED',
        'REJECTED'
      )
    ),

  CONSTRAINT ck_procurement_grn_item_quantities
    CHECK (
      ordered_quantity > 0
      AND previously_received_quantity >= 0
      AND received_quantity > 0
      AND accepted_quantity >= 0
      AND rejected_quantity >= 0
      AND accepted_quantity + rejected_quantity =
          received_quantity
      AND previously_received_quantity +
          received_quantity <= ordered_quantity
    )
);

CREATE TABLE IF NOT EXISTS procurement_invoice_matches (
  id UUID PRIMARY KEY,
  invoice_match_number VARCHAR(60) NOT NULL UNIQUE,

  purchase_order_id UUID NOT NULL
    REFERENCES procurement_purchase_orders(id)
    ON DELETE RESTRICT,

  goods_receipt_id UUID
    REFERENCES procurement_goods_receipts(id)
    ON DELETE SET NULL,

  invoice_id UUID
    REFERENCES invoices(id)
    ON DELETE SET NULL,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  external_invoice_number VARCHAR(150),
  invoice_date DATE,

  invoice_amount NUMERIC(15, 2) NOT NULL,
  purchase_order_amount NUMERIC(15, 2) NOT NULL,
  goods_receipt_amount NUMERIC(15, 2),

  amount_variance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  quantity_variance NUMERIC(15, 3) NOT NULL DEFAULT 0,

  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

  matched_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  rejected_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  matched_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  rejection_reason TEXT,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_invoice_match_status
    CHECK (
      status IN (
        'PENDING',
        'MATCHED',
        'PARTIAL_MATCH',
        'MISMATCH',
        'APPROVED',
        'REJECTED'
      )
    ),

  CONSTRAINT ck_procurement_invoice_match_amounts
    CHECK (
      invoice_amount >= 0
      AND purchase_order_amount >= 0
      AND (
        goods_receipt_amount IS NULL
        OR goods_receipt_amount >= 0
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_invoice_match_items (
  id UUID PRIMARY KEY,

  invoice_match_id UUID NOT NULL
    REFERENCES procurement_invoice_matches(id)
    ON DELETE CASCADE,

  purchase_order_item_id UUID NOT NULL
    REFERENCES procurement_purchase_order_items(id)
    ON DELETE RESTRICT,

  goods_receipt_item_id UUID
    REFERENCES procurement_goods_receipt_items(id)
    ON DELETE SET NULL,

  invoiced_quantity NUMERIC(15, 3) NOT NULL,
  ordered_quantity NUMERIC(15, 3) NOT NULL,
  received_quantity NUMERIC(15, 3) NOT NULL,

  unit_price NUMERIC(15, 2) NOT NULL,
  invoice_line_amount NUMERIC(15, 2) NOT NULL,
  purchase_order_line_amount NUMERIC(15, 2) NOT NULL,

  amount_variance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  quantity_variance NUMERIC(15, 3) NOT NULL DEFAULT 0,

  is_matched BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_match_po_item
    UNIQUE (
      invoice_match_id,
      purchase_order_item_id
    ),

  CONSTRAINT ck_procurement_match_item_quantities
    CHECK (
      invoiced_quantity >= 0
      AND ordered_quantity >= 0
      AND received_quantity >= 0
    ),

  CONSTRAINT ck_procurement_match_item_amounts
    CHECK (
      unit_price >= 0
      AND invoice_line_amount >= 0
      AND purchase_order_line_amount >= 0
    )
);

CREATE TABLE IF NOT EXISTS procurement_payment_requests (
  id UUID PRIMARY KEY,
  payment_request_number VARCHAR(60) NOT NULL UNIQUE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  purchase_order_id UUID
    REFERENCES procurement_purchase_orders(id)
    ON DELETE SET NULL,

  invoice_match_id UUID
    REFERENCES procurement_invoice_matches(id)
    ON DELETE SET NULL,

  requested_amount NUMERIC(15, 2) NOT NULL,
  approved_amount NUMERIC(15, 2),
  paid_amount NUMERIC(15, 2),

  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  due_date DATE,

  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  requested_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  rejected_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  paid_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  rejection_reason TEXT,
  payment_reference VARCHAR(200),
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_procurement_payment_status
    CHECK (
      status IN (
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'PAID',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_procurement_payment_amounts
    CHECK (
      requested_amount > 0
      AND (
        approved_amount IS NULL
        OR approved_amount >= 0
      )
      AND (
        paid_amount IS NULL
        OR paid_amount >= 0
      )
      AND (
        approved_amount IS NULL
        OR approved_amount <= requested_amount
      )
      AND (
        paid_amount IS NULL
        OR approved_amount IS NULL
        OR paid_amount <= approved_amount
      )
    )
);

CREATE TABLE IF NOT EXISTS procurement_status_history (
  id UUID PRIMARY KEY,

  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  from_status VARCHAR(40),
  to_status VARCHAR(40) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procurement_attachments (
  id UUID PRIMARY KEY,

  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  document_id UUID NOT NULL
    REFERENCES core_documents(id),

  uploaded_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_procurement_attachment
    UNIQUE (
      entity_type,
      entity_id,
      document_id
    )
);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_property
ON procurement_purchase_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_category
ON procurement_purchase_requests(category_id);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_requester
ON procurement_purchase_requests(requested_by_person_id);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_status
ON procurement_purchase_requests(status);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_required_by
ON procurement_purchase_requests(required_by_date);

CREATE INDEX IF NOT EXISTS idx_procurement_pr_items_request
ON procurement_purchase_request_items(purchase_request_id);

CREATE INDEX IF NOT EXISTS idx_procurement_approvals_entity
ON procurement_approvals(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_procurement_approvals_approver
ON procurement_approvals(approver_person_id, status);

CREATE INDEX IF NOT EXISTS idx_procurement_rfqs_request
ON procurement_rfqs(purchase_request_id);

CREATE INDEX IF NOT EXISTS idx_procurement_rfqs_property
ON procurement_rfqs(property_id);

CREATE INDEX IF NOT EXISTS idx_procurement_rfqs_status
ON procurement_rfqs(status);

CREATE INDEX IF NOT EXISTS idx_procurement_rfqs_deadline
ON procurement_rfqs(quotation_deadline);

CREATE INDEX IF NOT EXISTS idx_procurement_rfq_vendors_rfq
ON procurement_rfq_vendors(rfq_id);

CREATE INDEX IF NOT EXISTS idx_procurement_rfq_vendors_vendor
ON procurement_rfq_vendors(vendor_id);

CREATE INDEX IF NOT EXISTS idx_procurement_rfq_items_rfq
ON procurement_rfq_items(rfq_id);

CREATE INDEX IF NOT EXISTS idx_procurement_quotations_rfq
ON procurement_quotations(rfq_id);

CREATE INDEX IF NOT EXISTS idx_procurement_quotations_vendor
ON procurement_quotations(vendor_id);

CREATE INDEX IF NOT EXISTS idx_procurement_quotations_status
ON procurement_quotations(status);

CREATE INDEX IF NOT EXISTS idx_procurement_quotations_validity
ON procurement_quotations(valid_until);

CREATE INDEX IF NOT EXISTS idx_procurement_quotation_items_quote
ON procurement_quotation_items(quotation_id);

CREATE INDEX IF NOT EXISTS idx_procurement_comparison_rfq
ON procurement_comparisons(rfq_id);

CREATE INDEX IF NOT EXISTS idx_procurement_po_property
ON procurement_purchase_orders(property_id);

CREATE INDEX IF NOT EXISTS idx_procurement_po_vendor
ON procurement_purchase_orders(vendor_id);

CREATE INDEX IF NOT EXISTS idx_procurement_po_status
ON procurement_purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_procurement_po_expected_delivery
ON procurement_purchase_orders(expected_delivery_date);

CREATE INDEX IF NOT EXISTS idx_procurement_po_items_order
ON procurement_purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_procurement_grn_order
ON procurement_goods_receipts(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_procurement_grn_status
ON procurement_goods_receipts(status);

CREATE INDEX IF NOT EXISTS idx_procurement_grn_items_receipt
ON procurement_goods_receipt_items(goods_receipt_id);

CREATE INDEX IF NOT EXISTS idx_procurement_match_order
ON procurement_invoice_matches(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_procurement_match_vendor
ON procurement_invoice_matches(vendor_id);

CREATE INDEX IF NOT EXISTS idx_procurement_match_status
ON procurement_invoice_matches(status);

CREATE INDEX IF NOT EXISTS idx_procurement_payment_vendor
ON procurement_payment_requests(vendor_id);

CREATE INDEX IF NOT EXISTS idx_procurement_payment_property
ON procurement_payment_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_procurement_payment_status
ON procurement_payment_requests(status);

CREATE INDEX IF NOT EXISTS idx_procurement_payment_due
ON procurement_payment_requests(due_date);

CREATE INDEX IF NOT EXISTS idx_procurement_history_entity
ON procurement_status_history(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_procurement_attachment_entity
ON procurement_attachments(entity_type, entity_id);

INSERT INTO procurement_categories (
  id,
  code,
  name,
  description
)
VALUES
  (
    '18000000-0000-4000-8000-000000000001',
    'GENERAL',
    'General Procurement',
    'General goods and services procurement'
  ),
  (
    '18000000-0000-4000-8000-000000000002',
    'MAINTENANCE',
    'Maintenance Materials',
    'Materials and services required for maintenance'
  ),
  (
    '18000000-0000-4000-8000-000000000003',
    'HOUSEKEEPING',
    'Housekeeping',
    'Housekeeping supplies and services'
  ),
  (
    '18000000-0000-4000-8000-000000000004',
    'SECURITY',
    'Security',
    'Security equipment and services'
  ),
  (
    '18000000-0000-4000-8000-000000000005',
    'ELECTRICAL',
    'Electrical',
    'Electrical materials, equipment and services'
  ),
  (
    '18000000-0000-4000-8000-000000000006',
    'PLUMBING',
    'Plumbing',
    'Plumbing materials and services'
  ),
  (
    '18000000-0000-4000-8000-000000000007',
    'IT',
    'IT and Networking',
    'Information technology and networking procurement'
  ),
  (
    '18000000-0000-4000-8000-000000000008',
    'FURNITURE',
    'Furniture and Fixtures',
    'Furniture, fixtures and fit-out procurement'
  ),
  (
    '18000000-0000-4000-8000-000000000009',
    'CAPEX',
    'Capital Expenditure',
    'Capital assets and major project procurement'
  ),
  (
    '18000000-0000-4000-8000-000000000010',
    'UTILITIES',
    'Utilities',
    'Utility-related equipment and services'
  ),
  (
    '18000000-0000-4000-8000-000000000011',
    'PROFESSIONAL_SERVICES',
    'Professional Services',
    'Consulting and professional service procurement'
  ),
  (
    '18000000-0000-4000-8000-000000000012',
    'OTHER',
    'Other',
    'Procurement not represented by another category'
  )
ON CONFLICT (code) DO NOTHING;
