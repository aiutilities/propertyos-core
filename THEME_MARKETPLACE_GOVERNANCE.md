# PropertyOS Theme Marketplace Governance

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Project | PropertyOS |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | Official theme publication, certification, distribution and revocation |
| Governance authority | `GOVERNANCE.md` |
| Release authority | `RELEASE_GOVERNANCE.md` |
| Security authority | `SECURITY.md` |
| Maintainer authority | `MAINTAINERS.md` |
| Related marketplace policy | `PLUGIN_MARKETPLACE_GOVERNANCE.md` |

---

## 1. Purpose

This policy defines how themes may be submitted, reviewed, certified,
published, updated, suspended, revoked and removed from the official
PropertyOS Theme Marketplace.

It governs:

- publisher identity;
- package eligibility;
- theme manifests;
- package integrity;
- compatibility;
- presentation boundaries;
- branding;
- accessibility;
- security review;
- publication workflow;
- certification;
- versioning;
- suspension;
- revocation;
- appeals;
- marketplace records.

This policy applies to official marketplace status.

It does not prohibit independently distributed themes where the platform
permits their installation.

---

## 2. Theme Marketplace Principles

The official Theme Marketplace follows these principles:

1. Themes control presentation, not business authority.
2. Marketplace publication is a governed privilege.
3. Publisher identity must be attributable.
4. Package integrity must be verifiable.
5. Accessibility is a publication concern.
6. Theme behaviour must remain within declared boundaries.
7. Human approval is required for official publication.
8. Self-approval is prohibited.
9. Compatibility claims must be evidence-based.
10. Branding must not be deceptive.
11. Revocation must be enforceable.
12. Certification does not guarantee suitability for every deployment.
13. Themes must not bypass Core authorization or security.
14. AI systems may assist review but may not authorize publication.

---

## 3. Official Theme Marketplace

The official Theme Marketplace is a PropertyOS-governed distribution channel.

Official marketplace functions may include:

- publisher registration;
- package submission;
- automated validation;
- accessibility review;
- security review;
- compatibility review;
- branding review;
- human approval;
- publication;
- searchable discovery;
- installation routing;
- activation guidance;
- suspension;
- revocation;
- audit history.

An unofficial registry, mirror or website must not represent itself as the
official PropertyOS Theme Marketplace.

---

## 4. Marketplace Authority

Theme Marketplace Authority is exercised by:

- the Project Steward;
- an explicitly delegated Marketplace Maintainer;
- an explicitly delegated Theme Maintainer;
- an explicitly delegated Security Maintainer for security actions;
- approved automation operating within defined limits.

Technical repository, database or deployment access does not independently
establish Marketplace Authority.

Until delegation is formally recorded, authority remains with the Project
Steward.

---

## 5. Theme Maintainer

The Theme Maintainer coordinates:

- publisher onboarding;
- submission triage;
- theme-package review;
- accessibility review;
- branding review;
- compatibility evidence;
- certification records;
- publication;
- suspension;
- revocation;
- appeals;
- marketplace metadata;
- audit retention.

A Theme Maintainer must not approve their own theme submission.

---

## 6. Publisher Eligibility

A theme publisher may be:

- an individual;
- an organization;
- a registered business;
- a recognized open-source project;
- the PropertyOS Project Steward;
- an official PropertyOS team.

A publisher must provide sufficient identity information for accountability.

Anonymous publication may be declined when identity cannot be verified or risk
cannot be reasonably managed.

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

Registration does not automatically authorize theme publication.

---

## 8. Publisher Trust

Publisher trust may include states such as:

- pending;
- active;
- suspended;
- revoked;
- rejected.

Trust-state transitions must be controlled and auditable.

A suspended or revoked publisher must not submit or publish new official themes
unless trust is restored through an approved process.

---

## 9. Theme Eligibility

A theme may be eligible for official publication when it:

- has a valid theme package;
- has a valid manifest;
- has an attributable publisher;
- passes integrity validation;
- declares compatibility;
- documents layouts and assets;
- documents branding behaviour;
- passes applicable accessibility review;
- passes applicable security review;
- complies with licence requirements;
- complies with trademark policy;
- does not impersonate PropertyOS Core;
- does not alter protected business behaviour.

Eligibility does not guarantee approval.

---

## 10. Ineligible Themes

A theme may be rejected when it:

- contains malware;
- embeds hidden executable behaviour;
- bypasses authentication or authorization;
- modifies protected business logic;
- disables audit controls;
- collects undisclosed data;
- embeds secrets;
- injects unsafe remote content;
- misrepresents compatibility;
- impersonates PropertyOS;
- violates licence obligations;
- violates trademark policy;
- contains inaccessible critical workflows;
- creates unacceptable security risk;
- conflicts with the PropertyOS Constitution.

A theme may also be rejected when review evidence is incomplete.

---

## 11. Presentation Boundary

Themes govern presentation and user experience.

A theme may control approved aspects such as:

- layout;
- visual hierarchy;
- typography;
- spacing;
- colour tokens;
- icons;
- navigation presentation;
- page composition;
- dashboard presentation;
- responsive behaviour;
- role-specific visual experiences;
- branding assets.

Themes must not independently redefine business rules or authorization.

---

## 12. Protected Core Behaviour

A theme must not override or conceal protected Core behaviour, including:

- authentication;
- authorization;
- permissions;
- approval requirements;
- validation;
- audit events;
- security warnings;
- legal notices;
- privacy controls;
- payment confirmation;
- migration state;
- system-health state;
- consequential AI-action approval.

Visual customization must not weaken platform controls.

---

## 13. Theme Package

An official theme submission must use an approved package format.

A theme package may include:

- manifest;
- layout definitions;
- templates;
- components;
- styles;
- design tokens;
- icons;
- images;
- localization resources;
- documentation;
- integrity metadata.

The package must contain only files required for theme installation and use.

Packages must not depend on undeclared local files.

---

## 14. Package Safety

Theme-package processing must protect against:

- path traversal;
- absolute paths;
- symbolic-link escapes;
- hard-link escapes;
- archive bombs;
- unexpected executable files;
- overwritten protected paths;
- unsafe file types;
- hidden remote loaders;
- undeclared scripts.

A package that cannot be processed safely must be rejected.

Marketplace approval must not bypass package-validation controls.

---

## 15. Theme Manifest

Each theme must include a valid manifest.

The manifest should identify:

- theme identifier;
- name;
- version;
- publisher;
- description;
- compatibility range;
- supported surfaces;
- layouts;
- assets;
- design tokens;
- localization support;
- licence;
- integrity metadata;
- support information.

Manifest fields must accurately describe package behaviour.

---

## 16. Theme Identity

Theme identifiers must be:

- unique;
- stable;
- attributable;
- non-deceptive;
- compatible with registry rules.

A publisher must not use an identifier intended to impersonate:

- PropertyOS Core;
- an official PropertyOS theme;
- another publisher;
- a protected trademark;
- a reserved namespace.

Reserved namespaces may be controlled by the Project Steward.

---

## 17. Theme Versioning

Theme versions should follow Semantic Versioning.

Version changes should reflect:

- presentation changes;
- compatibility impact;
- layout changes;
- asset changes;
- accessibility impact;
- localization changes;
- security changes;
- migration or configuration impact.

Published theme versions are immutable.

A corrected package must use a new version unless Marketplace Authority approves
a transparent exceptional procedure.

---

## 18. Compatibility Declaration

A theme submission must declare its supported PropertyOS versions.

Compatibility may include:

- minimum Core version;
- maximum tested Core version;
- frontend contract version;
- supported layouts;
- supported portals;
- required components;
- supported browsers;
- supported devices;
- localization requirements;
- accessibility assumptions.

Compatibility statements must be supported by evidence.

---

## 19. Compatibility Review

