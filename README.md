<div align="center">

# PropertyOS

### The Open Source AI-Native Operating System for Properties, Workspaces and Hospitality.

A modular operating platform for managing people, spaces, facilities, assets, maintenance, reservations, procurement, inventory, documents, workflows and AI-assisted operations.

[![Release](https://img.shields.io/github/v/release/aiutilities/propertyos-core)](https://github.com/aiutilities/propertyos-core/releases)
[![Latest Release](https://img.shields.io/badge/release-v1.0.1-blue)](https://github.com/aiutilities/propertyos-core/releases/tag/v1.0.1)
[![Capabilities](https://img.shields.io/badge/capabilities-50%2F50%20certified-success)](docs/release/PROPERTYOS_CLOSURE_REGISTER.md)
[![Backend Tests](https://img.shields.io/badge/backend%20tests-2069%20passed-success)](docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md)

[Why PropertyOS](#why-propertyos) ·
[Capabilities](#certified-capabilities) ·
[Architecture](#architecture) ·
[Quick Start](#quick-start) ·
[Documentation](#documentation)

</div>

---

## What is PropertyOS?

PropertyOS is an open-source, AI-native operating system that helps organizations manage and automate the complete lifecycle of properties, workspaces and hospitality environments.

Built with a modular, plugin-first architecture, PropertyOS provides shared foundations for:

- identity and authorization
- properties and spaces
- tenants, agreements and leases
- rent, invoices and receipts
- maintenance, facilities and assets
- staff and vehicles
- reservations and helpdesk
- procurement and inventory
- documents and storage
- workflows, events and scheduling
- notifications and search
- plugins and themes
- AI specialists and orchestration
- production deployment and observability

Organizations can deploy the capabilities they need, extend the platform through plugins and APIs, and retain control of their operating data and infrastructure.

> **PropertyOS is the Linux of property operations—an open-source, AI-native operating system that powers apartments, coworking spaces, offices, hotels, campuses and other managed spaces through a modular plugin architecture.**

---

## Why PropertyOS?

Managed spaces rarely operate through one coherent system.

They accumulate disconnected tools for maintenance, bookings, payments, tenant records, documents, procurement, inventory, facilities, communication, analytics and artificial intelligence.

As systems multiply, data fragments and people compensate through spreadsheets, messages and manual coordination.

PropertyOS provides a common operating foundation.

It is not another isolated property-management application.

It is a platform on which operational applications, plugins, themes, workflows and AI specialists can work together.

### PropertyOS believes

- Software should adapt to organizations.
- Organizations should control their data and infrastructure.
- Stable core contracts should support innovation at the edges.
- AI should assist people without removing accountability.
- Open ecosystems are stronger than proprietary lock-in.
- Operational readiness is part of the product.
- Documentation and tests are product capabilities.
- Certification should precede release.

Read the foundational documents:

- [PropertyOS Constitution](docs/00_PROPERTYOS_CONSTITUTION.md)
- [PropertyOS Manifesto](docs/01_PROPERTYOS_MANIFESTO.md)
- [Product Vision](docs/product/PRODUCT_VISION.md)
- [Architecture Principles](docs/03_ARCHITECTURE_PRINCIPLES.md)

---

## Who is PropertyOS for?

PropertyOS is designed for organizations operating managed physical environments.

### Properties

- apartments
- gated communities
- rental portfolios
- coliving spaces
- student housing
- mixed-use developments

### Workspaces

- coworking spaces
- offices
- business centres
- commercial buildings
- campuses
- industrial parks

### Hospitality

- hotels
- resorts
- serviced apartments
- hostels
- guest accommodation

### Other managed environments

- warehouses
- healthcare facilities
- clubs
- institutional campuses
- specialized managed-space operations

The shared platform remains consistent while vertical-specific behavior can be introduced through plugins, configuration and workflows.

---

## Certified v1.0.1 release

PropertyOS v1.0.1 is the first fully audited and certified release.

| Verification | Result |
|---|---:|
| Certified capabilities | **50/50** |
| Backend test suites | **294 passed** |
| Backend tests | **2,069 passed** |
| Backend build | **Passed** |
| Frontend typecheck | **Passed** |
| Frontend production build | **Passed** |
| Docker images | **Built and verified** |
| Migration preflight | **Passed** |
| Active readiness probe | **Passed** |
| Release-blocker scan | **Passed** |

Release evidence:

- [v1.0.1 release notes](docs/release/PROPERTYOS_V1_0_1_RELEASE_NOTES.md)
- [v1.0.1 release manifest](docs/release/PROPERTYOS_V1_0_1_RELEASE_MANIFEST.md)
- [Final release audit](docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md)
- [Capability closure register](docs/release/PROPERTYOS_CLOSURE_REGISTER.md)
- [GitHub release](https://github.com/aiutilities/propertyos-core/releases/tag/v1.0.1)

---

## Certified capabilities

### Core platform

- Identity
- Authentication
- Authorization
- Configuration
- Workflow
- Event Bus
- Scheduler
- Notification
- Search
- Storage

### Business operations

- Property
- Tenant
- Agreement
- Lease
- Rent
- Invoice
- Receipt

### Operational management

- Maintenance
- Facility
- Asset
- Staff
- Vehicle

### Procurement

- Purchase Request
- RFQ
- Quotation
- Comparison
- Purchase Order
- Goods Receipt
- Invoice Match
- Payment Request

### Inventory

- Item
- Batch
- Stock
- Material Issue
- Material Return
- Cycle Count
- Adjustment

### Resident and user services

- Reservation
- Helpdesk
- Documents

### Platform extensibility

- Plugin
- Theme
- AI Runtime

### Production readiness

- Docker
- Upgrade
- Backup
- Restore
- Monitoring
- Metrics
- Health

---

## Architecture

PropertyOS follows a modular, plugin-first, event-driven and API-first architecture.

### Experience layer

- Admin interfaces
- Resident interfaces
- Staff and operator interfaces
- Theme-driven user experiences

### Platform API layer

- REST APIs
- Validation
- Authentication and authorization
- Permission enforcement
- Search integration

### Business capability layer

- Property, tenant, agreement and lease
- Rent, invoices and receipts
- Maintenance, facilities and assets
- Procurement and inventory
- Reservations, helpdesk and documents

### Platform services layer

- Identity
- Configuration
- Workflow
- Event Bus
- Scheduler
- Notifications
- Storage
- Search
- Metrics and health

### Extensibility layer

- Plugins
- Themes
- SDKs
- APIs
- Events
- Hooks
- Extension registries

### AI runtime layer

- Specialist agents
- Capability routing
- Delegation
- Orchestration
- Policy enforcement
- Provider abstraction
- Intelligence services

### Infrastructure layer

- NestJS
- Next.js
- PostgreSQL
- Docker
- Controlled migrations
- Monitoring
- Backup and restore

Architecture references:

- [System architecture](docs/architecture/ARCHITECTURE.md)
- [Architecture documentation](architecture/README.md)
- [Architecture decision records](adrs/README.md)
- [Repository guide](docs/development/REPOSITORY_GUIDE.md)
- [Core versus plugin boundaries](architecture/004-Core-vs-Plugin-Boundaries.md)
- [Event catalog](architecture/006-Event-Catalog.md)

---

## Plugin-first extensibility

PropertyOS separates stable platform foundations from domain-specific innovation.

The plugin system supports:

- package validation
- secure archive extraction
- manifest validation
- publisher trust
- dependency resolution
- installation coordination
- migrations
- activation and deactivation
- upgrade and rollback
- uninstall controls
- runtime loading
- extension registries
- marketplace foundations
- publication governance

Extension points include:

- configuration
- dashboards
- documents
- notifications
- permissions
- scheduler jobs
- search providers
- workflows
- hooks
- runtime modules

Plugin documentation:

- [Plugin overview](backend/core/plugin/README.md)
- [Plugin engine design](backend/core/plugin/Plugin-Engine-Module-Design.md)
- [Plugin SDK](sdk/README.md)
- [Plugin architecture ADR](adrs/ADR-001-Plugin-First-Architecture.md)
- [Installable plugins and themes ADR](adrs/ADR-011-Admin-Installable-Plugins-and-Themes.md)

---

## Theme system

Themes control presentation without owning operational behavior.

PropertyOS supports:

- theme registration
- package validation
- installation
- activation
- archival
- theme APIs
- frontend theme management

Business logic belongs to platform modules and plugins.

Presentation belongs to themes.

Theme documentation:

- [Theme system](backend/core/theme/README.md)
- [Frontend themes](frontend/themes/README.md)
- [Theme module documentation](docs/generated/modules/theme.md)

---

## AI-native runtime

PropertyOS includes an AI runtime designed around controlled specialist delegation rather than one unrestricted assistant.

The runtime supports:

- specialist-agent registration
- capability discovery
- capability-based routing
- delegation planning
- orchestration
- business-domain triggers
- provider abstraction
- model-failure handling
- policy enforcement
- confidence and evidence controls
- audit integration
- event publication
- observability

AI complements deterministic business rules.

It does not bypass authorization, workflow policy or operational accountability.

AI documentation:

- [AI module overview](backend/core/ai/README.md)
- [AI architecture audit](ai-architecture-audit.md)
- [AI SDK boundary](docs/PHASE_16E1B_AI_SDK_BOUNDARY.md)
- [Provider-agnostic AI ADR](adrs/ADR-012-AI-Provider-Agnostic-Agent-Layer.md)
- [AI certification](docs/release/PLATFORM_AI_RUNTIME_CERTIFICATION.md)

---

## Technology stack

### Backend

- NestJS
- TypeScript
- PostgreSQL
- REST APIs
- Modular domain architecture
- Scheduler worker
- Controlled migration runner

### Frontend

- Next.js
- React
- TypeScript
- Responsive web application
- Theme-aware interfaces

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Health and readiness endpoints
- Persistent metrics
- Monitoring scripts
- Backup and restore governance

---

## Quick start

### Requirements

- Git
- Docker
- Docker Compose

### Clone the repository

Run:

    git clone https://github.com/aiutilities/propertyos-core.git
    cd propertyos-core

### Start the backend stack

Run:

    cd backend
    docker compose up --build

The backend stack includes:

- PostgreSQL
- migration runner
- API
- scheduler worker

### Health endpoints

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

### Validate readiness

Run:

    curl http://localhost:3000/api/v1/health/ready

Authoritative operational guides:

- [Deployment guide](documentation/DEPLOYMENT.md)
- [Backup and restore](documentation/BACKUP_RESTORE.md)
- [Operations guide](documentation/OPERATIONS.md)
- [Production operational runbook](documentation/PHASE_13D6_PRODUCTION_OPERATIONAL_RUNBOOK.md)

---

## Development

Before contributing or modifying the platform, review:

- [Repository guide](docs/development/REPOSITORY_GUIDE.md)
- [Backend guide](backend/README.md)
- [Frontend guide](frontend/README.md)
- [Architecture guide](architecture/README.md)
- [Project standards](docs/STANDARDS.md)

The primary application areas are:

- `backend/`
- `frontend/`

Supporting project areas include:

- `adrs/` for architecture decisions
- `architecture/` for platform and domain design
- `docs/` for canonical and generated documentation
- `documentation/` for deployment and operations
- `plugins/` for plugin resources
- `sdk/` for extension SDK documentation
- `themes/` for theme resources

---

## Documentation

PropertyOS contains extensive architecture, product, operational and release documentation.

### Start here

| Topic | Document |
|---|---|
| Constitution | [PropertyOS Constitution](docs/00_PROPERTYOS_CONSTITUTION.md) |
| Manifesto | [PropertyOS Manifesto](docs/01_PROPERTYOS_MANIFESTO.md) |
| Documentation index | [Documentation home](docs/README.md) |
| Product vision | [Product Vision](docs/product/PRODUCT_VISION.md) |
| Architecture | [Architecture](docs/architecture/ARCHITECTURE.md) |
| Repository guide | [Repository Guide](docs/development/REPOSITORY_GUIDE.md) |
| Deployment | [Deployment Guide](documentation/DEPLOYMENT.md) |
| Operations | [Operations Guide](documentation/OPERATIONS.md) |
| Release notes | [v1.0.1 Release Notes](docs/release/PROPERTYOS_V1_0_1_RELEASE_NOTES.md) |

### Architecture

- [Architecture index](architecture/README.md)
- [System architecture](architecture/002-System-Architecture.md)
- [Backend domain model](architecture/003-Backend-Domain-Model.md)
- [Core modules](architecture/003-Core-Modules.md)
- [PostgreSQL schema](architecture/004-PostgreSQL-Schema.md)
- [NestJS module layout](architecture/005-NestJS-Module-Layout.md)
- [Event catalog](architecture/006-Event-Catalog.md)

### Architecture decisions

- [ADR index](adrs/README.md)
- [Plugin-first architecture](adrs/ADR-001-Plugin-First-Architecture.md)
- [Event-driven communication](adrs/ADR-002-Event-Driven-Communication.md)
- [PostgreSQL primary store](adrs/ADR-003-PostgreSQL-Primary-Store.md)
- [NestJS backend](adrs/ADR-004-NestJS-Backend.md)
- [Next.js frontend](adrs/ADR-005-NextJS-Frontend.md)
- [Open-source core strategy](adrs/ADR-010-Open-Source-Core-Strategy.md)
- [AI-provider-agnostic agent layer](adrs/ADR-012-AI-Provider-Agnostic-Agent-Layer.md)

### Modules

Generated module documentation is available here:

- [Module documentation index](docs/generated/modules/README.md)

### Release evidence

- [Capability closure register](docs/release/PROPERTYOS_CLOSURE_REGISTER.md)
- [Final release audit](docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md)
- [Release manifest](docs/release/PROPERTYOS_V1_0_1_RELEASE_MANIFEST.md)
- [Release notes](docs/release/PROPERTYOS_V1_0_1_RELEASE_NOTES.md)

---

## Repository governance

PropertyOS is entering its formal open-source governance phase.

The following repository documents are being established under the PropertyOS Constitution:

- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `SUPPORT.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `TRADEMARKS.md`

PropertyOS Core is licensed under the Mozilla Public License 2.0.

---

## Contributing

PropertyOS welcomes contributors who align with its Constitution and community principles.

Before formal contribution workflows are published, prospective contributors should:

1. read the [PropertyOS Constitution](docs/00_PROPERTYOS_CONSTITUTION.md)
2. read the [PropertyOS Manifesto](docs/01_PROPERTYOS_MANIFESTO.md)
3. review the [architecture decisions](adrs/README.md)
4. review the [repository guide](docs/development/REPOSITORY_GUIDE.md)
5. open an issue before starting major architectural work

A complete `CONTRIBUTING.md` will be added during the Repository Governance phase.

---

## Security

Do not publish suspected vulnerabilities in public issues.

A formal `SECURITY.md` and responsible-disclosure process will be added during the Repository Governance phase.

Until that process is published, avoid sharing exploit details publicly.

---

## Roadmap

PropertyOS v1.0.1 establishes the certified platform baseline.

The immediate roadmap focuses on:

1. repository governance
2. documentation navigation
3. installation experience
4. demo environments
5. screenshots and product walkthroughs
6. project website
7. contributor community
8. plugin and theme ecosystem
9. first production pilot
10. evidence-driven future releases

Future product development must remain governed by the PropertyOS Constitution and real operational feedback.

---

## Release model

PropertyOS follows controlled semantic release practices.

- `v1.0.x` — critical fixes, security maintenance and release corrections
- `v1.1.x` — backward-compatible improvements
- `v2.x` — deliberately governed major changes

Published tags are immutable.

Every release should be supported by tests, build evidence, migration validation and release documentation.

---

## Project status

| Area | Status |
|---|---|
| PropertyOS v1 implementation | Complete |
| Capability certification | 50/50 complete |
| Final release audit | Passed |
| GitHub release | Published |
| Foundation program | Active |
| Product feature development | Frozen |
| Repository governance | In progress |
| First production pilot | Planned |

---

## License

PropertyOS Core is licensed under the **Mozilla Public License 2.0**.

The MPL-2.0 protects modifications to covered PropertyOS source files while allowing independent plugins, integrations and larger applications to use their own compatible licensing models.

See the root [LICENSE](LICENSE) file for the complete license text.

The PropertyOS name, logo and associated trademarks are owned by **Cogzidel Technologies Pvt. Ltd.** and are not granted under the MPL-2.0.

---

## Stewardship

PropertyOS is created, maintained and stewarded by **Cogzidel Technologies Pvt. Ltd.**

Cogzidel Technologies Pvt. Ltd. builds open, AI-native operating systems for industries.

The company provides long-term legal, architectural and operational stewardship for PropertyOS while fostering an open-source ecosystem around the platform.

The PropertyOS name, logo and associated trademarks are owned by Cogzidel Technologies Pvt. Ltd.

---

## Acknowledgements

PropertyOS was created from the belief that the operations of physical environments deserve an open, coherent and extensible foundation.

Its development has been shaped by real property operations, platform engineering, rigorous release certification and a commitment to long-term stewardship.

---

<div align="center">

## Build infrastructure for the physical world.

[Read the Constitution](docs/00_PROPERTYOS_CONSTITUTION.md) ·
[Read the Manifesto](docs/01_PROPERTYOS_MANIFESTO.md) ·
[Explore the Documentation](docs/README.md) ·
[View the Release](https://github.com/aiutilities/propertyos-core/releases/tag/v1.0.1)

</div>
