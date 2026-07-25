# PropertyOS Support Policy

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | PropertyOS Core and the official PropertyOS community |
| Authority | PropertyOS Constitution |

---

## 1. Purpose

This policy explains how users, contributors, operators and developers can seek
help with PropertyOS.

It also defines the boundaries between:

- community support;
- issue reporting;
- security reporting;
- project maintenance;
- commercial services.

PropertyOS is an open-source project. Community support is collaborative and
provided on a best-effort basis.

---

## 2. Support Principles

PropertyOS support follows these principles:

1. Public knowledge should be preferred when no sensitive information is involved.
2. Questions should be asked in the most appropriate channel.
3. Security vulnerabilities must remain private.
4. Reproducible information improves response quality.
5. Community support does not create contractual obligations.
6. Maintainers may prioritize project health over individual requests.
7. Respectful participation is required.
8. Supported releases receive priority.
9. Operational responsibility remains with deployment owners.
10. Commercial support is separate from community governance.

---

## 3. Community Support Channels

Community support may be provided through:

- GitHub Discussions;
- GitHub Issues;
- project documentation;
- contribution documentation;
- release notes;
- architecture and developer guides;
- official community channels published by the project.

GitHub Discussions should generally be used for:

- usage questions;
- implementation guidance;
- architecture questions;
- extension-development questions;
- ideas and proposals;
- community knowledge sharing;
- troubleshooting that is not yet confirmed as a software defect.

Public discussions should not contain credentials, personal data, customer
data, confidential business information or security-vulnerability details.

---

## 4. GitHub Issues

GitHub Issues should generally be used for:

- reproducible software defects;
- documentation defects;
- confirmed regressions;
- approved enhancement proposals;
- repository-maintenance tasks.

Before opening an issue:

1. search existing issues and discussions;
2. confirm the behaviour on a supported release;
3. review relevant documentation;
4. collect reproducible evidence;
5. remove secrets and sensitive data.

An issue may be redirected to Discussions when it is primarily a support
question rather than a confirmed defect.

---

## 5. Information to Include

A useful support request should include:

- PropertyOS version or commit;
- deployment method;
- operating system and architecture;
- database version;
- Node.js and package-manager versions where relevant;
- affected module, plugin or theme;
- expected behaviour;
- observed behaviour;
- reproduction steps;
- relevant logs;
- configuration details with secrets removed;
- whether the issue is reproducible in a clean environment;
- recent changes that may be related.

Screenshots should be accompanied by text whenever possible.

Logs must be reviewed and sanitized before publication.

---

## 6. Security Support

Suspected vulnerabilities must follow `SECURITY.md`.

Do not create a public issue or discussion for:

- authentication bypass;
- authorization failures;
- data exposure;
- privilege escalation;
- secret leakage;
- exploitable injection;
- release-integrity concerns;
- unsafe plugin-signing or publication behaviour;
- consequential AI authorization bypass.

Publicly disclosed security reports may be closed or removed to protect users
while a private investigation proceeds.

---

## 7. Supported Releases

Community support focuses on currently supported release lines.

| Release category | Community support |
|---|---|
| Latest stable patch release | Primary |
| Supported stable release line | Available |
| Release candidate | Testing-focused |
| Development branch | Best effort |
| Unsupported historical release | Normally unavailable |
| Third-party fork | Maintainer of the fork |
| Unofficial distribution | Distributor or operator |

Users may be asked to upgrade before investigation continues.

The project is not required to reproduce defects on unsupported versions.

---

## 8. Support Scope

Community support may cover:

- installation guidance;
- configuration questions;
- documented deployment models;
- supported upgrades;
- API usage;
- plugin and theme development;
- contribution workflow;
- confirmed software defects;
- release compatibility;
- project architecture;
- documentation clarification.

Support availability depends on maintainer and community capacity.

---

## 9. Normally Out of Scope

The following are normally outside community-support scope:

- custom application development;
- private infrastructure administration;
- production-system access;
- bespoke data migration;
- recovery of lost data;
- regulatory or legal advice;
- security certification of private deployments;
- performance guarantees;
- unsupported modifications;
- third-party-fork maintenance;
- private plugin debugging without reproducible evidence;
- operation of customer environments;
- emergency incident response;
- contractual service levels.

Some of these services may be available commercially under a separate
agreement.

---

## 10. Response Expectations

Community support is provided on a best-effort basis.

The project does not guarantee:

- acknowledgement times;
- response times;
- resolution times;
- compatibility with every environment;
- acceptance of requested features;
- backports to unsupported releases;
- individual troubleshooting sessions.

Maintainers may prioritize:

1. security;
2. release integrity;
3. regressions;
4. widespread defects;
5. contributor blockers;
6. documentation;
7. general questions;
8. enhancement requests.

Silence does not indicate acceptance, rejection or a promised resolution date.

---

## 11. Maintainer Triage

Maintainers may:

- request more information;
- apply labels;
- redirect questions;
- close duplicates;
- close inactive requests;
- reject unsupported requests;
- convert discussions into issues;
- move sensitive reports to private channels;
- prioritize according to project governance.

Requests that cannot be reproduced may remain open for community investigation
or be closed until additional evidence is available.

---

## 12. Community Conduct

All support interactions are governed by `CODE_OF_CONDUCT.md`.

Participants must:

- communicate respectfully;
- assume good faith;
- avoid harassment;
- avoid demands or threats;
- protect private information;
- provide technically relevant details;
- respect maintainer decisions and project boundaries.

Abusive, discriminatory, disruptive or unsafe content may be moderated.

---

## 13. Documentation-First Support

The project aims to convert recurring support questions into reusable
documentation.

Maintainers and contributors are encouraged to:

- link existing documentation;
- improve unclear documentation;
- add troubleshooting guidance;
- document confirmed workarounds;
- record architectural decisions;
- avoid knowledge remaining only in private conversations.

A support interaction may result in a documentation issue or contribution.

---

## 14. Plugins and Themes

Support responsibility depends on ownership.

### Official extensions

Official plugins and themes may receive support through the PropertyOS project,
subject to their support status.

### Community extensions

Community-maintained extensions are supported by their respective maintainers.

### Commercial extensions

Commercial extension support is governed by the publisher's terms.

PropertyOS maintainers may assist with platform-level compatibility but are not
responsible for defects in third-party code.

---

## 15. Hosting and Infrastructure

PropertyOS can operate across different deployment environments.

Community support may provide general guidance, but deployment owners remain
responsible for:

- infrastructure security;
- backups;
- restoration;
- networking;
- certificates;
- monitoring;
- capacity planning;
- database administration;
- secrets;
- availability;
- disaster recovery.

Cloud-provider or hosting-provider incidents should also be reported to the
relevant provider.

---

## 16. Data and Privacy

Never publish:

- passwords;
- API keys;
- access tokens;
- private keys;
- customer records;
- resident information;
- employee information;
- payment information;
- confidential agreements;
- production database exports;
- unredacted logs containing sensitive data.

The project may remove sensitive content from public channels but cannot
guarantee removal from external caches, notifications or mirrors.

Users are responsible for sanitizing information before submission.

---

## 17. Commercial Support

Commercial services may be offered separately by
**Cogzidel Technologies Pvt. Ltd.** or approved ecosystem providers.

Services may include:

- implementation consulting;
- deployment assistance;
- architecture review;
- migration planning;
- integration development;
- training;
- enterprise support;
- operational-readiness review;
- security assessment;
- custom extension development.

Availability, scope, pricing, response times and contractual commitments are
defined only through a separate written agreement.

Community participation does not create a commercial relationship.

---

## 18. Professional Services and Governance

Commercial sponsorship or professional services do not automatically grant:

- maintainer status;
- release authority;
- governance votes;
- roadmap control;
- security authority;
- trademark rights;
- preferential acceptance of contributions.

Project authority remains governed by the Constitution and `GOVERNANCE.md`.

---

## 19. Language and Accessibility

English is the primary language of official repository governance and technical
documentation unless otherwise stated.

Community members may assist in other languages.

Contributors are encouraged to make support information:

- clear;
- searchable;
- accessible;
- reproducible;
- respectful of different experience levels.

---

## 20. No Warranty

Community support is informational and provided without warranty.

PropertyOS is distributed under the terms of its open-source licence.

Users remain responsible for evaluating whether guidance is appropriate for
their environment.

---

## 21. Policy Governance

This policy is governed by:

- the PropertyOS Constitution;
- `GOVERNANCE.md`;
- `MAINTAINERS.md`;
- `CODE_OF_CONDUCT.md`;
- `SECURITY.md`;
- release governance.

Material amendments should follow the repository governance process.

---

## 22. Related Documents

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `TRADEMARKS.md`
- `NOTICE`
- `LICENSE`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
