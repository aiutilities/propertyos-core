# Contributing to PropertyOS

Thank you for your interest in contributing to PropertyOS.

PropertyOS is the Open Source AI-Native Operating System for Properties, Workspaces and Hospitality.

The project is created, maintained and stewarded by Cogzidel Technologies Pvt. Ltd. and governed by the PropertyOS Constitution.

---

## 1. Start Here

Before contributing, please read:

- `docs/00_PROPERTYOS_CONSTITUTION.md`
- `docs/01_PROPERTYOS_MANIFESTO.md`
- `README.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md` when available
- `TRADEMARKS.md`
- `adrs/README.md`
- `docs/development/REPOSITORY_GUIDE.md`

Contributions that conflict with the Constitution, architectural boundaries or release discipline may be declined even when technically valid.

---

## 2. Ways to Contribute

You can contribute through:

- bug reports
- documentation improvements
- test coverage
- accessibility improvements
- performance improvements
- security reports
- plugins
- themes
- integrations
- architecture proposals
- operational runbooks
- translations
- community support
- issue triage

Major product features should not begin without prior discussion.

---

## 3. Before Opening an Issue

Search existing issues and discussions first.

When reporting a bug, include:

- PropertyOS version
- environment
- operating system
- deployment method
- relevant module
- expected behaviour
- actual behaviour
- reproduction steps
- logs with secrets removed
- screenshots when useful
- whether the issue is reproducible

Do not disclose security vulnerabilities in public issues.

---

## 4. Before Starting Major Work

Open an issue before working on:

- new core modules
- architecture changes
- API changes
- database migrations
- permission changes
- plugin lifecycle changes
- AI runtime changes
- breaking changes
- large refactors
- new external dependencies
- release-process changes

The issue should explain:

- the problem
- the proposed solution
- alternatives considered
- architectural impact
- security impact
- compatibility impact
- migration impact
- testing strategy
- documentation impact

Approval to discuss an idea is not a guarantee that a pull request will be accepted.

---

## 5. Core Versus Plugin Boundary

PropertyOS follows a stable-core, innovative-edges model.

Before proposing a core feature, consider whether it belongs in:

- a plugin
- a theme
- a workflow
- a configuration package
- an integration
- an AI specialist
- an external service

Core additions require a clear platform-wide justification.

Vertical-specific behaviour should generally remain outside the stable core.

---

## 6. Development Principles

Contributions should preserve:

- modular boundaries
- API-first behaviour
- event-driven collaboration
- deterministic business controls
- permission enforcement
- auditability
- operational observability
- safe failure behaviour
- backward compatibility whenever practical
- provider independence for AI capabilities
- self-hosted availability

Business logic must not be hidden in the UI.

AI-triggered actions must respect the same policies as human-triggered actions.

---

## 7. Repository Setup

Review the repository guides before development:

- `backend/README.md`
- `frontend/README.md`
- `architecture/README.md`
- `docs/development/REPOSITORY_GUIDE.md`
- `docs/STANDARDS.md`

Use the documented Node.js, package-manager, PostgreSQL and Docker requirements.

Do not commit:

- credentials
- `.env` files
- private keys
- generated secrets
- customer data
- production exports
- personal data
- proprietary third-party material

---

## 8. Branches

Use a focused branch name.

Recommended patterns:

- `fix/short-description`
- `feature/short-description`
- `docs/short-description`
- `security/short-description`
- `plugin/short-description`
- `theme/short-description`

Keep branches limited to one coherent change.

Avoid mixing formatting, refactoring and feature work without a clear reason.

---

## 9. Commit Messages

Use concise, imperative commit messages.

Examples:

- `fix: prevent duplicate reservation allocation`
- `docs: clarify plugin installation workflow`
- `test: cover failed lease transition`
- `plugin: add visitor access integration`
- `security: harden package signature validation`

Foundation and governance commits may use:

- `foundation: ...`

Release commits may use:

- `release: ...`

Do not use vague messages such as:

- `changes`
- `updates`
- `fix stuff`
- `final`

---

## 10. Coding Standards

Contributions should:

- follow existing project structure
- use clear names
- preserve type safety
- avoid unnecessary abstraction
- avoid hidden side effects
- handle errors explicitly
- enforce authorization
- validate external input
- include audit events where required
- use repository and service boundaries consistently
- avoid direct coupling between unrelated modules

Do not introduce a new framework, library or architectural pattern without justification.

---

## 11. Tests