Compatibility review may assess:

- manifest declarations;
- package format;
- theme registry usage;
- layout contracts;
- component contracts;
- frontend routes;
- responsive behaviour;
- browser support;
- activation behaviour;
- fallback behaviour;
- upgrade behaviour.

A theme may be limited to a specific compatibility range.

Marketplace publication does not guarantee compatibility with every deployment.

---

## 20. Supported Surfaces

A theme should declare each supported surface.

Supported surfaces may include:

- administrator portal;
- owner portal;
- resident portal;
- tenant portal;
- staff portal;
- security portal;
- public pages;
- hospitality interfaces;
- workspace interfaces;
- mobile-responsive layouts.

A theme must not claim support for an untested surface.

---

## 21. Layouts

Theme layouts should define:

- page structure;
- navigation placement;
- content regions;
- dashboard regions;
- responsive behaviour;
- fallback behaviour;
- accessibility landmarks.

Layouts must preserve access to required platform actions and information.

A layout must not hide required controls merely for visual simplicity.

---

## 22. Components

Theme components must:

- use approved public contracts;
- preserve expected input and output behaviour;
- support keyboard interaction where applicable;
- expose meaningful labels;
- preserve validation feedback;
- preserve loading and error states;
- avoid unsafe direct DOM manipulation;
- avoid hidden business behaviour.

Theme components must not silently replace governed Core actions.

---

## 23. Design Tokens

Themes may define approved design tokens for:

- colour;
- typography;
- spacing;
- borders;
- shadows;
- radius;
- elevation;
- icon sizing;
- motion;
- responsive breakpoints.

Design tokens must not reduce the visibility of critical system states.

Security, warning, error and approval states must remain distinguishable.

---

## 24. Typography

Typography must support:

- readability;
- hierarchy;
- responsive scaling;
- localization;
- accessible contrast;
- long-form content;
- form labels;
- status indicators.

Themes should avoid typography that materially reduces usability or obscures
important information.

---

## 25. Colour and Contrast

Theme colour systems must consider:

- text contrast;
- control contrast;
- focus visibility;
- error states;
- warning states;
- success states;
- disabled states;
- charts and data displays;
- light and dark contexts.

Critical information must not be communicated by colour alone.

---

## 26. Icons and Imagery

Icons and imagery must:

- have clear purpose;
- avoid deceptive status representation;
- include accessible alternatives where required;
- respect licence obligations;
- avoid embedding undisclosed tracking;
- avoid loading unsafe remote content;
- preserve platform meaning.

A decorative image must not replace required textual information.

---

## 27. Responsive Behaviour

Themes should support declared screen sizes and orientations.

Responsive review may include:

- navigation;
- tables;
- forms;
- dialogs;
- dashboards;
- charts;
- long text;
- touch targets;
- horizontal overflow;
- device rotation.

A responsive layout must not remove required functionality.

---

## 28. Localization

Themes should preserve localization capabilities.

Localization review may assess:

- translated text expansion;
- right-to-left layout;
- date and time presentation;
- number and currency presentation;
- pluralization;
- locale-specific typography;
- fallback language;
- localized accessibility labels.

A theme must not hard-code user-facing language where platform localization is
expected.

---

## 29. Accessibility

Accessibility is a core theme-review concern.

Review may assess:

- keyboard navigation;
- focus order;
- focus visibility;
- semantic structure;
- labels;
- headings;
- contrast;
- error identification;
- status announcements;
- zoom behaviour;
- reduced motion;
- screen-reader compatibility.

A theme must not make essential workflows inaccessible.

---

## 30. Accessibility Claims

Accessibility claims must identify:

- evaluated standard;
- conformance level;
- tested surfaces;
- testing method;
- known limitations;
- assistive technologies used;
- review date.

A theme must not claim full accessibility without supporting evidence.

Certification may apply only to specified versions and surfaces.

---

## 31. Motion and Animation

Motion must not interfere with usability.

