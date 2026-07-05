CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID PRIMARY KEY,

  rent_ledger_id UUID NOT NULL,

  payment_date DATE NOT NULL,

  amount NUMERIC(12,2) NOT NULL,

  payment_mode VARCHAR(50) NOT NULL,
  reference_number VARCHAR(255),

  notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_rent_payments_ledger
    FOREIGN KEY (rent_ledger_id)
    REFERENCES rent_ledgers(id)
);

CREATE INDEX IF NOT EXISTS idx_rent_payments_ledger
ON rent_payments(rent_ledger_id);

CREATE INDEX IF NOT EXISTS idx_rent_payments_payment_date
ON rent_payments(payment_date);
