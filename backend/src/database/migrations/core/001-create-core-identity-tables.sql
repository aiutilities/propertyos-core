CREATE TABLE persons (
    id UUID PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    permission_key VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE person_roles (
    id UUID PRIMARY KEY,
    person_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_person_roles_person
        FOREIGN KEY (person_id)
        REFERENCES persons(id),
    CONSTRAINT fk_person_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY,
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
);

CREATE TABLE credentials (
    id UUID PRIMARY KEY,
    person_id UUID NOT NULL,
    credential_type VARCHAR(100) NOT NULL,
    credential_value VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_credentials_person
        FOREIGN KEY (person_id)
        REFERENCES persons(id)
);

CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_phone ON persons(phone);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_key ON permissions(permission_key);
CREATE INDEX idx_person_roles_person ON person_roles(person_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_credentials_person ON credentials(person_id);