Themes should:

- respect reduced-motion preferences;
- avoid unnecessary flashing;
- avoid motion that blocks interaction;
- avoid deceptive loading indicators;
- preserve focus during transitions;
- avoid excessive automatic movement.

Critical actions must not depend solely on animation.

---

## 32. Forms

Theme presentation of forms must preserve:

- labels;
- descriptions;
- required-field indicators;
- validation errors;
- server errors;
- disabled states;
- loading states;
- submission confirmation;
- keyboard operation;
- focus management.

A theme must not hide or reinterpret validation outcomes.

---

## 33. Tables and Data Displays

Tables and data displays should preserve:

- headings;
- relationships;
- sorting state;
- filtering state;
- pagination;
- selection state;
- empty states;
- loading states;
- error states;
- accessible alternatives where required.

Dense information must remain understandable across supported screen sizes.

---

## 34. Status Representation

Platform states must remain clear.

Themes should distinguish states such as:

- active;
- inactive;
- pending;
- approved;
- rejected;
- suspended;
- revoked;
- failed;
- warning;
- completed.

Status must not be communicated through colour alone.

A theme must not visually represent an unapproved action as approved.

---

## 35. Approval Interfaces

Approval interfaces must preserve:

- decision context;
- approver identity where applicable;
- consequences;
- confirmation;
- denial or rejection options;
- audit-relevant information;
- warning states.

Themes must not obscure the distinction between review, approval and execution.

---

## 36. Financial Interfaces

Themes presenting financial information must preserve:

- currency;
- amount precision;
- debit and credit distinction;
- due status;
- payment status;
- refund status;
- invoice identity;
- receipt identity;
- confirmation state.

A theme must not alter financial values or imply payment completion visually
when the underlying state is incomplete.

---

## 37. Security-Sensitive Interfaces

Security-sensitive interfaces include:

- sign-in;
- password or credential flows;
- permission management;
- access control;
- security warnings;
- recovery flows;
- audit views;
- plugin and theme trust state;
- AI authorization;
- deployment approval.

These interfaces require enhanced clarity and review.

A theme must not conceal security warnings or permission consequences.

---

## 38. Remote Assets

Remote assets may introduce security, privacy and availability risk.

A theme must disclose any use of:

- remote fonts;
- remote images;
- analytics;
- tracking pixels;
- external style sheets;
- external scripts;
- content-delivery networks.

Undisclosed remote execution or tracking is prohibited.

Marketplace review may require all critical assets to be packaged locally.

---

## 39. Scripts

Theme packages should avoid executable scripts unless the theme contract
explicitly permits them.

Where scripts are permitted, they must be:

- declared;
- reviewable;
- limited to presentation behaviour;
- free of hidden network access;
- free of credential handling;
- free of authorization bypass;
- free of business-rule replacement.

Obfuscated scripts may be rejected.

---

## 40. Data Collection

A theme must not collect user or deployment data unless:

- collection is explicitly declared;
- there is a legitimate purpose;
- platform policy permits it;
- appropriate consent exists;
- collection is minimized;
- retention is documented;
- transfer destinations are disclosed.

Purely presentational themes should not require independent data collection.

---

## 41. Security Review

Theme security review may include:

- archive inspection;
- manifest validation;
- asset inspection;
- script inspection;
- remote-content review;
- data-collection review;
- dependency review;
- unsafe HTML review;
- unsafe style injection review;
- link-target review;
- branding-deception review.

Security review does not guarantee the absence of vulnerabilities.

---

## 42. Automated Validation

Automated validation may evaluate:

- package structure;
- manifest validity;
- file types;
- checksums;
- compatibility fields;
- forbidden scripts;
- remote references;
- missing assets;
- broken references;
- licence metadata;
- theme-registry compatibility.

Automated validation may reject a package but may not grant final publication
approval by itself.

---

## 43. Manual Review

Manual review may be required when:

- custom scripts are present;
- remote assets are used;
- accessibility claims are made;
- security-sensitive surfaces are themed;
- financial interfaces are affected;
- approval interfaces are affected;
- branding could imply official status;
- automated evidence is insufficient;
- the theme is intended to be official.

Reviewers must disclose relevant conflicts of interest.

---

## 44. Independent Review

High-risk themes should receive review by more than one qualified person where
practical.

Independent review may include:

- a Theme Maintainer;
- an Accessibility Reviewer;
- a Security Maintainer;
- a Frontend Maintainer;
- a Marketplace Maintainer;
- a Documentation Maintainer;
- an external specialist.

A publisher must not act as the sole reviewer of their own submission.

---

## 45. Submission

A theme-publication submission should include:

- publisher identity;
- theme identifier;
- theme version;
- package artifact;
- manifest;
- integrity evidence;
- compatibility declaration;
- supported surfaces;
- accessibility evidence;
- branding declaration;
- remote-asset declaration;
- release notes;
- support information;
- review evidence where required.

Incomplete submissions may remain pending or be rejected.

---

## 46. Publication States

Theme-publication states may include:

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

## 47. Admission Review

Admission review determines whether a submission may enter full review.

Admission may verify:

- publisher trust;
- valid package structure;
- valid manifest;
- acceptable version;
- package integrity;
- compatibility declaration;
- supported-surface declaration;
- accessibility evidence;
- branding compliance;
- absence of active revocation.

Admission does not equal publication approval.

---

## 48. Approval

Approval requires an authorized human decision.

Approval evidence should identify:

- publication identifier;
- theme identifier;
- version;
- approving authority;
- approval date;
- reviewed evidence;
- conditions;
- compatibility scope;
- certification scope.

Self-approval must be rejected.

Approval must fail when required publisher trust has been revoked.

---

## 49. Rejection

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

## 50. Publication

Publication makes an approved theme discoverable through the official
marketplace.

Publication should confirm:

- approved package identity;
- immutable version;
- publisher attribution;
- compatibility information;
- supported surfaces;
- accessibility status;
- branding status;
- integrity evidence;
- certification status;
- support information.

Publication must use the approved artifact without substitution.

---

## 51. Certification

Certification indicates that a theme completed a defined review programme.

Certification may include:

- package certification;
- compatibility certification;
- accessibility certification;
- security certification;
- branding certification;
- responsive certification;
- localization certification;
- operational certification.

The exact certification scope must be stated.

Certification does not guarantee uninterrupted operation or suitability for
every deployment.

---

## 52. Official Themes

An official theme is one explicitly designated through PropertyOS governance.

Official status may require:

- Project Steward authorization;
- identified maintainers;
- stronger accessibility review;
- stronger security review;
- release alignment;
- support commitments;
- compatibility maintenance;
- documentation standards.

Marketplace publication alone does not create official status.

---

## 53. Verified Publishers

The marketplace may designate verified theme publishers.

Verification may indicate that:

- publisher identity was reviewed;
- contact channels were confirmed;
- marketplace obligations were accepted;
- prior compliance history was evaluated.

Verified status does not mean every theme is automatically approved.

---

## 54. Marketplace Metadata

Theme-marketplace metadata may include:

- theme name;
- identifier;
- publisher;
- version;
- description;
- categories;
- supported surfaces;
- compatibility;
- accessibility status;
- branding style;
- licence;
- support channel;
- documentation links;
- certification badges;
- publication date;
- update date;
- suspension or revocation state.

Metadata must not misrepresent theme behaviour or official status.

---

## 55. Search and Ranking

Theme-marketplace search and ranking should avoid deceptive promotion.

Ranking factors may include:

- relevance;
- compatibility;
- accessibility;
- certification;
- maintenance status;
- security status;
- documentation quality;
- user feedback;
- update recency.

Payment or sponsorship must not be disguised as technical endorsement.

---

## 56. Installation and Activation

Marketplace publication does not automatically activate a theme.

