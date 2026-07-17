---
title: PropertyOS Platform Architecture
description: High-level architecture, platform boundaries, extension model, and request flow for PropertyOS.
version: 3.0
status: approved
owner: Platform Team

tags:
  - architecture
  - platform
  - backend
  - frontend
  - plugins
  - events

related:
  - product/product-vision
  - development/repository-guide
  - standards
---

# PropertyOS Platform Architecture

## Overview

PropertyOS is an open-source, modular operating system for properties,
communities, facilities, and related business operations.

The platform combines a Next.js frontend, a NestJS backend, PostgreSQL
persistence, event-driven workflows, background workers, plugins, themes,
and integration services.

---

# Platform Context

```mermaid
flowchart LR

    User[Property Owner / Staff / Resident]

    Frontend[Next.js Frontend]

    API[NestJS Backend]

    Domain[Domain Services]

    Repository[Repositories]

    Database[(PostgreSQL)]

    Events[Event Bus]

    Worker[Scheduler / Worker]

    Plugins[Plugin Runtime]

    External[External Services]

    User --> Frontend
    Frontend --> API

    API --> Domain

    Domain --> Repository
    Repository --> Database

    Domain --> Events

    Events --> Worker
    Events --> Plugins
    Events --> External
```

---

# Request Flow

```mermaid
sequenceDiagram

actor User

participant UI as Frontend

participant API

participant Auth

participant Domain

participant Repo

participant DB

participant Events

User->>UI: Submit Request

UI->>API: HTTP Request

API->>Auth: Validate Session

Auth-->>API: OK

API->>Domain: Execute Use Case

Domain->>Repo: Persist

Repo->>DB: SQL

DB-->>Repo: Result

Repo-->>Domain: Entity

Domain->>Events: Publish Event

Domain-->>API: Result

API-->>UI: Response

UI-->>User: Updated Screen
```

---

# Platform Layers

## Frontend

Responsibilities

- Application routing
- Authentication
- Dashboards
- Forms
- Documentation Portal
- Plugin UI
- Theme UI

---

## Backend

Responsibilities

- REST APIs
- Business Logic
- RBAC
- Validation
- Workflow Engine
- Notification Engine
- Plugin Runtime
- Scheduler

---

## Persistence

PropertyOS uses PostgreSQL as the primary transactional datastore.

Repositories isolate SQL implementation from domain services.

---

## Event Driven Architecture

```mermaid
flowchart TD

Domain[Domain Service]

Bus[Event Bus]

Notifications[Notifications]

Workflow[Workflow Engine]

Metrics[Metrics]

Plugins[Plugins]

Integrations[External Integrations]

Domain --> Bus

Bus --> Notifications

Bus --> Workflow

Bus --> Metrics

Bus --> Plugins

Bus --> Integrations
```

---

# Extension Model

PropertyOS is designed around extensibility.

## Plugins

Backend extensions

- APIs
- Events
- Scheduled jobs
- Permissions
- Integrations

## Themes

Frontend customization

- Branding
- Layout
- Navigation
- Components

## Workflows

Business automation

- Approvals
- Notifications
- Scheduled execution
- Event triggers

---

# Major Domains

Current platform domains include

- Identity & Access
- Property
- Zones
- Spaces
- Tenants
- Leases
- Rent Ledger
- Payments
- Receipts
- Reservations
- Visitors
- Security
- Maintenance
- Helpdesk
- Facilities
- Assets
- Staff
- Vehicles
- Procurement
- Inventory
- Notifications
- Plugins
- Themes

---

# Security Pipeline

```mermaid
flowchart LR

Request

Session

Identity

Permission

Validation

Repository

Audit

Request --> Session

Session --> Identity

Identity --> Permission

Permission --> Validation

Validation --> Repository

Repository --> Audit
```

---

# Deployment

Typical deployment

- Frontend
- Backend API
- PostgreSQL
- Worker
- Scheduler
- Object Storage
- Reverse Proxy
- Monitoring

---

# Architecture Principles

PropertyOS follows these principles.

- Domain Driven Design
- Modular Architecture
- API First
- Event Driven
- Plugin First
- Theme Driven
- Open Source
- Cloud Native
- Self Hosted
- AI Ready

---

# Architectural Governance

Changes affecting

- APIs
- Domain boundaries
- Database
- Events
- Plugins
- Security
- Deployment

must be documented through Architecture Decision Records (ADRs).

---

# Related Documents

- Product Vision
- Repository Guide
- Documentation Standards
