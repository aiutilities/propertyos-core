# PropertyOS Maintainers

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Project | PropertyOS |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | PropertyOS Core, official repositories, releases, plugins, themes, SDKs, AI capabilities, documentation and project infrastructure |
| Governance authority | `GOVERNANCE.md` |
| Constitutional authority | PropertyOS Constitution |

---

## 1. Purpose

This document records the maintainership model for PropertyOS.

It defines:

- maintainer roles;
- ownership boundaries;
- review authority;
- release authority;
- security authority;
- documentation authority;
- AI authority;
- appointment expectations;
- inactivity and succession handling;
- access-control expectations.

This document answers:

> Who owns what?

It must be read together with:

- the PropertyOS Constitution;
- `GOVERNANCE.md`;
- `SECURITY.md`;
- `SUPPORT.md`;
- `CONTRIBUTING.md`;
- `CODE_OF_CONDUCT.md`.

Where this document conflicts with `GOVERNANCE.md`, the governance policy
prevails.

---

## 2. Project Steward

The official Project Steward is:

**Cogzidel Technologies Pvt. Ltd.**

The steward protects:

- project identity;
- constitutional continuity;
- repository integrity;
- release integrity;
- legal continuity;
- licence integrity;
- trademark integrity;
- official infrastructure;
- governance continuity;
- long-term ecosystem health.

The steward may appoint and remove maintainers according to `GOVERNANCE.md`.

---

## 3. Initial Maintainer Register

At adoption of this document, the official maintainer register is:

| Role | Holder | Status | Scope |
|---|---|---|---|
| Project Steward | Cogzidel Technologies Pvt. Ltd. | Active | Project-wide stewardship |
| Founder and Project Lead | S. Anand Nataraj | Active | Product vision, governance coordination and project continuity |
| Lead Maintainer | To be formally appointed | Vacant | Cross-project technical coordination |
| Release Manager | To be formally appointed | Vacant | Official release execution |
| Security Maintainer | To be formally appointed | Vacant | Vulnerability triage and security coordination |
| AI Maintainer | To be formally appointed | Vacant | AI platform governance and safety |
| Documentation Maintainer | To be formally appointed | Vacant | Official documentation governance |
| Community Maintainer | To be formally appointed | Vacant | Community support and moderation |

Vacant roles do not authorize informal assumption of authority.

Until a role is formally assigned, its authority remains with the Project
Steward or an explicitly delegated person.

---

## 4. Founder and Project Lead

The Founder and Project Lead protects continuity between:

- the original product vision;
- the Constitution;
- repository governance;
- platform architecture;
- ecosystem direction;
- stewardship decisions.

The role may:

- coordinate repository-foundation work;
- propose governance policies;
- propose maintainers;
- coordinate release-readiness reviews;
- protect product-freeze boundaries;
- escalate constitutional questions;
- represent the project's strategic intent;
- coordinate with the Project Steward.

The role does not independently bypass:

- security controls;
- release authorization;
- code review;
- constitutional amendment procedures;
- conflict-of-interest rules.

---

## 5. Maintainer Role Categories

PropertyOS recognizes the following maintainer categories:

1. Lead Maintainer
2. Core Maintainer
3. Module Owner
4. Release Manager
5. Security Maintainer
6. AI Maintainer
7. Documentation Maintainer
8. Community Maintainer
9. Infrastructure Maintainer
10. Marketplace Maintainer
11. Emeritus Maintainer

A person may hold more than one role.

Each role must have:

- an identified holder;
- defined scope;
- explicit authority;
- required repository access;
- active or inactive status;
- appointment record.

---

## 6. Lead Maintainer

The Lead Maintainer coordinates technical governance across PropertyOS.

Responsibilities include:

- architectural consistency;
- cross-module review;
- maintainer coordination;
- repository standards;
- technical dispute resolution;
- release-readiness coordination;
- product-freeze enforcement;
- dependency and compatibility oversight;
- escalation of governance issues;
- maintainer-capacity planning.

