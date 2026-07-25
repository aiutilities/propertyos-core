# PropertyOS Plugin Marketplace Governance

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Project | PropertyOS |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | Official plugin publication, certification, distribution and revocation |
| Governance authority | `GOVERNANCE.md` |
| Release authority | `RELEASE_GOVERNANCE.md` |
| Security authority | `SECURITY.md` |
| Maintainer authority | `MAINTAINERS.md` |

---

## 1. Purpose

This policy defines how plugins may be submitted, reviewed, certified,
published, updated, suspended, revoked and removed from the official
PropertyOS Plugin Marketplace.

It governs:

- publisher identity;
- publisher trust;
- package eligibility;
- plugin manifests;
- signing;
- integrity;
- compatibility;
- permissions;
- security review;
- publication workflow;
- certification;
- versioning;
- suspension;
- revocation;
- appeals;
- marketplace records.

This policy governs official marketplace status.

It does not prevent users from installing independently distributed plugins
where the platform permits it.

---

## 2. Marketplace Principles

The official Plugin Marketplace follows these principles:

1. Marketplace publication is a governed privilege.
2. Publisher identity must be attributable.
3. Package integrity must be verifiable.
4. Security review must be proportional to risk.
5. Human approval is required for official publication.
6. Self-approval is prohibited.
7. Compatibility claims must be evidence-based.
8. Plugin permissions must be explicit.
9. Revocation must be enforceable.
10. Publication does not guarantee defect-free operation.
11. Certification does not transfer deployment responsibility.
12. AI systems may assist review but may not authorize publication.

---

## 3. Official Marketplace

The official Plugin Marketplace is a PropertyOS-governed distribution channel.

Official marketplace functions may include:

- publisher registration;
- publisher-key registration;
- package submission;
- automated validation;
- security review;
- compatibility review;
- human approval;
- publication;
- searchable discovery;
- installation routing;
- suspension;
- revocation;
- audit history.

An unofficial registry, mirror or website must not represent itself as the
official PropertyOS Plugin Marketplace.

---

## 4. Marketplace Authority

Marketplace Authority is exercised by:

- the Project Steward;
- an explicitly delegated Marketplace Maintainer;
- an explicitly delegated Security Maintainer for security actions;
- approved repository or marketplace automation within defined limits.

Technical database or repository access does not independently establish
Marketplace Authority.

Until formal delegation is recorded, authority remains with the Project
Steward.

---

## 5. Marketplace Maintainer

The Marketplace Maintainer coordinates:

- publisher onboarding;
- submission triage;
- review routing;
- certification records;
- compatibility evidence;
- publication;
- suspension;
- revocation;
- appeals;
- marketplace metadata;
- audit retention.

The Marketplace Maintainer must not approve their own plugin publication.

---

## 6. Publisher Eligibility

A publisher may be:

- an individual;
- an organization;
- a registered business;
- a recognized open-source project;
- the PropertyOS Project Steward;
- an official PropertyOS team.

A publisher must provide sufficient identity information for accountability.

Anonymous publication may be declined where identity cannot be verified or
risk cannot be managed.

---

## 7. Publisher Registration

Publisher registration should record:

- publisher identifier;
- display name;
- legal or project identity where applicable;
- contact channel;
- verification status;
- trust status;
- registration date;
- approving authority;
- suspension status;
- revocation status.

Registration does not automatically authorize publication.

---

## 8. Publisher Trust States

Publisher trust may include states such as:

- pending;
- active;
- suspended;
- revoked;
- rejected.

Transitions must be controlled and auditable.

A revoked publisher must not submit or publish new official packages unless
trust is restored through an approved process.

---

## 9. Publisher Keys

Official plugin signing requires registered publisher keys where signing is
enforced.

Publisher-key records should include:

- key identifier;
- publisher identifier;
- public-key material;
- algorithm;
- fingerprint;
- activation date;
- expiry where applicable;
- status;
- revocation reason;
- approving authority.

Private keys must never be submitted to PropertyOS.

---

## 10. Key Verification

Before a publisher key becomes trusted, verification should confirm:

- publisher identity;
- key ownership;
- fingerprint;
- supported algorithm;
- key strength;
- activation authority;
- absence of known compromise.

High-risk or official publishers may require stronger verification.

---

## 11. Key Rotation

Publishers should rotate keys when:

- a key approaches expiry;
- cryptographic policy changes;
- organizational control changes;
- compromise is suspected;
- operational policy requires rotation.

Rotation must preserve traceability between old and new keys.

Previously published packages should remain attributable to the signing key
used at publication.

---

## 12. Key Revocation

A publisher key may be revoked for:

- confirmed compromise;
- suspected compromise;
- unauthorized use;
- publisher request;
- policy violation;
- cryptographic weakness;
- loss of control;
- legal necessity.

Key revocation must be recorded and propagated to publication and installation
controls.

Revocation of a distribution key does not automatically terminate already
running plugin code unless runtime containment is separately authorized.

---

## 13. Plugin Eligibility

A plugin may be eligible for official publication when it:

- has a valid manifest;
- uses an approved package format;
- has an attributable publisher;
- passes integrity validation;
- passes signature validation where required;
- declares compatibility;
- declares permissions;
- declares dependencies;
- includes required documentation;
- passes applicable security review;
- complies with licence and trademark policy;
- does not impersonate official Core functionality.

Eligibility does not guarantee approval.

---

## 14. Ineligible Plugins

A plugin may be rejected when it:

- contains malware;
- includes hidden executable behaviour;
- bypasses authorization;
- disables audit controls;
- collects undisclosed data;
- embeds secrets;
- misrepresents compatibility;
- uses a revoked publisher key;
- impersonates PropertyOS;
- violates licence obligations;
- violates trademark policy;
- lacks required documentation;
- creates unacceptable operational risk;
- conflicts with the PropertyOS Constitution.

A plugin may also be rejected when review evidence is incomplete.

---

## 15. Package Format

Official marketplace submissions must use an approved package format.

The package should contain only files required for:

- installation;
- runtime execution;
- migrations;
- configuration;
- documentation;
- integrity verification;
- signature verification.

Packages must not depend on undeclared external files.

Archive structure must be deterministic and reviewable.

---

## 16. Package Extraction Safety

Package extraction must protect against:

- path traversal;
- absolute paths;
- symbolic-link escapes;
- hard-link escapes;
- archive bombs;
- unexpected device files;
- overwritten protected paths;
- unsupported file types.

A package that cannot be extracted safely must be rejected.

Marketplace approval does not permit bypassing installer extraction controls.

---

## 17. Plugin Manifest

Each plugin must include a valid manifest.

The manifest should identify:

- plugin identifier;
- name;
- version;
- publisher;
- description;
- entry point;
- compatibility range;
- dependencies;
- permissions;
- capabilities;
- migrations;
- licence;
- integrity metadata;
- optional support information.

Manifest fields must accurately describe package behaviour.

---

## 18. Plugin Identity

Plugin identifiers must be:

- unique;
- stable;
- attributable;
- non-deceptive;
- compatible with registry rules.

A publisher must not use identifiers intended to impersonate:

- PropertyOS Core;
- an official PropertyOS plugin;
- another publisher;
- a protected trademark;
- a reserved namespace.

Reserved namespaces may be controlled by the Project Steward.

---

## 19. Plugin Versioning

Plugin versions should follow Semantic Versioning.

Version changes should reflect:

- compatibility;
- behaviour;
- migration impact;
- dependency changes;
- permission changes;
- security changes.

Published versions are immutable.

A corrected package must use a new version unless Marketplace Authority
approves a transparent exceptional procedure.

---

## 20. Compatibility Declaration

A plugin submission must declare its supported PropertyOS versions.

Compatibility may include:

- minimum Core version;
- maximum tested Core version;
- SDK version;
- required APIs;
- required capabilities;
- required database features;
- supported deployment environments.

Compatibility statements must be supported by evidence.

---

## 21. Compatibility Review

Compatibility review may assess:

- manifest declarations;
- SDK usage;
- API usage;
- lifecycle hooks;
- database migrations;
- event contracts;
- dependency constraints;
- installation behaviour;
- upgrade behaviour;
- rollback behaviour.

A plugin may be limited to a specific compatibility range.

Marketplace publication does not guarantee compatibility with every deployment.

---

## 22. Dependencies

Plugin dependencies must be declared.

A dependency declaration should identify:

- dependency identifier;
- required version range;
- whether the dependency is mandatory;
- installation order;
- conflict conditions;
- runtime assumptions.

Undeclared dependencies may cause rejection.

Circular or unresolvable dependencies must be rejected.

---

## 23. Permissions

Plugins must declare required permissions.

Permissions should be:

- explicit;
- minimal;
- understandable;
- technically enforceable where supported;
- consistent with documented behaviour.

Broad or sensitive permissions require additional justification.

A plugin must not silently expand its authority during an update.

---

## 24. Sensitive Permissions

Sensitive permissions may include access to:

- identity;
- authentication;
- authorization;
- financial data;
- personal data;
- documents;
- uploads;
- secrets;
- infrastructure;
- AI actions;
- audit logs;
- cross-property data;
- external network services.

Sensitive permissions may require enhanced review or additional certification.

---

## 25. Capability Registration

Plugins may register approved platform capabilities.

Capabilities may include:

- workflows;
- schedulers;
- notifications;
- search providers;
- documents;
- dashboards;
- configuration;
- permissions;
- events;
- extension points.

Capability registration must not override protected Core behaviour without
explicit authorization.

---

## 26. Database Migrations

Plugin migrations must be:

- declared;
- versioned;
- ordered;
- reviewable;
- scoped to the plugin;
- tested;
- protected by migration controls.

Migrations must not modify unrelated Core data or schemas without explicit
approval.

Migration rollback limitations must be documented.

---

## 27. Migration Integrity

Marketplace review may require evidence for:

- migration checksums;
- immutable migration history;
- applied-version tracking;
- controlled execution;
- backup requirements;
- failure handling;
- rollback or recovery.

A previously published migration must not be silently altered.

---

## 28. Installation Behaviour

Installation must use approved installer controls.

Installation review may evaluate:

- package validation;
- signature verification;
- extraction;
- dependency resolution;
- migration execution;
- registration;
- rollback;
- failure containment;
- installation audit records.

Marketplace publication does not bypass deployment authorization.

---

## 29. Upgrade Behaviour

Plugin upgrades must define:

- source version;
- target version;
- compatibility;
- migrations;
- permission changes;
- configuration changes;
- rollback constraints;
- known risks.

Upgrade paths must not assume that every installation is at the immediately
preceding version.

---

## 30. Rollback Behaviour

A plugin should define rollback expectations where practical.

Rollback review should consider:

- package restoration;
- database state;
- migration irreversibility;
- configuration changes;
- dependency state;
- runtime compatibility;
- data loss risk.

Where full rollback is not possible, the limitation must be disclosed.

---

## 31. Security Review

Security review should be proportional to plugin risk.

Review may include:

- manifest inspection;
- permission analysis;
- dependency analysis;
- signature verification;
- package-integrity verification;
- source review;
- migration review;
- network-behaviour review;
- secret-handling review;
- file-handling review;
- AI-action review;
- supply-chain review.

Security review does not guarantee absence of vulnerabilities.

---

## 32. Automated Validation

Automated validation may evaluate:

- archive safety;
- manifest validity;
- signature validity;
- checksum integrity;
- dependency resolution;
- compatibility declarations;
- forbidden files;
- licence metadata;
- known vulnerable dependencies;
- test evidence.

Automated validation may reject a package but may not grant final publication
approval by itself.

---

## 33. Manual Review

Manual review may be required when:

- permissions are sensitive;
- migrations affect persistent data;
- native or executable components are included;
- external network access is required;
- AI actions are consequential;
- obfuscated code is present;
- publisher trust is new or limited;
- automated evidence is insufficient;
- the plugin is intended to be official.

Reviewers must disclose relevant conflicts of interest.

---

## 34. Independent Review

High-risk plugins should receive review by more than one qualified person where
practical.

