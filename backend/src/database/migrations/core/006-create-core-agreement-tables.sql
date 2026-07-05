CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  agreement_number VARCHAR(100) NOT NULL,
  current_version_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_agreements_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_agreements_tenant_id
ON agreements(tenant_id);

CREATE INDEX IF NOT EXISTS idx_agreements_status
ON agreements(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agreements_agreement_number_active
ON agreements(agreement_number)
WHERE deleted_at IS NULL;


CREATE TABLE IF NOT EXISTS agreement_versions (
  id UUID PRIMARY KEY,
  agreement_id UUID NOT NULL,
  version_number INTEGER NOT NULL,

  start_date DATE NOT NULL,
  end_date DATE,

  rent_amount NUMERIC(12, 2) NOT NULL,
  deposit_amount NUMERIC(12, 2) NOT NULL,
  notice_period_days INTEGER NOT NULL DEFAULT 30,

  agreement_document_url TEXT,
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_agreement_versions_agreement
    FOREIGN KEY (agreement_id)
    REFERENCES agreements(id)
);

CREATE INDEX IF NOT EXISTS idx_agreement_versions_agreement_id
ON agreement_versions(agreement_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agreement_versions_agreement_version_active
ON agreement_versions(agreement_id, version_number)
WHERE deleted_at IS NULL;
