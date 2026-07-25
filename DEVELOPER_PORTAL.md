# PropertyOS Developer Portal

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Project | PropertyOS |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Product release | `v1.0.1` |
| Documentation entry point | `docs/developer/README.md` |
| Contribution policy | `CONTRIBUTING.md` |
| Governance authority | `GOVERNANCE.md` |

---

## 1. Purpose

The PropertyOS Developer Portal is the official entry point for developers who
want to understand, operate, integrate with or extend PropertyOS.

It organizes existing canonical documentation for:

- platform architecture;
- local development;
- APIs;
- events;
- plugins;
- themes;
- AI providers;
- AI specialists;
- AI tools;
- testing;
- contribution;
- release governance.

The Developer Portal does not replace the underlying technical specifications.

It provides a stable navigation layer over the repository's existing
documentation.

---

## 2. Product Status

PropertyOS Core is complete and certified.

The current certified release is `v1.0.1`.

Developer documentation must distinguish between:

- implemented and certified capabilities;
- repository-governance work;
- future ecosystem work;
- proposed features;
- experimental integrations.

Documentation must not represent roadmap items as released functionality.

---

## 3. Product-Freeze Boundary

Repository Foundation remains under product freeze.

During this phase:

- no product features are added;
- no SDK behaviour is changed;
- no API behaviour is changed;
- no database migration is introduced;
- no frontend route is introduced;
- no plugin runtime behaviour is changed;
- no theme runtime behaviour is changed;
- no AI runtime behaviour is changed.

A2.17 organizes and publishes documentation only.

---

## 4. Developer Audiences

The portal supports:

- Core contributors;
- plugin developers;
- theme developers;
- AI provider developers;
- AI specialist developers;
- integration developers;
- deployment engineers;
- documentation contributors;
- security researchers;
- solution architects.

Each audience should begin with the documentation path most relevant to its
work.

---

## 5. Documentation Map

| Area | Entry point |
|---|---|
| Developer overview | `docs/developer/README.md` |
| Getting started | `docs/developer/getting-started.md` |
| Architecture | `docs/developer/architecture.md` |
| Plugin development | `docs/developer/plugin-development.md` |
| Theme development | `docs/developer/theme-development.md` |
| AI development | `docs/developer/ai-development.md` |
| API reference | `docs/developer/api-reference.md` |
| Contribution workflow | `CONTRIBUTING.md` |
| Project governance | `GOVERNANCE.md` |
| Release governance | `RELEASE_GOVERNANCE.md` |
| Security reporting | `SECURITY.md` |
| Support | `SUPPORT.md` |

---

## 6. Canonical Sources

Developer Portal documents are navigation and orientation documents.

Canonical technical sources remain:

- source code;
- public contracts;
- SDK contracts;
- architecture documents;
- generated module documentation;
- release certification;
- migration history;
- governance policies.

Where a portal guide conflicts with an implemented contract, the implemented
and certified contract remains authoritative until documentation is corrected.

---

## 7. Repository Structure

Major developer-facing repository areas include:

| Path | Purpose |
|---|---|
| `backend/` | NestJS backend and platform services |
| `frontend/` | Next.js frontend applications |
| `sdk/` | SDK design and usage documentation |
| `plugins/` | Plugin packages and plugin resources |
| `themes/` | Theme packages and theme resources |
| `ai/` | AI architecture and ecosystem resources |
| `architecture/` | Platform architecture documents |
| `docs/` | Product, module and release documentation |
| `documentation/` | Operational and phase-specific documentation |
| `infrastructure/` | Deployment and infrastructure resources |
| `operations/` | Operational documentation and controls |
| `tests/` | Cross-platform and acceptance tests |

Developers should verify the current repository structure before relying on
older phase-specific documentation.

---

## 8. Architecture Principles

PropertyOS is:

- plugin-first;
- API-first;
- event-driven;
- AI-native;
- provider-agnostic;
- constitution-driven;
- self-hostable;
- auditable.