Independent review may include:

- a Security Maintainer;
- a Module Owner;
- a Marketplace Maintainer;
- an Infrastructure Maintainer;
- an AI Maintainer;
- an external specialist.

A publisher must not act as the sole reviewer of their own submission.

---

## 35. Submission

A publication submission should include:

- publisher identity;
- package identifier;
- package version;
- package artifact;
- manifest;
- signature;
- integrity evidence;
- compatibility declaration;
- permission declaration;
- dependency declaration;
- release notes;
- support information;
- review evidence where required.

Incomplete submissions may remain pending or be rejected.

---

## 36. Publication States

Publication states may include:

- submitted;
- under review;
- changes requested;
- approved;
- rejected;
- published;
- suspended;
- revoked.

State transitions must be controlled and auditable.

Revocation is terminal unless a new submission and approval process is
completed.

---

## 37. Admission Review

Admission review determines whether a submission may enter publication review.

Admission may verify:

- publisher trust;
- active publisher key;
- valid signature;
- valid package integrity;
- valid manifest;
- acceptable version;
- compatibility declaration;
- required evidence;
- absence of an active revocation.

Admission does not equal publication approval.

---

## 38. Approval

Approval requires an authorized human decision.

Approval evidence should identify:

- publication identifier;
- package identifier;
- version;
- approving authority;
- approval date;
- reviewed evidence;
- conditions;
- compatibility scope;
- certification status.

Self-approval must be rejected.

Approval must fail when required publisher or key trust has been revoked.

---

## 39. Rejection

A rejected submission should record:

- rejection reason;
- reviewing authority;
- decision date;
- policy basis;
- whether resubmission is allowed;
- required remediation where appropriate.

Rejection of one version does not automatically prohibit future compliant
versions.

---

## 40. Publication

Publication makes an approved plugin discoverable through the official
marketplace.

Publication should confirm:

- approved package identity;
- immutable version;
- publisher attribution;
- compatibility information;
- permission information;
- integrity evidence;
- signature evidence;
- certification status;
- support information.

Publication must use the approved artifact without substitution.

---

## 41. Certification

Certification indicates that a plugin completed a defined review programme.

Certification may include:

- manifest certification;
- security certification;
- compatibility certification;
- migration certification;
- installation certification;
- upgrade certification;
- rollback certification;
- operational certification.

The exact certification scope must be stated.

Certification does not guarantee uninterrupted operation or suitability for
every deployment.

---

## 42. Official Plugins

An official plugin is one explicitly designated by PropertyOS governance.

Official status may require:

- Project Steward authorization;
- identified maintainers;
- stronger review;
- release alignment;
- support commitments;
- security-response ownership;
- compatibility maintenance;
- documentation standards.

Marketplace publication alone does not create official status.

---

## 43. Verified Publishers

The marketplace may designate verified publishers.

Verification may indicate that:

- publisher identity was reviewed;
- contact channels were confirmed;
- signing keys were verified;
- trust obligations were accepted.

Verified status does not mean every package is automatically approved.

---

## 44. Marketplace Metadata

Marketplace metadata may include:

- plugin name;
- identifier;
- publisher;
- version;
- description;
- categories;
- compatibility;
- permissions;
- dependencies;
- licence;
- support channel;
- documentation links;
- certification badges;
- publication date;
- update date;
- suspension or revocation state.

Metadata must not misrepresent package behaviour or official status.

---

## 45. Search and Ranking

Marketplace search and ranking should avoid deceptive promotion.

Ranking factors may include:

- relevance;
- compatibility;
- certification;
- maintenance status;
- security status;
- documentation quality;
- user feedback;
- update recency.

Payment or sponsorship must not be disguised as technical endorsement.

---

## 46. Updates

Each plugin update is a new governed publication.

An update should include:

- a new immutable version;
- release notes;
- updated compatibility information;
- changed permissions;
- changed dependencies;
- migration information;
- updated integrity and signature evidence;
- security impact.

Previously approved versions do not grant automatic approval to later versions.

---

## 47. Permission Changes