Installation and activation should preserve:

- package validation;
- compatibility checks;
- registry integrity;
- fallback theme availability;
- administrator authorization;
- activation audit records;
- recovery from activation failure.

A theme must not become active solely because it appears in the marketplace.

---

## 57. Updates

Each theme update is a new governed publication.

An update should include:

- a new immutable version;
- release notes;
- updated compatibility information;
- changed layouts;
- changed assets;
- accessibility impact;
- branding changes;
- remote-asset changes;
- security impact.

Previously approved versions do not grant automatic approval to later versions.

---

## 58. Compatibility Changes

Compatibility changes must disclose:

- newly supported PropertyOS versions;
- dropped PropertyOS versions;
- changed frontend contracts;
- changed supported surfaces;
- browser-support changes;
- device-support changes;
- migration or activation impact.

Material compatibility changes may require enhanced review.

---

## 59. Accessibility Changes

An update that affects accessibility must identify:

- affected surfaces;
- changed interaction patterns;
- changed colour or contrast;
- changed focus behaviour;
- changed semantic structure;
- changed motion;
- changed assistive-technology behaviour;
- updated testing evidence.

Accessibility regression may block publication.

---

## 60. Branding Changes

Material branding changes must disclose:

- changed logos;
- changed project naming;
- changed attribution;
- changed visual identity;
- changed external links;
- changed commercial references;
- changed official-status claims.

Branding changes must continue to comply with `TRADEMARKS.md`.

---

## 61. Maintenance Status

Publishers should maintain accurate status information.

A theme may be marked:

- actively maintained;
- maintenance only;
- deprecated;
- unsupported;
- archived;
- suspended;
- revoked.

A theme must not be represented as actively maintained when no responsible
maintainer is available.

---

## 62. Deprecation

A theme version or theme line may be deprecated.

Deprecation should identify:

- affected versions;
- reason;
- replacement where available;
- migration guidance;
- support period;
- intended removal or archival date.

Deprecation does not automatically deactivate installed themes.

---

## 63. Suspension

Suspension temporarily prevents new marketplace distribution.

Suspension may occur because of:

- incomplete investigation;
- publisher-trust concerns;
- security risk;
- accessibility regression;
- compatibility failure;
- policy violation;
- trademark concern;
- legal request;
- operational incident.

Suspension must record the reason, authority, date and review conditions.

---

## 64. Revocation

Revocation removes official distribution authority for a theme publication.

Revocation may occur because of:

- confirmed malware;
- critical vulnerability;
- fraudulent publication;
- serious policy violation;
- unacceptable data risk;
- deceptive branding;
- severe accessibility failure;
- legal necessity;
- publisher request;
- loss of package integrity.

Revocation must be auditable and propagated to marketplace controls.

---

## 65. Distribution Revocation

Distribution revocation may:

- remove the theme from ordinary discovery;
- block new installation;
- block updates;
- display warnings;
- mark affected versions revoked;
- trigger administrator notification;
- require remediation guidance.

Distribution revocation does not automatically deactivate a currently active
theme.

---

## 66. Runtime Deactivation

Runtime deactivation is a separate consequential action.

Deactivation may include:

- switching to a safe fallback theme;
- blocking activation;
- disabling unsafe assets;
- isolating remote content;
- restricting affected surfaces;
- restoring required controls.

Runtime deactivation requires explicit authorization according to platform and
security governance.

---

## 67. Emergency Actions

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

## 68. Publisher Suspension

A publisher may be suspended when:

- identity information becomes unreliable;
- repeated themes violate policy;
- review cooperation is refused;
- fraudulent activity is suspected;
- security incidents remain unresolved;
- deceptive branding is repeated;
- legal or governance action requires suspension.

Publisher suspension may affect all associated submissions and publications.

---

## 69. Publisher Revocation

Publisher trust may be revoked for:

- confirmed malicious activity;
- deliberate deception;
- repeated serious violations;
- unresolved compromise;
- impersonation;
- fraudulent accessibility claims;
- trademark abuse;
- legal necessity.

Revocation must record its scope and effect on existing themes.

---

## 70. Notifications

Marketplace operators should provide appropriate notifications for:

- approval;
- rejection;
- requested changes;
- publication;
- suspension;
- revocation;
- compatibility changes;
- accessibility changes;
- security advisories;
- publisher-trust changes.

Notifications must avoid exposing confidential vulnerability details.

---

## 71. Appeals

A publisher may appeal an adverse marketplace decision.

An appeal should include:

- the disputed decision;
- relevant theme or publisher identifiers;
- reasons for reconsideration;
- remediation evidence;
- accessibility evidence where relevant;
- conflict-of-interest concerns;
- requested outcome.

Appeals should be reviewed by an authority not solely responsible for the
original decision where practical.

---

## 72. Appeal Outcomes

An appeal may result in:

- confirmation of the original decision;
- modification of review conditions;
- restoration to review;
- lifting of suspension;
- restoration of publisher trust;
- rejection of the appeal;
- referral to broader governance.

An appeal does not automatically pause urgent security or accessibility action.

---

## 73. Marketplace Records

Marketplace records should preserve:

- publisher registration;
- submissions;
- package versions;
- review evidence;
- accessibility evidence;
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

## 74. Auditability

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

## 75. Data Protection

Theme-marketplace processes must protect:

- publisher contact information;
- identity-verification evidence;
- security reports;
- embargoed vulnerabilities;
- private operational information;
- unpublished review evidence.

Credentials, secrets and unrelated personal data must not be collected.

---

## 76. Vulnerability Reporting

Theme vulnerabilities must follow `SECURITY.md`.

Security reports must not be submitted through:

- public marketplace reviews;
- public issues;
- public discussions;
- public theme metadata.

Marketplace operators may suspend or revoke distribution during investigation.

---

## 77. User Reviews

The marketplace may support user reviews or ratings.

Reviews must not contain:

- vulnerability details;
- personal information;
- confidential deployment data;
- harassment;
- fraudulent claims;
- undisclosed commercial manipulation.

User reviews do not replace technical or accessibility certification.

---

## 78. Commercial Themes

Commercial themes may be eligible for publication.

Commercial status must not exempt a theme from:

- publisher requirements;
- package validation;
- security review;
- compatibility review;
- accessibility review;
- branding review;
- marketplace policy;
- revocation.

Payment does not create certification or official endorsement.

---

## 79. Open-Source Themes

Open-source themes should identify:

- licence;
- source repository where available;
- build instructions where practical;
- issue tracker;
- responsible maintainers.

Open-source availability does not automatically establish marketplace approval.

---

## 80. Trademark and Branding

Themes must comply with `TRADEMARKS.md`.

A theme must not imply that it is:

- part of PropertyOS Core;
- officially maintained;
- certified;
- endorsed;
- security-approved;
- accessibility-certified;

unless the relevant status was explicitly granted.

Publisher branding must remain distinguishable from PropertyOS project identity.

---

## 81. Current Product-Freeze Boundary

During Repository Foundation:

- no new Theme Marketplace feature implementation is authorized;
- no theme runtime behaviour may be changed;
- no theme database schema may be changed;
- no theme publication may occur solely because this policy exists;
- product source remains frozen;
- this document governs future marketplace operation only.

Existing theme-platform implementation remains unchanged.

---

## 82. Related Documents

- `README.md`
- `ROADMAP.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `SECURITY.md`
- `SUPPORT.md`
- `RELEASE_GOVERNANCE.md`
- `PLUGIN_MARKETPLACE_GOVERNANCE.md`
- `CONTRIBUTING.md`
- `TRADEMARKS.md`
- `LICENSE`
- `NOTICE`
- `docs/release/PLATFORM_PLUGIN_THEME_CERTIFICATION.md`
- `docs/generated/modules/theme.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