The Lead Maintainer may approve significant cross-module changes only when the
required affected owners and reviewers have participated.

The Lead Maintainer does not automatically receive:

- sole stable-release authority;
- sole security authority;
- constitutional amendment authority;
- unilateral maintainer-removal authority.

---

## 7. Core Maintainers

Core Maintainers have broad authority over PropertyOS Core.

They may:

- review and approve core changes;
- coordinate module owners;
- review architecture changes;
- enforce coding and testing standards;
- participate in release decisions;
- triage cross-module defects;
- mentor contributors;
- recommend module ownership.

Core Maintainers must understand:

- backend architecture;
- frontend architecture;
- database migrations;
- plugin architecture;
- event-driven architecture;
- workflow execution;
- authorization;
- release controls;
- operational safety.

Core authority must not be inferred solely from repository write access.

---

## 8. Module Owners

Module Owners have primary responsibility for specific capability areas.

They are expected to understand:

- domain behaviour;
- architecture;
- APIs;
- data model;
- migrations;
- authorization;
- tests;
- compatibility;
- operational risks;
- documentation;
- extension points.

Module ownership is technical stewardship, not personal ownership.

Module Owners must coordinate when a change affects another domain.

---

## 9. Core Platform Ownership Matrix

| Area | Primary owner | Secondary review | Current status |
|---|---|---|---|
| Identity | To be appointed | Security Maintainer | Vacant |
| Authentication | To be appointed | Security Maintainer | Vacant |
| Authorization and RBAC | To be appointed | Security Maintainer | Vacant |
| Property | To be appointed | Core Maintainer | Vacant |
| Zones and Spaces | To be appointed | Property owner | Vacant |
| Tenant | To be appointed | Property owner | Vacant |
| Agreement and Lease | To be appointed | Tenant owner | Vacant |
| Rent Ledger | To be appointed | Finance reviewer | Vacant |
| Payments | To be appointed | Security Maintainer | Vacant |
| Receipts | To be appointed | Finance reviewer | Vacant |
| Invoices | To be appointed | Finance reviewer | Vacant |
| Reports | To be appointed | Documentation Maintainer | Vacant |
| Event Bus | To be appointed | Core Maintainer | Vacant |
| Workflow | To be appointed | Core Maintainer | Vacant |
| Scheduler and Worker | To be appointed | Infrastructure Maintainer | Vacant |
| Notifications | To be appointed | Core Maintainer | Vacant |
| Configuration | To be appointed | Core Maintainer | Vacant |
| Metrics | To be appointed | Infrastructure Maintainer | Vacant |
| Health and Readiness | To be appointed | Infrastructure Maintainer | Vacant |
| Storage | To be appointed | Security Maintainer | Vacant |
| Search | To be appointed | Core Maintainer | Vacant |
| Forms | To be appointed | Core Maintainer | Vacant |
| Documents | To be appointed | Security Maintainer | Vacant |
| Uploads | To be appointed | Security Maintainer | Vacant |

---

## 10. Operational Domain Ownership Matrix

| Area | Primary owner | Secondary review | Current status |
|---|---|---|---|
| Maintenance | To be appointed | Core Maintainer | Vacant |
| Facility | To be appointed | Core Maintainer | Vacant |
| Asset Management | To be appointed | Facility owner | Vacant |
| Vehicle Registry | To be appointed | Operations reviewer | Vacant |
| Staff Registry | To be appointed | Security Maintainer | Vacant |
| Access Control | To be appointed | Security Maintainer | Vacant |
| Reservations | To be appointed | Property owner | Vacant |
| Helpdesk | To be appointed | Community Maintainer | Vacant |
| Procurement | To be appointed | Finance reviewer | Vacant |
| Inventory | To be appointed | Procurement owner | Vacant |
| Vendor Management | To be appointed | Procurement owner | Vacant |
| Audit | To be appointed | Security Maintainer | Vacant |
| Communications | To be appointed | Core Maintainer | Vacant |
| Integrations | To be appointed | Security Maintainer | Vacant |