A plugin update that requests additional permissions must disclose:

- each new permission;
- the reason it is required;
- affected data or operations;
- migration or configuration impact;
- whether user consent is required.

Material permission expansion may require enhanced review.

A plugin must not acquire new authority through undeclared behaviour.

---

## 48. Dependency Changes

Dependency changes must be reviewed for:

- compatibility;
- known vulnerabilities;
- licence impact;
- package integrity;
- installation order;
- runtime behaviour;
- supply-chain risk.

A dependency on a revoked or unavailable plugin may block publication.

---

## 49. Maintenance Status

Publishers should maintain accurate status information.

A plugin may be marked:

- actively maintained;
- maintenance only;
- deprecated;
- unsupported;
- archived;
- suspended;
- revoked.

A plugin must not be represented as actively maintained when no responsible
maintainer is available.

---

## 50. Deprecation

A plugin version or plugin line may be deprecated.

Deprecation should identify:

- affected versions;
- reason;
- replacement where available;
- migration guidance;
- support period;
- intended removal or archival date.

Deprecation does not automatically remove installed copies.

---

## 51. Suspension

Suspension temporarily prevents new marketplace distribution.

Suspension may occur because of:

- incomplete investigation;
- publisher-trust concerns;
- suspected key compromise;
- security risk;
- compatibility failure;
- policy violation;
- legal request;
- operational incident.

Suspension must record the reason, authority, date and review conditions.

---

## 52. Revocation

Revocation removes official distribution authority for a plugin publication.

Revocation may occur because of:

- confirmed malware;
- critical vulnerability;
- compromised signing key;
- fraudulent publication;
- serious policy violation;
- unacceptable data risk;
- legal necessity;
- publisher request;
- loss of package integrity.

Revocation must be auditable and propagated to marketplace controls.

---

## 53. Distribution Revocation

Distribution revocation may:

- remove the package from ordinary discovery;
- block new installation;
- block updates;
- display warnings;
- mark affected versions revoked;
- trigger operator notification;
- require security guidance.

Distribution revocation does not automatically terminate a running plugin.

---

## 54. Runtime Containment

Runtime containment is a separate consequential action.

Containment may include:

- blocking activation;
- disabling runtime loading;
- isolating capabilities;
- stopping scheduled execution;
- restricting network access;
- removing authorization;
- quarantining a plugin.

Runtime containment requires explicit authorization according to platform and
security governance.

---

## 55. Emergency Actions

Immediate action may be taken to prevent material harm.

Emergency action must be:

- narrowly scoped;
- authorized by qualified authority;
- recorded;
- reviewed after stabilization;
- communicated where appropriate;
- reversed when temporary.

Emergency authority must not be used to avoid ordinary marketplace governance.

---

## 56. Publisher Suspension

A publisher may be suspended when:

- identity information becomes unreliable;
- a key is compromised;
- multiple packages violate policy;
- review cooperation is refused;
- fraudulent activity is suspected;
- security incidents remain unresolved;
- legal or governance action requires suspension.

Publisher suspension may affect all associated submissions and publications.

---

## 57. Publisher Revocation

Publisher trust may be revoked for:

- confirmed malicious activity;
- deliberate deception;
- repeated serious violations;
- unauthorized key use;
- unresolved compromise;
- impersonation;
- legal necessity.

Revocation must record its scope and effect on existing packages.

---

## 58. Notifications

Marketplace operators should provide appropriate notifications for:

- approval;
- rejection;
- requested changes;
- publication;
- suspension;
- revocation;
- compatibility changes;
- security advisories;
- publisher-trust changes.

Notifications must avoid exposing confidential vulnerability details.

---

## 59. Appeals

A publisher may appeal an adverse marketplace decision.

An appeal should include:

- the disputed decision;
- relevant publication or publisher identifiers;
- reasons for reconsideration;
- remediation evidence;
- conflict-of-interest concerns;
- requested outcome.

Appeals should be reviewed by an authority not solely responsible for the
original decision where practical.

---

## 60. Appeal Outcomes

An appeal may result in:

- confirmation of the original decision;
- modification of conditions;
- restoration to review;
- lifting of suspension;
- restoration of publisher trust;
- rejection of the appeal;
- referral to broader governance.

An appeal does not automatically pause urgent security action.

---

## 61. Marketplace Records

Marketplace records should preserve:

- publisher registration;
- publisher-key history;
- submissions;
- review evidence;
- approval and rejection decisions;
- publication state;
- certification scope;
- suspension;
- revocation;
- appeals;
- security events;
- compatibility changes.

Records must be sufficiently complete to reconstruct material decisions.

---

## 62. Auditability

Marketplace actions should identify:

- actor;
- authority;
- action;
- target;
- timestamp;
- reason;
- prior state;
- resulting state;
- supporting evidence.

Audit history must not be silently rewritten.

---

## 63. Data Protection

Marketplace processes must protect:

- publisher contact information;
- identity-verification evidence;
- security reports;
- embargoed vulnerabilities;
- signing-key metadata;
- private operational information.

Private keys, credentials and unrelated personal data must not be collected.

---

## 64. Vulnerability Reporting

Plugin vulnerabilities must follow `SECURITY.md`.

Security reports must not be submitted through:

- public marketplace reviews;
- public issues;
- public discussions;
- public package metadata.

Marketplace operators may suspend or revoke distribution while a vulnerability
is investigated.

---

## 65. Security Advisories

A plugin security advisory should identify, where appropriate:

- affected plugin;
- affected versions;
- severity;
- impact;
- fixed version;
- mitigations;
- upgrade guidance;
- revocation state;
- disclosure date.

Confidential technical details may remain limited until coordinated disclosure.

---

## 66. User Reviews

The marketplace may support user reviews or ratings.

Reviews must not contain:

- vulnerability details;
- personal information;
- confidential deployment data;
- harassment;
- fraudulent claims;
- undisclosed commercial manipulation.

Reviews do not replace technical certification.

---

## 67. Commercial Plugins

Commercial plugins may be eligible for publication.

Commercial status must not exempt a plugin from:

- identity requirements;
- signing;
- security review;
- compatibility review;
- permission disclosure;
- marketplace policy;
- revocation.

Payment does not create certification or official endorsement.

---

## 68. Open-Source Plugins

Open-source plugins should identify:

- licence;
- source repository where available;
- build instructions where practical;
- issue tracker;
- responsible maintainers.

Open-source availability does not automatically establish marketplace approval.

---

## 69. Trademark and Branding

Plugins must comply with `TRADEMARKS.md`.

A plugin must not imply that it is:

- part of PropertyOS Core;
- officially maintained;
- certified;
- endorsed;
- security-approved;

unless the relevant status was explicitly granted.

Publisher branding must remain distinguishable from PropertyOS project identity.

---

## 70. Current Product-Freeze Boundary

During Repository Foundation:

- no new marketplace feature implementation is authorized;
- no plugin runtime behaviour may be changed;
- no plugin database schema may be changed;
- no marketplace publication may be performed solely because this policy exists;
- product source remains frozen;
- this document governs future operation only.

Existing plugin platform implementation remains unchanged.

---

## 71. Amendments

Changes to this policy must follow `GOVERNANCE.md`.

Material amendments include:

- changing Marketplace Authority;
- changing publisher-trust requirements;
- changing signing requirements;
- changing certification requirements;
- changing revocation authority;
- changing appeal rights;
- changing official-plugin status rules.

Security emergency actions may occur before policy amendment when necessary to
prevent immediate harm.

---

## 72. Related Documents

- `README.md`
- `ROADMAP.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `SECURITY.md`
- `SUPPORT.md`
- `RELEASE_GOVERNANCE.md`
- `CONTRIBUTING.md`
- `TRADEMARKS.md`
- `LICENSE`
- `NOTICE`
- `docs/release/PLATFORM_PLUGIN_THEME_CERTIFICATION.md`
- `documentation/PHASE_13D_DEPLOYMENT_ROLLOUT.md`
- `documentation/PHASE_13D_TRUST_BOOTSTRAP.md`
- `sdk/001-Plugin-SDK.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
