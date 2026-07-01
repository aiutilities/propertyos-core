# PostgreSQL Schema Design

## PropertyOS Version 0.1

---

# Purpose

This document defines the initial PostgreSQL schema for PropertyOS Core.

The schema must support:

* Property Management
* Identity & Access Control
* Event Driven Architecture
* Plugin Architecture
* Notifications
* Documents
* Audit Trails

This schema is intentionally minimal.

Additional tables should be added through future ADRs.

---

# Design Principles

1. PostgreSQL is the primary datastore.
2. UUID primary keys everywhere.
3. Soft delete preferred.
4. Audit instead of destructive updates.
5. JSONB for extensibility.
6. Plugin-safe architecture.
7. Multi-property capable.
8. Single-tenant deployment first.

---

# Common Columns

Most tables should contain:

```sql
id UUID PRIMARY KEY

created_at TIMESTAMP NOT NULL DEFAULT NOW()

updated_at TIMESTAMP NOT NULL DEFAULT NOW()

deleted_at TIMESTAMP NULL
```

---

# ORGANIZATIONS

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    code VARCHAR(100) UNIQUE,

    type VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMP
);
```

---

# PROPERTIES

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    code VARCHAR(100),

    address TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMP,

    CONSTRAINT fk_property_org
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
);
```

---

# ZONES

```sql
CREATE TABLE zones (
    id UUID PRIMARY KEY,

    property_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    type VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMP,

    CONSTRAINT fk_zone_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
);
```

---

# SPACES

```sql
CREATE TABLE spaces (
    id UUID PRIMARY KEY,

    property_id UUID NOT NULL,

    zone_id UUID,

    name VARCHAR(255) NOT NULL,

    space_type VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMP,

    CONSTRAINT fk_space_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id),

    CONSTRAINT fk_space_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
);
```

---

# PEOPLE

```sql
CREATE TABLE people (
    id UUID PRIMARY KEY,

    first_name VARCHAR(255) NOT NULL,

    last_name VARCHAR(255),

    mobile VARCHAR(50),

    email VARCHAR(255),

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMP
);
```

---

# USER ACCOUNTS

```sql
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY,

    person_id UUID NOT NULL,

    username VARCHAR(255) UNIQUE,

    email VARCHAR(255),

    password_hash TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'active',

    last_login_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_person
        FOREIGN KEY (person_id)
        REFERENCES people(id)
);
```

---

# ROLES

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# PERMISSIONS

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,

    code VARCHAR(255) UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# ROLE PERMISSIONS

```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,

    permission_id UUID NOT NULL,

    PRIMARY KEY(role_id, permission_id),

    FOREIGN KEY(role_id)
        REFERENCES roles(id),

    FOREIGN KEY(permission_id)
        REFERENCES permissions(id)
);
```

---

# USER ROLES

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL,

    role_id UUID NOT NULL,

    PRIMARY KEY(user_id, role_id),

    FOREIGN KEY(user_id)
        REFERENCES user_accounts(id),

    FOREIGN KEY(role_id)
        REFERENCES roles(id)
);
```

---

# PROPERTY MEMBERS

```sql
CREATE TABLE property_members (
    id UUID PRIMARY KEY,

    property_id UUID NOT NULL,

    person_id UUID NOT NULL,

    role_name VARCHAR(100),

    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY(property_id)
        REFERENCES properties(id),

    FOREIGN KEY(person_id)
        REFERENCES people(id)
);
```

---

# ORGANIZATION MEMBERS

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    person_id UUID NOT NULL,

    role_name VARCHAR(100),

    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY(organization_id)
        REFERENCES organizations(id),

    FOREIGN KEY(person_id)
        REFERENCES people(id)
);
```

---

# DOCUMENTS

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    original_file_name VARCHAR(255) NOT NULL,

    category VARCHAR(100),

    mime_type VARCHAR(255),

    size_in_bytes BIGINT,

    storage_path TEXT NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(255),

    version INTEGER DEFAULT 1,

    uploaded_by UUID,

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# NOTIFICATION LOGS

```sql
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY,

    channel VARCHAR(50),

    recipient_type VARCHAR(50),

    recipient_id UUID,

    recipient_address VARCHAR(255),

    template_key VARCHAR(255),

    data JSONB,

    priority VARCHAR(50),

    source VARCHAR(255),

    status VARCHAR(50),

    provider VARCHAR(255),

    provider_message_id VARCHAR(255),

    error_message TEXT,

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    sent_at TIMESTAMP
);
```

---

# EVENT LOGS

```sql
CREATE TABLE event_logs (
    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    source VARCHAR(255) NOT NULL,

    payload JSONB NOT NULL,

    metadata JSONB,

    status VARCHAR(50) DEFAULT 'published',

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# AUDIT LOGS

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,

    action VARCHAR(255) NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(255),

    actor_type VARCHAR(100),

    actor_id VARCHAR(255),

    source VARCHAR(255),

    event_name VARCHAR(255),

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# PLUGINS

```sql
CREATE TABLE plugins (
    id UUID PRIMARY KEY,

    name VARCHAR(100) UNIQUE NOT NULL,

    display_name VARCHAR(255) NOT NULL,

    version VARCHAR(50) NOT NULL,

    description TEXT,

    author VARCHAR(255),

    type VARCHAR(50),

    status VARCHAR(50),

    manifest JSONB NOT NULL,

    config JSONB,

    installed_at TIMESTAMP NOT NULL DEFAULT NOW(),

    activated_at TIMESTAMP,

    deactivated_at TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# ASSETS

```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,

    property_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    asset_type VARCHAR(100),

    serial_number VARCHAR(255),

    status VARCHAR(50),

    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY(property_id)
        REFERENCES properties(id)
);
```

---

# Recommended Indexes

```sql
CREATE INDEX idx_people_mobile
ON people(mobile);

CREATE INDEX idx_people_email
ON people(email);

CREATE INDEX idx_property_code
ON properties(code);

CREATE INDEX idx_zone_property
ON zones(property_id);

CREATE INDEX idx_space_property
ON spaces(property_id);

CREATE INDEX idx_document_entity
ON documents(entity_type, entity_id);

CREATE INDEX idx_event_name
ON event_logs(name);

CREATE INDEX idx_audit_action
ON audit_logs(action);

CREATE INDEX idx_notification_status
ON notification_logs(status);

CREATE INDEX idx_plugin_status
ON plugins(status);
```

---

# Version 0.1 Table Count

Core tables:

```text
organizations
properties
zones
spaces
people
user_accounts
roles
permissions
role_permissions
user_roles
property_members
organization_members
documents
notification_logs
event_logs
audit_logs
plugins
assets
```

Total:

```text
18 tables
```

---

# Version 0.1 Success Criteria

The schema is successful when it supports:

* Identity
* Authorization
* Properties
* People
* Documents
* Notifications
* Events
* Auditing
* Plugins
* Assets

without requiring schema redesign for the Visitor Plugin.

