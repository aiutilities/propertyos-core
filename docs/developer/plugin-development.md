# PropertyOS Plugin Development Guide

This guide provides a developer-oriented overview of the existing PropertyOS
plugin platform.

Canonical plugin contracts and implementation remain authoritative.

---

## 1. Plugin Model

Plugins extend PropertyOS through governed platform contracts.

A plugin may provide:

- domain capabilities;
- workflows;
- schedulers;
- notifications;
- search providers;
- documents;
- forms;
- dashboards;
- events;
- configuration;
- integrations.

Plugins must not bypass Core authorization, audit or lifecycle controls.

---

## 2. Product-Freeze Boundary

During Repository Foundation:

- no new plugin runtime behaviour is authorized;
- no plugin API change is authorized;
- no plugin database migration is authorized;
- no marketplace activation is authorized;
- no installer behaviour may be changed.

This guide documents existing capabilities only.

---

## 3. Canonical References

Begin with:

- `../../sdk/001-Plugin-SDK.md`
- `../../sdk/001-Plugin-SDK-Design.md`
- `../../PLUGIN_MARKETPLACE_GOVERNANCE.md`
- `../../SECURITY.md`
- `../../RELEASE_GOVERNANCE.md`
- `../release/PLATFORM_PLUGIN_THEME_CERTIFICATION.md`

---

## 4. Plugin Identity

A plugin should have a stable identifier.

The identity should be:

- unique;
- attributable;
- versioned;
- non-deceptive;
- compatible with registry rules.

A plugin must not impersonate PropertyOS Core or another publisher.

---

## 5. Manifest

The plugin manifest describes package behaviour.

It may include:

- identifier;
- name;
- version;
- publisher;
- entry point;
- compatibility;
- dependencies;
- permissions;
- capabilities;
- migrations;
- licence;
- integrity metadata.

Manifest declarations must reflect actual behaviour.

---

## 6. Package Structure

A plugin package should contain only required files.

Typical package content may include:

- manifest;
- compiled runtime files;
- migrations;
- configuration;
- assets;
- documentation;
- integrity metadata;
- signature metadata.

Packages must not rely on undeclared local files.

---

## 7. Package Safety

Plugin archives are subject to safety controls.

Unsafe package characteristics include:

- path traversal;
- absolute paths;
- symbolic-link escapes;
- hard-link escapes;
- archive bombs;
- hidden executable behaviour;
- protected-path overwrites;
- unsupported file types.

Unsafe packages must be rejected.

---

## 8. Compatibility

A plugin should declare compatibility with:

- PropertyOS Core;
- Plugin SDK;
- required APIs;
- required capabilities;
- dependency versions;
- database features;
- deployment assumptions.

Compatibility claims should be evidence-based.

---

## 9. Dependencies

Plugin dependencies must be explicit.

A dependency declaration should identify:

- dependency identifier;
- version range;
- required or optional status;
- installation order;
- conflicts;
- runtime assumptions.

Circular or unresolved dependencies must fail validation.

---

## 10. Permissions

Plugins must request only required permissions.

Permissions should be:

- minimal;
- explicit;
- understandable;
- enforceable;
- consistent with documented behaviour.

Sensitive permissions may require enhanced review.

---

## 11. Capabilities

Plugins may register approved platform capabilities.

Capabilities must preserve:

- platform contracts;
- authorization;
- validation;
- auditability;
- lifecycle state;
- compatibility.

A plugin must not override protected Core behaviour without explicit authority.

---

## 12. Migrations

Plugin migrations must be:

- declared;
- ordered;
- versioned;
- immutable;
- scoped;
- tested;
- recoverable where practical.

A plugin migration must not alter unrelated Core schema or data.

---

## 13. Installation Lifecycle

The governed lifecycle may include:

1. package admission;
2. integrity validation;
3. signature validation;
4. safe extraction;
5. dependency resolution;
6. migration execution;
7. registration;
8. installation completion;
9. activation.

Installation does not automatically imply activation.

---

## 14. Activation

Activation enables a successfully installed plugin.

Activation should require:

- installed package;
- compatible version;
- valid dependencies;
- successful migrations;
- approved runtime state;
- operator authorization.

Activation must remain auditable.

---

## 15. Deactivation

Deactivation should stop governed plugin runtime behaviour while preserving the
installed package where supported.

Deactivation must not:

- silently delete data;
- bypass audit records;
- leave scheduled work active;
- conceal operational failures.

---

## 16. Upgrade

An upgrade should define:

- current version;
- target version;
- compatibility;
- migrations;
- permissions changes;
- configuration changes;
- dependency changes;
- rollback constraints.

Published plugin versions should remain immutable.

---

## 17. Rollback

Rollback may include:

- restoring a prior package;
- restoring registry state;
- restoring configuration;
- reversing compatible migrations;
- documenting irreversible state.

Rollback limitations must be explicit.

---

## 18. Runtime Containment

Runtime containment is separate from marketplace revocation.

Containment may:

- block activation;
- disable loading;
- stop scheduled work;
- restrict capabilities;
- isolate network access;
- remove authorization.

Containment requires explicit governance authority.

---

## 19. Events

Plugins should use governed event contracts.

Event integrations should preserve:

- event identity;
- version assumptions;
- payload validation;
- correlation;
- retries;
- idempotency;
- audit evidence.

Plugins must not use events to bypass permissions.

---

## 20. APIs

Plugins should rely on stable public contracts.

Avoid direct dependence on:

- private services;
- internal repositories;
- undocumented database tables;
- temporary implementation details;
- generated build output.

Internal accessibility does not make a contract public.

---

## 21. Testing

Plugin testing may include:

- manifest validation;
- package validation;
- dependency tests;
- migration tests;
- installation tests;
- activation tests;
- deactivation tests;
- upgrade tests;
- rollback tests;
- permission tests;
- security tests;
- runtime containment tests.

Test evidence should match declared compatibility.

---

## 22. Documentation

A plugin should document:

- purpose;
- prerequisites;
- installation;
- compatibility;
- permissions;
- dependencies;
- configuration;
- migrations;
- upgrade;
- rollback;
- support;
- known limitations.

Documentation must distinguish released behaviour from future work.

---

## 23. Marketplace Publication

Marketplace publication requires the process defined in
`../../PLUGIN_MARKETPLACE_GOVERNANCE.md`.

Publication may require:

- publisher trust;
- package integrity;
- signing;
- compatibility evidence;
- security review;
- human approval;
- certification.

Publication does not authorize deployment.

---

## 24. Security

Plugins must not:

- embed secrets;
- disable audit controls;
- bypass authentication;
- bypass authorization;
- collect undisclosed data;
- load unsafe remote code;
- conceal permissions;
- modify unrelated Core state.

Security vulnerabilities must follow `../../SECURITY.md`.

---

## 25. Contribution

Plugin SDK or runtime changes require explicit authorization.

Documentation and example improvements should remain narrowly scoped and must
not redefine runtime behaviour.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