---

## 11. Ecosystem Ownership Matrix

| Area | Primary owner | Secondary review | Current status |
|---|---|---|---|
| Plugin Engine | To be appointed | Security Maintainer | Vacant |
| Plugin SDK | To be appointed | Plugin Engine owner | Vacant |
| Plugin Installer | To be appointed | Security Maintainer | Vacant |
| Plugin Migration Runner | To be appointed | Release Manager | Vacant |
| Plugin Publication | To be appointed | Marketplace Maintainer | Vacant |
| Plugin Signing | To be appointed | Security Maintainer | Vacant |
| Theme Registry | To be appointed | Marketplace Maintainer | Vacant |
| Theme Packages | To be appointed | Security Maintainer | Vacant |
| Theme Activation | To be appointed | Core Maintainer | Vacant |
| Marketplace Foundation | To be appointed | Marketplace Maintainer | Vacant |
| Extension Compatibility | To be appointed | Release Manager | Vacant |
| Distribution Packaging | To be appointed | Release Manager | Vacant |
| Developer SDK | To be appointed | Documentation Maintainer | Vacant |
| Developer Portal | To be appointed | Documentation Maintainer | Vacant |

---

## 12. AI Ownership Matrix

| Area | Primary owner | Secondary review | Current status |
|---|---|---|---|
| AI Platform | AI Maintainer | Security Maintainer | Vacant |
| Provider Integration | To be appointed | AI Maintainer | Vacant |
| Provider Credentials | To be appointed | Security Maintainer | Vacant |
| AI Orchestration | To be appointed | AI Maintainer | Vacant |
| AI Agents | To be appointed | AI Maintainer | Vacant |
| AI Specialists | To be appointed | Marketplace Maintainer | Vacant |
| AI Actions | To be appointed | Security Maintainer | Vacant |
| AI Authorization | To be appointed | Security Maintainer | Vacant |
| AI Audit | To be appointed | Audit owner | Vacant |
| AI Memory | To be appointed | Security Maintainer | Vacant |
| Prompt Governance | To be appointed | Documentation Maintainer | Vacant |
| AI Safety | AI Maintainer | Security Maintainer | Vacant |
| AI Evaluation | To be appointed | Release Manager | Vacant |
| Capability Registry | To be appointed | AI Maintainer | Vacant |
| Model Compatibility | To be appointed | AI Maintainer | Vacant |

---

## 13. Release Manager

The Release Manager coordinates release execution.

Responsibilities include:

- confirming version numbers;
- validating release scope;
- confirming regression evidence;
- confirming migration state;
- preparing release notes;
- generating release artifacts;
- validating checksums;
- validating licence and notices;
- coordinating release authorization;
- publishing authorized releases;
- performing post-release validation.

The Release Manager executes release decisions.

The Release Manager does not independently create release authority.

---

## 14. Release Authority Register

At adoption of this document:

| Release category | Authorized approver | Executor | Status |
|---|---|---|---|
| Stable release | Project Steward or explicit delegate | Release Manager | Active control |
| Patch release | Project Steward or explicit delegate | Release Manager | Active control |
| Security hotfix | Project Steward or Security Authority | Release Manager | Active control |
| Release candidate | Project Steward or explicit delegate | Release Manager | Active control |
| Nightly build | Repository automation under approved policy | Automation | Not yet formalized |
| Marketplace package | Marketplace authority under approved policy | Marketplace Maintainer | Not yet formalized |

Technical access to GitHub Releases does not independently establish release
authority.

---

## 15. Security Maintainer

The Security Maintainer governs private vulnerability handling.

Responsibilities include:

- receiving vulnerability reports;
- confidential triage;
- severity assessment;
- affected-version identification;
- remediation coordination;
- disclosure coordination;
- security-advisory preparation;
- emergency recommendation;
- credential and key-rotation coordination;
- extension revocation recommendations;
- security documentation.

The Security Maintainer must follow `SECURITY.md`.

