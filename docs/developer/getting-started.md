# Getting Started with PropertyOS Development

This guide helps contributors understand and verify a PropertyOS development
environment.

The current certified release is `v1.0.1`.

Repository Foundation is operating under product freeze, so this guide
documents existing workflows and does not authorize product changes.

---

## 1. Prerequisites

A development environment may require:

- Git;
- Node.js;
- npm;
- PostgreSQL;
- Docker;
- Docker Compose;
- a POSIX-compatible shell;
- sufficient local disk space;
- access to required environment configuration.

Use the versions declared by the repository and its lockfiles.

Do not upgrade dependencies merely because newer versions exist.

---

## 2. Repository Location

The repository may be cloned into any appropriate development directory.

The established local repository used during certification is:

`/Users/anandnataraj/aiutilities/PropertyOS/propertyos-core`

Developer documentation must not assume that every contributor uses this exact
path.

---

## 3. Clone and Inspect

After cloning:

1. confirm the expected branch;
2. inspect the current commit;
3. confirm the working tree is clean;
4. read `README.md`;
5. read `CONTRIBUTING.md`;
6. review applicable governance;
7. inspect package manifests and lockfiles.

Useful commands include:

- `git branch --show-current`
- `git rev-parse HEAD`
- `git status --short`
- `git log --oneline -10`

---

## 4. Product-Freeze Check

Before making any change, determine whether the work is authorized.

During Repository Foundation, permitted work is limited to approved repository
maturity, governance, documentation and release-readiness tasks.

Do not modify:

- backend product behaviour;
- frontend product behaviour;
- database schemas;
- migrations;
- public APIs;
- plugin runtime;
- theme runtime;
- AI runtime;
- operational authorization boundaries;

unless the task explicitly authorizes the modification.

---

## 5. Repository Areas

| Path | Purpose |
|---|---|
| `backend/` | NestJS backend services and platform modules |
| `frontend/` | Next.js frontend applications |
| `architecture/` | Architecture and contract documentation |
| `sdk/` | SDK documentation and design |
| `docs/` | Product, generated and release documentation |
| `documentation/` | Operational and phase documentation |
| `plugins/` | Plugin resources |
| `themes/` | Theme resources |
| `ai/` | AI ecosystem resources |
| `infrastructure/` | Infrastructure and deployment |
| `operations/` | Operational controls and documentation |
| `.github/` | GitHub workflows and contributor experience |

Do not infer ownership solely from directory names. Review `MAINTAINERS.md`.

---

## 6. Backend Setup

Backend setup should follow the scripts and package configuration in
`backend/package.json`.

Typical preparation includes:

- installing locked dependencies;
- configuring environment variables;
- confirming database access;
- applying only authorized migrations;
- building the backend;
- running relevant tests.

Use the lockfile and repository scripts rather than manually assembling
dependency commands.

---

## 7. Frontend Setup

Frontend setup should follow `frontend/package.json`.

Typical preparation includes:

- installing locked dependencies;
- configuring the backend API location;
- confirming environment variables;
- running the development server;
- validating the production build where authorized.

Do not add routes or user-facing behaviour during documentation-only phases.

---

## 8. Environment Files

Environment files may contain:

- database connection details;
- provider configuration;
- credentials;
- API locations;
- deployment settings;
- feature configuration.

Never commit secrets.

Use documented example files as templates and keep actual secrets outside
source control.

---

## 9. Database Safety

Database work must follow migration and operational governance.

Before any authorized migration:

- confirm the target environment;
- confirm backup requirements;
- confirm migration order;
- confirm expected source state;
- confirm authorization;
- preserve evidence;
- verify post-migration state.

Documentation work must not touch the database.

---

## 10. Development Servers

Developers may run backend and frontend services separately.

Before starting another process:

- check whether a server is already running;
- avoid changing ports without reason;
- avoid interrupting another active workflow;
- preserve logs needed for diagnosis.

The development server is not release evidence by itself.

---

## 11. Build Validation

Build validation should use repository scripts.

A build confirms compilation and packaging expectations.

A successful build does not prove:

- complete correctness;
- migration safety;
- security;
- release readiness;
- authorization.

Use the relevant certification and release process for those conclusions.

---

## 12. Test Strategy

PropertyOS uses multiple validation layers, including:

- unit tests;
- integration tests;
- contract tests;
- migration tests;
- regression tests;
- build validation;
- operational exercises;
- release certification.

Run the smallest relevant test scope while developing.

Run the required consolidated scope before an authorized checkpoint.

---

## 13. Changed-File Discipline

Before committing:

- inspect `git status`;
- list changed files;
- confirm every changed file belongs to the approved scope;
- run `git diff --check`;
- inspect the staged diff;
- confirm no generated or secret files were added accidentally.

Repository Foundation phases must keep product source unchanged unless
explicitly authorized.

---

## 14. Commit Discipline

Commits should be:

- scoped;
- reviewable;
- attributable;
- validated;
- free of unrelated changes;
- consistent with repository conventions.

Do not combine documentation governance and product implementation in one
commit.

---

## 15. Existing CI

The existing product CI remains the canonical automated product-validation
workflow.

Repository-governance automation supplements it.

Documentation work must not silently replace, weaken or bypass product CI.

---

## 16. Security

Do not include:

- credentials;
- access tokens;
- private keys;
- customer data;
- private infrastructure details;
- vulnerability details;

in public commits or documentation.

Follow `SECURITY.md`.

---

## 17. Contribution Workflow

Before contributing:

1. read `CONTRIBUTING.md`;
2. identify the relevant maintainer;
3. confirm the work is authorized;
4. keep changes narrowly scoped;
5. add or update evidence where required;
6. use the pull-request template;
7. respond to review.

A proposed contribution is not automatically accepted.

---

## 18. Recommended Reading

Start with:

- `../../README.md`
- `../../CONTRIBUTING.md`
- `../../GOVERNANCE.md`
- `../../MAINTAINERS.md`
- `../../SECURITY.md`
- `architecture.md`
- the guide for the relevant extension type.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
