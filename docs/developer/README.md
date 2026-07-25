# PropertyOS Developer Documentation

Welcome to the PropertyOS developer documentation.

PropertyOS is the open-source, AI-native operating system for properties,
workspaces and hospitality.

The current certified product release is `v1.0.1`.

---

## Start Here

| Goal | Guide |
|---|---|
| Set up the repository | `getting-started.md` |
| Understand the architecture | `architecture.md` |
| Build a plugin | `plugin-development.md` |
| Build a theme | `theme-development.md` |
| Build an AI integration | `ai-development.md` |
| Understand APIs and events | `api-reference.md` |
| Contribute to Core | `../../CONTRIBUTING.md` |

---

## Important Boundary

The product is currently frozen while Repository Foundation is completed.

These guides document and organize existing capabilities.

They do not authorize:

- new Core features;
- API changes;
- SDK changes;
- migrations;
- runtime changes;
- marketplace activation;
- autonomous-authority expansion.

---

## Canonical Documentation

Use the following as authoritative references:

- `../../README.md`
- `../../architecture/`
- `../../sdk/`
- `../generated/modules/`
- `../release/`
- `../../GOVERNANCE.md`
- `../../RELEASE_GOVERNANCE.md`

---

## Development Areas

### Core Platform

Core platform development includes backend, frontend, infrastructure,
configuration, security, events, workflows and operational systems.

Core contributions require explicit authorization under the current product
freeze.

### Plugins

Plugins extend governed platform capabilities.

Begin with:

- `plugin-development.md`
- `../../sdk/001-Plugin-SDK.md`
- `../../PLUGIN_MARKETPLACE_GOVERNANCE.md`

### Themes

Themes customize presentation without changing protected Core behaviour.

Begin with:

- `theme-development.md`
- `../../THEME_MARKETPLACE_GOVERNANCE.md`

### AI

AI development includes providers, agents, specialists, tools, prompts and
controlled orchestration.

Begin with:

- `ai-development.md`
- `../../AI_ECOSYSTEM_GOVERNANCE.md`
- `../PHASE_16E1B_AI_SDK_BOUNDARY.md`

### APIs and Events

API and event consumers must preserve authentication, authorization, scope,
compatibility and audit requirements.

Begin with:

- `api-reference.md`
- `architecture.md`

---

## Documentation Contributions

Documentation improvements are welcome when they:

- clarify existing behaviour;
- correct broken references;
- improve examples;
- document certified contracts;
- preserve product-freeze boundaries.

Documentation must not describe proposed behaviour as already implemented.

---

## Security

Do not publish vulnerability details in documentation pull requests or public
issues.

Follow `../../SECURITY.md`.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