Every behavioural change should include appropriate tests.

Depending on scope, this may include:

- unit tests
- integration tests
- API tests
- repository tests
- workflow tests
- permission tests
- migration tests
- regression tests
- frontend type validation
- production builds
- Docker validation

A pull request is not complete merely because it compiles.

Tests must demonstrate the intended behaviour and important failure cases.

---

## 12. Database Migrations

Database migrations require special care.

Migrations must be:

- ordered correctly
- idempotent where required by the project pattern
- reversible when practical
- reviewed for production impact
- safe for existing data
- covered by tests
- included in migration preflight
- documented when operational action is required

Never edit an already-published migration merely to simplify new work.

Add a new migration instead.

---

## 13. APIs and Compatibility

Public APIs should remain backward compatible whenever practical.

API changes must consider:

- versioning
- validation
- authorization
- response contracts
- error contracts
- pagination
- auditability
- documentation
- SDK impact
- plugin impact

Breaking changes require explicit governance and migration guidance.

---

## 14. Plugins and Themes

Plugins should use documented extension points.

Plugins must not rely on undocumented internal implementation details.

Themes must not contain business logic.

Plugin and theme names must comply with `TRADEMARKS.md`.

Independent extensions must not imply official endorsement without written authorization.

---

## 15. AI Contributions

AI runtime contributions must preserve:

- provider abstraction
- permission enforcement
- deterministic operational controls
- confidence and evidence handling
- human accountability
- safe failure behaviour
- auditability
- privacy
- prompt and model governance

AI output must not silently bypass workflows, approvals or security policies.

---

## 16. Documentation

Documentation is required for:

- public APIs
- new modules
- new extension points
- migrations requiring operator action
- configuration changes
- deployment changes
- security-sensitive behaviour
- user-facing workflows
- architectural decisions

Documentation should explain both how and why.

Generated documentation must not replace authoritative conceptual documentation.

---

## 17. Pull Requests

A pull request should include:

- clear title
- problem statement
- solution summary
- files or modules affected
- test evidence
- compatibility impact
- migration impact
- security impact
- screenshots for UI changes
- documentation changes
- related issues

Keep pull requests reviewable.

Large changes may be requested as a sequence of smaller pull requests.

---

## 18. Review Expectations

Maintainers may review for:

- constitutional alignment
- architectural integrity
- correctness
- security
- maintainability
- backward compatibility
- tests
- documentation
- operational readiness
- plugin ecosystem impact
- long-term stewardship

Feedback should be treated as part of collaborative engineering, not as personal criticism.

---

## 19. Licensing of Contributions

By submitting a contribution, you agree that your contribution is licensed under the Mozilla Public License 2.0 unless a clearly identified component uses another approved license.

You confirm that:

- you have the right to submit the contribution
- the contribution does not knowingly violate third-party rights
- required attribution is included
- proprietary code has not been copied without permission

A Contributor License Agreement may be introduced later if project governance requires it.

---

## 20. Attribution and Copyright

Copyright in accepted contributions remains with the respective contributor unless separately assigned.

The combined PropertyOS work is stewarded by Cogzidel Technologies Pvt. Ltd.

Do not remove existing copyright, license or attribution notices.

---

## 21. Security

Do not report vulnerabilities publicly.

Use the private security-reporting process described in `SECURITY.md` once published.

Until then, contact the project steward privately and avoid sharing exploit details in public channels.

---

## 22. Community Conduct

All contributors must follow `CODE_OF_CONDUCT.md`.

Respectful disagreement is welcome.

Harassment, discrimination, intimidation, impersonation and bad-faith disruption are not accepted.

---

## 23. Maintainer Discretion

Maintainers may close, defer or decline contributions that:

- conflict with the Constitution
- weaken security
- create unnecessary core complexity
- duplicate existing capabilities
- belong in a plugin
- lack adequate tests
- lack required documentation
- introduce unacceptable maintenance burden
- undermine compatibility
- create legal or trademark risk

Where practical, maintainers should explain the reason.

---

## 24. Recognition

PropertyOS aims to recognise meaningful contributions through:

- Git history
- release notes
- contributor listings
- maintainer appointments
- community acknowledgements

Recognition follows contribution and responsibility.

---

## 25. Questions

Use GitHub Discussions or an appropriate issue for public contribution questions once those channels are enabled.

Do not place confidential, security-sensitive or personal information in public discussions.

Thank you for helping build infrastructure for the physical world.
