CREATE TABLE IF NOT EXISTS rent_ledgers (
  id UUID PRIMARY KEY,

  tenant_id UUID NOT NULL,
  agreement_id UUID NOT NULL,

  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  due_date DATE NOT NULL,

  rent_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(12,2) NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_rent_ledger_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id),

  CONSTRAINT fk_rent_ledger_agreement
    FOREIGN KEY (agreement_id)
    REFERENCES agreements(id)
);

CREATE INDEX IF NOT EXISTS idx_rent_ledger_tenant
ON rent_ledgers(tenant_id);

CREATE INDEX IF NOT EXISTS idx_rent_ledger_period
ON rent_ledgers(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_rent_ledger_status
ON rent_ledgers(status);