Extensions must preserve these principles.

---

## 9. Extension Model

PropertyOS supports three principal extension categories:

1. Plugins
2. Themes
3. AI ecosystem components

Each category has separate governance, compatibility and certification
requirements.

### Plugins

Plugins extend platform capabilities and business behaviour through governed
contracts.

See:

- `sdk/001-Plugin-SDK.md`
- `sdk/001-Plugin-SDK-Design.md`
- `PLUGIN_MARKETPLACE_GOVERNANCE.md`

### Themes

Themes customize presentation while preserving protected Core behaviour.

See:

- `THEME_MARKETPLACE_GOVERNANCE.md`
- `docs/generated/modules/theme.md`
- `docs/release/PLATFORM_PLUGIN_THEME_CERTIFICATION.md`

### AI ecosystem components

AI components may include providers, specialists, agents, capabilities, tools
and prompts.

See:

- `AI_ECOSYSTEM_GOVERNANCE.md`
- `docs/PHASE_16E1B_AI_SDK_BOUNDARY.md`
- `docs/generated/modules/ai.md`
- `docs/release/PLATFORM_AI_RUNTIME_CERTIFICATION.md`

---

## 10. API Model

PropertyOS APIs are governed by:

- authentication;
- authorization;
- tenant and property scope;
- DTO validation;
- versioned contracts;
- auditability;
- consistent response handling;
- explicit consequential-action boundaries.

Developers must not rely on undocumented internal implementation details as
stable public APIs.

---

## 11. Event Model

PropertyOS uses event-driven integration for platform coordination.

Developers should:

- use documented event contracts;
- preserve event identity;
- preserve correlation information;
- avoid hidden synchronous coupling;
- design consumers for retries;
- account for duplicate delivery where applicable;
- preserve audit evidence.

Event contracts must not be changed casually.

---

## 12. SDK Model

SDKs expose governed developer boundaries.

SDK usage must preserve:

- compatibility;
- authorization;
- validation;
- lifecycle rules;
- version policy;
- error contracts;
- audit requirements;
- product-freeze restrictions.

An SDK makes a capability accessible. It does not grant operational authority.

---

## 13. Documentation Standards

Developer documentation should:

- describe actual behaviour;
- identify version scope;
- link to canonical contracts;
- include prerequisites;
- identify permissions;
- identify risks;
- identify compatibility;
- distinguish examples from guarantees;
- avoid exposing secrets;
- remain reviewable.

Examples must not imply that authorization or approval can be bypassed.

---

## 14. Contribution Entry Point

Contributors must begin with:

- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`;
- `GOVERNANCE.md`;
- `SECURITY.md`;
- the relevant developer guide.

A contribution proposal does not authorize product work during Repository
Foundation.

---

## 15. Security Reporting

Security vulnerabilities must not be submitted through public issues,
discussions or marketplace reviews.

Use the private reporting process defined in `SECURITY.md`.

---

## 16. Release Alignment

Developer documentation must align with:

- `CHANGELOG.md`;
- `ROADMAP.md`;
- `RELEASE_GOVERNANCE.md`;
- release manifests;
- certification records;
- the current stable tag.

Documentation for unreleased behaviour must be clearly marked as proposed or
future work.

---

## 17. Portal Maintenance

The Developer Portal is maintained by:

- Documentation Maintainers;
- relevant Module Owners;
- SDK Maintainers;
- Plugin Maintainers;
- Theme Maintainers;
- AI Maintainers;
- Release Maintainers.

Maintainer assignments are governed by `MAINTAINERS.md`.

---

## 18. Related Documents

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `SECURITY.md`
- `SUPPORT.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `RELEASE_GOVERNANCE.md`
- `PLUGIN_MARKETPLACE_GOVERNANCE.md`
- `THEME_MARKETPLACE_GOVERNANCE.md`
- `AI_ECOSYSTEM_GOVERNANCE.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
