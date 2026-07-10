CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES persons(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  move_in_date TIMESTAMPTZ,
  move_out_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_person_id
ON tenants(person_id);

CREATE INDEX IF NOT EXISTS idx_tenants_property_id
ON tenants(property_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_property_tenant_number
ON tenants(property_id, tenant_number);

CREATE TABLE IF NOT EXISTS tenant_spaces (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  space_id UUID NOT NULL REFERENCES spaces(id),
  assigned_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenant_spaces_tenant_id
ON tenant_spaces(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_spaces_space_id
ON tenant_spaces(space_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_spaces_active_space
ON tenant_spaces(space_id)
WHERE released_at IS NULL;