Security maintainers must be able to protect confidential information and
operate under least privilege.

---

## 16. Security Authority Register

At adoption of this document:

| Security function | Authority | Current status |
|---|---|---|
| Private report intake | Project Steward or delegated Security Maintainer | Delegation pending |
| Vulnerability triage | Project Steward or delegated Security Maintainer | Delegation pending |
| Advisory embargo | Project Steward or delegated Security Maintainer | Delegation pending |
| Emergency remediation recommendation | Security Maintainer | Delegation pending |
| Credential rotation authorization | Project Steward or infrastructure authority | Active control |
| Package revocation authorization | Project Steward or delegated Marketplace Authority | Delegation pending |
| Security release approval | Project Steward or explicit Security Authority | Active control |
| Public disclosure approval | Project Steward or delegated Security Maintainer | Active control |

Until delegation is formally recorded, authority remains with the Project
Steward.

---

## 17. AI Maintainer

The AI Maintainer protects the integrity of official AI capabilities.

Responsibilities include:

- provider compatibility;
- provider-agnostic architecture;
- AI specialist governance;
- prompt governance;
- action authorization;
- safety boundaries;
- human approval requirements;
- auditability;
- model evaluation;
- AI release certification;
- sensitive-data controls.

The AI Maintainer must coordinate with the Security Maintainer for:

- provider credentials;
- tool execution;
- prompt injection;
- data leakage;
- authorization bypass;
- unsafe automated actions;
- secret exposure.

---

## 18. AI Authority Boundaries

AI Maintainers may approve technical AI changes within their assigned scope.

They may not independently:

- authorize stable releases;
- amend the Constitution;
- appoint maintainers;
- waive security controls;
- approve irreversible production actions;
- expose protected data;
- grant AI systems governance votes;
- allow AI systems to bypass human authorization.

AI systems may assist maintainers but remain advisory.

Every consequential AI decision must have an accountable human owner.

---

## 19. Documentation Maintainer

The Documentation Maintainer governs official documentation.

Responsibilities include:

- documentation structure;
- public onboarding;
- contributor documentation;
- architecture documentation;
- API documentation;
- release documentation;
- policy consistency;
- link integrity;
- terminology;
- examples;
- tutorials;
- accessibility;
- documentation automation.

Documentation changes that define behaviour must receive technical review.

Documentation changes that define authority must receive governance review.

---

## 20. Documentation Ownership Matrix

| Area | Primary owner | Secondary review | Current status |
|---|---|---|---|
| README | Documentation Maintainer | Project Steward | Vacant |
| Constitution | Project Steward | Governance authority | Active control |
| Manifesto | Project Steward | Documentation Maintainer | Active control |
| Governance | Project Steward | Governance Council | Active control |
| Security Policy | Security Maintainer | Project Steward | Delegation pending |
| Support Policy | Community Maintainer | Documentation Maintainer | Delegation pending |
| Maintainers Register | Project Steward | Lead Maintainer | Active control |
| Changelog | Release Manager | Documentation Maintainer | Delegation pending |
| Roadmap | Project Steward | Lead Maintainer | Active control |
| Contribution Guide | Documentation Maintainer | Lead Maintainer | Delegation pending |
| Code of Conduct | Community Maintainer | Project Steward | Delegation pending |
| Trademark Policy | Project Steward | Legal reviewer | Active control |
| Architecture Guide | Lead Maintainer | Documentation Maintainer | Delegation pending |
| Plugin Guide | Plugin owner | Documentation Maintainer | Delegation pending |
| Theme Guide | Theme owner | Documentation Maintainer | Delegation pending |
| AI Guide | AI Maintainer | Documentation Maintainer | Delegation pending |

---

## 21. Community Maintainer

The Community Maintainer supports healthy project participation.

Responsibilities include:

- discussion moderation;
- issue triage;
- contributor onboarding;
- support routing;
- community documentation;
- code-of-conduct support;
- contributor recognition;
- ecosystem communication.

