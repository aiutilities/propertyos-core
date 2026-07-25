# PropertyOS API and Event Reference Guide

This guide explains how developers should approach PropertyOS APIs, events and
integration contracts.

It is an orientation guide, not a complete endpoint catalogue.

Canonical implementation and generated references remain authoritative.

---

## 1. API Principles

PropertyOS APIs should remain:

- authenticated;
- authorized;
- scoped;
- validated;
- version-aware;
- auditable;
- predictable;
- explicit about failure;
- explicit about consequential actions.

Technical reachability does not imply permission.

---

## 2. Product-Freeze Boundary

During Repository Foundation:

- no API endpoint may be added;
- no endpoint behaviour may change;
- no DTO contract may change;
- no event contract may change;
- no webhook behaviour may change;
- no database access contract may change.

This guide documents existing integration boundaries only.

---

## 3. Canonical Sources

Developers should consult:

- backend controllers;
- backend DTOs;
- public contracts;
- SDK contracts;
- generated module documentation;
- architecture documentation;
- release certification.

Useful repository areas include:

- `../../backend/src/`
- `../../architecture/`
- `../../sdk/`
- `../generated/modules/`
- `../release/`

---

## 4. API Base Behaviour

PropertyOS APIs typically use:

- HTTP;
- JSON;
- authenticated requests;
- DTO validation;
- consistent error handling;
- role and permission enforcement;
- property or tenant scope;
- audit logging where applicable.

Consumers must handle failures explicitly.

---

## 5. Authentication

Authentication identifies the calling actor.

Clients must:

- use approved authentication mechanisms;
- protect tokens;
- avoid logging secrets;
- handle expiry;
- handle revocation;
- avoid sharing credentials;
- use secure transport.

Authentication does not itself grant permission.

---

## 6. Authorization

Authorization determines whether an actor may perform an operation.

Authorization may consider:

- actor;
- role;
- permission;
- property;
- tenant;
- organization;
- resource ownership;
- operation;
- workflow state;
- approval state.

Clients must not attempt to bypass server-side authorization.

---

## 7. Scope

Requests may be scoped by:

- property;
- tenant;
- organization;
- actor;
- role;
- operational context.

Cross-scope access must be explicit and authorized.

Clients must not assume identifiers from one scope are valid in another.

---

## 8. Request Validation

Requests should comply with DTO and contract rules.

Validation may apply to:

- required fields;
- data types;
- formats;
- enumerations;
- ranges;
- identifiers;
- nested structures;
- business preconditions.

Client-side validation does not replace server validation.

---

## 9. Response Handling

Clients should handle:

- success;
- validation errors;
- authentication errors;
- authorization errors;
- missing resources;
- conflicts;
- rate or operational limits;
- server errors;
- partial or asynchronous outcomes where applicable.

Do not infer success from an HTTP connection alone.

---

## 10. Error Behaviour

Errors should be treated as governed outcomes.

Clients should preserve:

- status;
- error code where available;
- message;
- correlation identifier;
- retry eligibility;
- partial state;
- user-facing explanation.

Do not automatically retry non-idempotent operations.

---

## 11. Idempotency

Idempotency matters for operations such as:

- payments;
- notifications;
- workflow actions;
- external integrations;
- scheduled operations;
- event consumers.

Clients should use documented idempotency controls where available.

Repeated requests must not be assumed safe.

---

## 12. Pagination

List APIs may use pagination.

Clients should:

- follow documented pagination fields;
- avoid assuming complete results from one response;
- preserve sorting and filters;
- handle empty pages;
- handle changing data sets.

Pagination behaviour is part of the contract.

---

## 13. Filtering and Search

Filtering and search should use documented fields and syntax.

Clients must not rely on undocumented database column names or internal query
behaviour.

Search results may differ by permission and scope.

---

## 14. Versioning

API consumers should track:

- PropertyOS version;
- endpoint contract;
- SDK version;
- compatibility range;
- deprecations;
- migration requirements.

Internal implementation changes are not automatically public API changes.

---

## 15. Deprecation

Deprecated APIs should identify:

- affected contract;
- replacement;
- announcement;
- migration guidance;
- earliest removal version.

Consumers should migrate before removal.

Deprecated does not mean immediately unavailable.

---

## 16. Consequential Actions

Consequential API operations may involve:

- payments;
- approvals;
- access control;
- external communication;
- migrations;
- security changes;
- extension activation;
- AI tool execution.

These operations may require stronger authorization or approval.

A successful request does not waive governance requirements.

---

## 17. Events

PropertyOS uses events for decoupled coordination.

Event contracts should preserve:

- event name;
- version assumptions;
- payload;
- source;
- timestamp;
- correlation identifier;
- actor context where appropriate;
- scope.

Consumers should validate event payloads.

---

## 18. Event Delivery

Event consumers should account for:

- retries;
- duplicate delivery;
- delayed delivery;
- out-of-order delivery where applicable;
- consumer failure;
- dead-letter handling where applicable;
- idempotency.

An event should not be treated as proof that downstream work succeeded.

---

## 19. Event Security

Events must not bypass:

- authentication;
- authorization;
- property scope;
- tenant scope;
- approval;
- audit requirements.

Event-triggered work must preserve actor and correlation context where required.

---

## 20. Webhooks

Webhook integrations should use:

- secure transport;
- signature validation where supported;
- replay protection;
- timestamp validation;
- idempotency;
- controlled retries;
- secret rotation;
- audit logging.

Webhook secrets must remain outside source control.

---

## 21. External Integrations

External integration design should consider:

- authentication;
- authorization;
- data minimization;
- rate limits;
- retries;
- timeouts;
- failure recovery;
- reconciliation;
- audit evidence;
- provider outages.

External availability must not be assumed.

---

## 22. SDKs

SDKs may simplify access to governed APIs.

SDK usage must preserve:

- authentication;
- authorization;
- validation;
- scope;
- compatibility;
- error handling;
- approval boundaries.

An SDK does not grant authority beyond the authenticated actor.

---

## 23. Generated Documentation

Generated module documentation is available under:

`../generated/modules/`

Generated documentation should be interpreted alongside:

- source contracts;
- architecture;
- release certification;
- governance;
- current version.

Generated output may describe internal capabilities that are not public APIs.

---

## 24. Testing Integrations

Integration testing may include:

- authentication;
- authorization;
- validation;
- happy paths;
- failure paths;
- idempotency;
- retries;
- timeouts;
- event duplication;
- webhook signatures;
- scope isolation;
- consequential-action approval.

Test credentials must not be production credentials.

---

## 25. Security

Do not expose:

- credentials;
- tokens;
- private keys;
- customer data;
- private infrastructure;
- vulnerability details;
- unauthorized identifiers.

Security issues must follow `../../SECURITY.md`.

---

## 26. Compatibility

Before integrating, confirm:

- current stable release;
- endpoint availability;
- SDK compatibility;
- event contracts;
- required permissions;
- deployment assumptions;
- deprecations.

Compatibility should be verified, not assumed.

---

## 27. Support

Use `../../SUPPORT.md` for support routing.

Public support channels must not receive:

- credentials;
- customer data;
- private logs;
- security vulnerabilities;
- confidential configuration.

---

## 28. Contribution

API, DTO, event or webhook changes require explicit authorization.

Documentation improvements should link to existing contracts rather than invent
new ones.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
