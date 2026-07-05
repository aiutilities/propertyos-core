CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    tenant_id UUID NOT NULL REFERENCES tenants(id),
    agreement_id UUID REFERENCES agreements(id),
    rent_ledger_id UUID REFERENCES rent_ledgers(id),
    receipt_id UUID REFERENCES receipts(id),

    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,

    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_invoices_status
        CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED')),

    CONSTRAINT chk_invoices_amount_non_negative
        CHECK (amount >= 0),

    CONSTRAINT chk_invoices_billing_period
        CHECK (billing_period_end >= billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id
    ON invoices(tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_agreement_id
    ON invoices(agreement_id);

CREATE INDEX IF NOT EXISTS idx_invoices_rent_ledger_id
    ON invoices(rent_ledger_id);

CREATE INDEX IF NOT EXISTS idx_invoices_receipt_id
    ON invoices(receipt_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
    ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date
    ON invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date
    ON invoices(due_date);