The Community Maintainer may moderate project spaces according to
`CODE_OF_CONDUCT.md`.

Community authority does not automatically include:

- code approval;
- release approval;
- private security access;
- repository administration;
- governance voting.

---

## 22. Infrastructure Maintainer

The Infrastructure Maintainer governs official technical infrastructure.

Responsibilities may include:

- continuous integration;
- deployment automation;
- repository automation;
- protected environments;
- secret management;
- observability;
- release infrastructure;
- artifact storage;
- backup and restoration;
- domain and service continuity.

Infrastructure access must follow least privilege.

Infrastructure Maintainers must not use administrative access to bypass
governance or release controls.

---

## 23. Marketplace Maintainer

The Marketplace Maintainer governs official extension publication.

Responsibilities may include:

- publisher verification;
- plugin certification;
- theme certification;
- AI specialist certification;
- signing requirements;
- compatibility checks;
- security review coordination;
- publication;
- suspension;
- revocation;
- appeals;
- marketplace metadata.

Marketplace authority will be formalized by separate marketplace-governance
policies.

Until those policies are adopted, official marketplace authority remains with
the Project Steward.

---

## 24. Review Authority

Review authority depends on change scope.

| Change type | Required reviewer |
|---|---|
| Routine documentation | Documentation Maintainer or authorized maintainer |
| Module-local code | Module Owner or authorized Core Maintainer |
| Cross-module code | Affected Module Owners and Lead Maintainer |
| Authentication or authorization | Security Maintainer and affected owner |
| Database migration | Module Owner and Release Manager |
| Plugin lifecycle | Plugin owner and Security Maintainer |
| Theme lifecycle | Theme owner and Security Maintainer |
| AI action execution | AI Maintainer and Security Maintainer |
| Release automation | Release Manager and Infrastructure Maintainer |
| Governance document | Project Steward or Governance Authority |
| Constitutional document | Constitutional Authority |
| Security policy | Security Maintainer and Project Steward |
| Trademark policy | Project Steward and legal reviewer where required |

Self-review alone is insufficient for significant changes.

---

## 25. Code Ownership Expectations

Formal code-owner automation may be introduced through `.github/CODEOWNERS`.

Until then, this document records intended ownership.

Code ownership should:

- reflect actual expertise;
- avoid abandoned scopes;
- include secondary reviewers;
- protect sensitive areas;
- support contributor onboarding;
- avoid blocking routine work unnecessarily.

Code ownership does not grant personal ownership of project assets.

---

## 26. Sensitive Areas

The following areas require heightened review:

- authentication;
- authorization;
- credentials;
- secrets;
- payments;
- migrations;
- plugin installation;
- package signing;
- marketplace publication;
- file extraction;
- uploads;
- AI tool execution;
- AI credentials;
- audit logs;
- release automation;
- infrastructure;
- security advisories.

Changes to sensitive areas should receive at least two qualified human reviews
where practical.

---

## 27. Maintainer Appointment Criteria

Maintainer candidates should demonstrate:

- sustained contributions;
- technical or community competence;
- reliable judgement;
- alignment with the Constitution;
- security awareness;
- review quality;
- respectful collaboration;
- documentation discipline;
- accountability;
- capacity to maintain the assigned scope.

Appointment should not be based solely on:

- employment;
- sponsorship;
- customer status;
- repository activity volume;
- personal relationship;
- ownership of a commercial extension.

---

## 28. Appointment Process

A maintainer appointment should include:

1. nomination;
2. role definition;
3. scope definition;
4. authority definition;
5. conflict-of-interest review;
6. access review;
7. governance approval;
8. steward confirmation;
9. public record;
10. onboarding.

Appointments may include a review period.

The appointment record should identify whether the maintainer has:

- voting rights;
- merge authority;
- release authority;
- security access;
- repository administration;
- infrastructure access.

---

## 29. Access Provisioning

Repository and infrastructure access must match assigned authority.

Access levels may include:

