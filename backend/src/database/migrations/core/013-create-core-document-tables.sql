CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS core_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    template_type VARCHAR(50) NOT NULL DEFAULT 'HTML',
    content TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES core_document_templates(id),
    entity_type VARCHAR(100),
    entity_id UUID,
    title VARCHAR(250) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'GENERATED',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES core_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

CREATE TABLE IF NOT EXISTS core_document_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES core_documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES core_document_versions(id) ON DELETE SET NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    file_path TEXT,
    file_url TEXT,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_documents_entity
ON core_documents(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_core_document_versions_document
ON core_document_versions(document_id);
