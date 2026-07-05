CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    receipt_number VARCHAR(100) NOT NULL UNIQUE,

    rent_payment_id UUID NOT NULL REFERENCES rent_payments(id) ON DELETE RESTRICT,
    rent_ledger_id UUID NOT NULL REFERENCES rent_ledgers(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    amount NUMERIC(12, 2) NOT NULL,

    receipt_date DATE NOT NULL,

    payment_mode VARCHAR(50) NOT NULL,
    reference_number VARCHAR(150),

    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipts_rent_payment_id
ON receipts(rent_payment_id);

CREATE INDEX IF NOT EXISTS idx_receipts_rent_ledger_id
ON receipts(rent_ledger_id);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id
ON receipts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date
ON receipts(receipt_date);
