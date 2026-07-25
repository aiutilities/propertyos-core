# PropertyOS Architecture Guide

This guide provides a developer-oriented map of PropertyOS architecture.

Canonical architecture specifications remain under `../../architecture/`.

---

## 1. Architectural Positioning

PropertyOS is an open-source, AI-native operating system for properties,
workspaces and hospitality.

Its architecture is:

- modular;
- plugin-first;
- API-first;
- event-driven;
- provider-agnostic;
- auditable;
- self-hostable;
- constitution-driven.

---

## 2. Architectural Layers

PropertyOS can be understood through these broad layers:

1. Platform foundation
2. Business domains
3. Extension ecosystem
4. AI platform
5. User interfaces
6. Infrastructure and operations
7. Governance and certification

Each layer exposes controlled boundaries rather than unrestricted internal
access.

---

## 3. Platform Foundation

Platform foundation capabilities include areas such as:

- identity;
- authentication;
- authorization;
- configuration;
- event bus;
- workflows;
- scheduling;
- notifications;
- storage;
- search;
- documents;
- forms;
- health;
- metrics;
- plugin lifecycle;
- theme lifecycle;
- AI runtime.

These services support higher-level business domains.

---

## 4. Business Domains

Business domains include capabilities such as:

- properties;
- zones;
- spaces;
- tenants;
- agreements;
- leases;
- rent;
- payments;
- receipts;
- invoices;
- maintenance;
- facilities;
- assets;
- staff;
- vehicles;
- access control;
- reservations;
- helpdesk;
- procurement;
- inventory.

Domain boundaries should remain explicit.

---

## 5. Backend Architecture

The backend uses NestJS and organizes functionality into modules, services,
controllers, repositories, contracts and integration tests.

Developers should preserve:

- dependency boundaries;
- DTO validation;
- authorization;
- repository abstraction;
- event contracts;
- auditable operations;
- explicit failure behaviour.

Internal service availability does not make a service a public API.

---

## 6. Frontend Architecture

The frontend uses Next.js.

Frontend work should preserve:

- route authorization;
- API contracts;
- role-specific experience;
- validation feedback;
- loading and error states;
- accessibility;
- responsive behaviour;
- protected Core controls.

Themes may alter presentation but not protected behaviour.

---

## 7. API-First Boundary

Public integration should occur through governed interfaces.

These may include:

- REST endpoints;
- SDK contracts;
- events;
- webhooks;
- extension contracts;
- provider contracts.

Direct access to internal tables or private services is not a stable integration
contract.

---

## 8. Event-Driven Boundary

Events coordinate decoupled platform behaviour.

Event publishers and consumers should preserve:

- event identity;
- version assumptions;
- payload contracts;
- correlation;
- retry safety;
- idempotency expectations;
- auditability.

Events should not become hidden substitutes for authorization.

---

## 9. Plugin Architecture

Plugins extend platform capabilities through governed lifecycle controls.

The plugin architecture includes concepts such as:

- package validation;
- manifest validation;
- installation;
- extraction safety;
- dependencies;
- migrations;
- activation;
- deactivation;
- upgrade;
- rollback;
- publisher trust;
- publication governance;
- runtime containment.

See `plugin-development.md`.

---

## 10. Theme Architecture

Themes control approved presentation surfaces.

Theme architecture includes:

- registry;
- packages;
- manifests;
- layouts;
- design tokens;
- assets;
- activation;
- fallback;
- compatibility;
- presentation boundaries.

Themes must not redefine business authority.

See `theme-development.md`.

---

## 11. AI Architecture

The AI platform includes:

- provider contracts;
- provider registration;
- provider selection;
- routing;
- failover;
- agents;
- specialists;
- capabilities;
- planning;
- collaboration;
- tools;
- approval boundaries;
- audit evidence;
- controlled autonomy;
- memory;
- learning;
- safety.

See `ai-development.md`.

---

## 12. Provider-Agnostic AI

AI providers are integrated through governed contracts.

Provider-specific implementations must not cause unrelated platform domains to
depend permanently on one vendor.

Routing, compatibility, credentials, failover and activation remain explicit.

---

## 13. Authorization

Authorization applies across:

- API requests;
- service operations;
- event-triggered actions;
- plugin actions;
- AI tool execution;
- administrative operations;
- consequential actions.

A developer must not infer permission from technical reachability.

---

## 14. Multi-Property and Tenant Scope

PropertyOS operations may be scoped by:

- authenticated actor;
- organization;
- property;
- tenant;
- role;
- permission;
- operational context.

Cross-scope access must be explicit and authorized.

---

## 15. Data Architecture

Persistent data is governed through:

- schema migrations;
- repositories;
- transaction boundaries;
- constraints;
- audit records;
- controlled operational access.

Extensions must not modify unrelated Core schema or data.

---

## 16. Migration Architecture

Migrations are ordered, immutable historical artifacts.

Migration governance should preserve:

- deterministic order;
- checksums where applicable;
- preconditions;
- backup requirements;
- controlled execution;
- evidence;
- recovery limitations.

A migration file must not be silently rewritten after controlled use.

---

## 17. Operational Architecture

Operational readiness includes:

- health checks;
- readiness;
- metrics;
- logs;
- persistence;
- deployment controls;
- backup;
- restore;
- migration safety;
- incident handling.

Operational capability is part of product quality.

---

## 18. Security Architecture

Security includes:

- authentication;
- authorization;
- secrets;
- supply chain;
- package integrity;
- extension trust;
- data isolation;
- auditability;
- deployment safety;
- AI controls.

Review `../../SECURITY.md`.

---

## 19. Architecture Decisions

Architecture decisions may be documented through:

- formal architecture documents;
- ADRs;
- contracts;
- governance decisions;
- certification records.

A local implementation shortcut must not silently redefine architecture.

---

## 20. Compatibility

Compatibility must be considered across:

- Core versions;
- APIs;
- events;
- SDKs;
- plugins;
- themes;
- AI providers;
- database migrations;
- deployment environments.

Compatibility claims should be evidence-based.

---

## 21. Certification

Architecture is validated through implementation evidence and release
certification.

Relevant certification documents are under `../release/`.

Certification applies to a defined version and scope.

---

## 22. Canonical References

Key references include:

- `../../architecture/001-Domain-Model.md`
- `../../architecture/002-System-Architecture.md`
- `../../architecture/003-Backend-Domain-Model.md`
- `../../architecture/008-Visitor-Plugin-API-Contracts.md`
- `../generated/modules/`
- `../release/`
- `../../GOVERNANCE.md`
- `../../RELEASE_GOVERNANCE.md`

---

## 23. Product-Freeze Boundary

This guide documents existing architecture.

It does not authorize:

- new modules;
- new APIs;
- new migrations;
- extension-runtime changes;
- AI-runtime changes;
- frontend routes;
- infrastructure changes.

Architecture changes require explicit governance and technical authorization.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
