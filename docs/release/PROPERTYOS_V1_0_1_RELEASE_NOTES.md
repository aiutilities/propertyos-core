# PropertyOS v1.0.1 Release Notes

## Release identity

- Version: `v1.0.1`
- Release date: `2026-07-25`
- Audited source HEAD: `3509d053b58c24b8f0426c3dffd1ef06deb86a94`
- Certified capabilities: `50/50`
- Release status: First fully audited and certified PropertyOS release

## Version-history clarification

The existing `v1.0.0` tag was created earlier in the development lifecycle and points to:

`c46354e97a2c799c6745c1216f31886456ffaf9d`

Because that tag is already published remotely, it has been preserved unchanged.

`v1.0.1` is therefore the first release created from the completed certification and final release-audit baseline.

## Overview

PropertyOS v1.0.1 establishes the first complete release baseline of the open-source, AI-native property operating system.

It provides a modular operating platform for property ownership, tenant and lease operations, facilities, resident services, procurement, inventory, extensibility, automation, AI-assisted operations and production deployment.

## Certified capability areas

### Core Platform

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

### Business

- Property
- Tenant
- Agreement
- Lease
- Rent
- Invoice
- Receipt

### Operations

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

### Resident

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

## Final verification

- Backend test suites: 294 passed
- Backend tests: 2,069 passed
- Backend TypeScript build: passed
- Frontend typecheck: passed
- Frontend production build: passed
- Docker production images: built and verified
- Static migration preflight: passed
- Active readiness probe: passed
- Release-blocker scan: passed
- Closure register: 50/50 certified

## Runtime model

PropertyOS v1.0.1 includes:

- API runtime
- Scheduler worker
- Controlled migration runner
- PostgreSQL persistence
- Liveness and fail-closed readiness contracts
- Metrics persistence
- Operational monitoring
- Backup and restore governance
- Plugin installation and publication governance
- Theme packages and activation
- AI specialist routing, delegation and orchestration

## Release governance

This release was created under a source-code release freeze.

After the final audit, only release metadata, an annotated release tag, and local release-package evidence were permitted.

Final audit evidence:

`docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md`