- read;
- triage;
- write;
- maintain;
- administer;
- security-advisory access;
- release-environment access;
- infrastructure access.

Access must follow least privilege.

New access should be documented.

Critical access should use appropriate authentication protections.

---

## 30. Access Review

Maintainer access should be reviewed:

- periodically;
- after role changes;
- after employment changes;
- after extended inactivity;
- after security incidents;
- after conflicts of interest;
- before major releases;
- when ownership changes.

Unused or unnecessary access should be removed.

Access review is an operational security control, not a judgement of personal
value.

---

## 31. Maintainer Inactivity

A maintainer may be considered inactive when they are unavailable for an
extended period and cannot perform their responsibilities.

Before changing status, the project should consider:

- communicated leave;
- health or family circumstances;
- employment changes;
- temporary capacity constraints;
- contribution outside public channels;
- project need.

Inactive status may result in:

- reduced review expectations;
- access reduction;
- reassignment of ownership;
- emeritus status.

Inactivity alone does not erase prior contributions.

---

## 32. Emeritus Status

Emeritus status recognizes former active maintainers.

Emeritus Maintainers:

- retain historical credit;
- may continue contributing;
- do not automatically retain merge authority;
- do not automatically retain security access;
- do not automatically retain release authority;
- may return through a renewed appointment.

Emeritus status should be recorded publicly.

---

## 33. Maintainer Resignation

A maintainer may resign at any time.

A responsible transition should include:

- notice where practical;
- handover of active responsibilities;
- transfer of private records;
- credential and access review;
- reassignment of owned areas;
- update of this document;
- acknowledgement of contributions.

A resignation does not affect authorship credit.

---

## 34. Maintainer Suspension

A maintainer may be temporarily suspended when immediate action is necessary
to protect:

- security;
- users;
- repository integrity;
- release integrity;
- confidential information;
- community safety;
- legal compliance.

Suspension may include temporary removal of:

- merge access;
- administrative access;
- release access;
- security access;
- infrastructure access.

Suspension is not automatically a final finding.

The matter should be reviewed according to `GOVERNANCE.md`.

---

## 35. Maintainer Removal

Removal may occur for:

- voluntary resignation;
- prolonged inability to serve;
- misuse of authority;
- serious security violations;
- repeated governance violations;
- undisclosed material conflicts;
- code-of-conduct violations;
- unauthorized releases;
- abandonment of critical responsibilities;
- legal necessity.

Except during urgent incidents, removal should include:

- notice;
- relevant concerns;
- opportunity to respond;
- documented decision;
- appeal route;
- access revocation;
- ownership reassignment.

---

## 36. Conflict of Interest

Maintainers must disclose relevant conflicts.

Examples include:

- commercial extension ownership;
- vendor relationships;
- customer contracts;
- employment interests;
- financial interests;
- competitive interests;
- family relationships;
- personal disputes;
- security-report involvement.

A conflict may require:

- recusal;
- independent review;
- additional approval;
- temporary limitation of authority;
- public disclosure.

Disclosure does not automatically disqualify a maintainer.

---

## 37. Maintainer Conduct

Maintainers must:

- follow `CODE_OF_CONDUCT.md`;
- communicate respectfully;
- avoid retaliation;
- protect confidential information;
- avoid coercion;
- separate evidence from personal preference;
- respect contributor rights;
- explain material decisions;
- avoid misuse of privileged access;
- maintain project trust.

Maintainers are held to a higher standard because they exercise project
authority.

---

## 38. Review Quality

Maintainer reviews should evaluate:

- correctness;
- scope;
- tests;
- security;
- architecture;
- compatibility;
- migrations;
- operational risk;
- documentation;
- constitutional alignment.

Review approval must not be used as a substitute for required automated
validation.

Automated validation must not be used as a substitute for accountable human
review.

---

## 39. Product Freeze Responsibilities

During the Repository Foundation product freeze, maintainers must:

- reject unapproved feature work;
- prevent product-source modifications;
- validate the expected HEAD;
- validate changed-file scope;
- preserve clean commit boundaries;
- validate whitespace;
- verify repository cleanliness;
- keep roadmap order unchanged;
- document operational blockers;
- avoid inserting unapproved phases.

Unexpected untracked files must be treated as a freeze-recovery issue, not as
permission to alter roadmap scope.

---

## 40. Release Responsibilities

Before an official release, assigned maintainers must confirm:

- source scope;
- test evidence;
- migration state;
- security review;
- release documentation;
- licence compliance;
- notice compliance;
- checksums;
- artifact provenance;
- known limitations;
- authorization.

Release execution and release approval must remain distinguishable.

---

## 41. Security Responsibilities

All maintainers must:

- protect credentials;
- avoid public vulnerability disclosure;
- use least privilege;
- report suspected compromise;
- preserve audit evidence;
- follow secure review practices;
- avoid committing secrets;
- rotate exposed credentials;
- respect embargoes;
- follow `SECURITY.md`.

Security responsibility is shared, even when a dedicated Security Maintainer
exists.

---

## 42. Documentation Responsibilities

Maintainers must update documentation when changes affect:

- behaviour;
- architecture;
- configuration;
- APIs;
- migrations;
- security;
- operations;
- extensions;
- compatibility;
- governance.

Documentation is part of the product.

A technically correct change may remain incomplete if its documentation is
missing.

---

## 43. Succession

Each critical area should have:

- a primary owner;
- a secondary reviewer;
- documented operational knowledge;
- documented access;
- documented release responsibilities;
- documented emergency contact path.

Critical ownership must not depend permanently on one person.

Vacant roles should be prioritized according to project risk.

---

## 44. Continuity Priorities

The highest-priority continuity roles are:

1. Project Steward
2. Repository Administrator
3. Release Authority
4. Security Maintainer
5. Lead Maintainer
6. Infrastructure Maintainer
7. AI Maintainer
8. Documentation Maintainer
9. Community Maintainer
10. Marketplace Maintainer

Continuity planning must preserve the official project identity and repository
history.

---

## 45. Maintainer Records

Maintainer records should include:

- name;
- role;
- scope;
- status;
- appointment date;
- appointing authority;
- voting status;
- merge authority;
- release authority;
- security authority;
- infrastructure access;
- conflicts disclosed;
- review date.

Sensitive personal information should not be published unnecessarily.

---

## 46. Public Contact Information

Public contact information should be published only with the maintainer's
consent.

This document does not require personal email addresses, phone numbers or other
private contact details.

Official role-based channels should be preferred where practical.

---

## 47. Amendments

Changes to this document must follow `GOVERNANCE.md`.

Minor changes may include:

- status updates;
- role-holder updates;
- scope clarifications;
- formatting;
- link corrections.

Material changes include:

- creating new authority;
- removing appeal rights;
- changing release authority;
- changing security authority;
- changing appointment rules;
- changing steward authority;
- changing voting status.

Material changes require governance review.

---

## 48. Current Product-Freeze Declaration

At adoption of this document:

- PropertyOS Core is complete;
- release `v1.0.1` has been certified;
- product feature development is frozen;
- repository governance and open-source readiness are in progress;
- no new product features are authorized;
- governance work must remain isolated from product source;
- each Repository Foundation milestone must close with a clean commit.

This declaration remains active until explicitly superseded.

---

## 49. Immediate Maintainer Priorities

The immediate governance priorities are:

1. preserve the product freeze;
2. complete Repository Foundation;
3. formalize release authority;
4. appoint security ownership;
5. appoint documentation ownership;
6. establish repository automation;
7. establish marketplace governance;
8. establish AI ecosystem governance;
9. complete repository audit;
10. publish Repository Foundation v1.0.

These priorities do not authorize feature development.

---

## 50. Related Documents

- `README.md`
- `LICENSE`
- `NOTICE`
- `TRADEMARKS.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- `GOVERNANCE.md`
- `CHANGELOG.md`
- `ROADMAP.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
