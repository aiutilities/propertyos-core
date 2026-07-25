# PropertyOS Release Governance

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Project | PropertyOS |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | Official releases, tags, artifacts and release channels |
| Governance authority | `GOVERNANCE.md` |
| Maintainer authority | `MAINTAINERS.md` |
| Security authority | `SECURITY.md` |

---

## 1. Purpose

This policy defines how official PropertyOS releases are planned, authorized,
built, verified, published, maintained and retired.

It governs:

- stable releases;
- patch releases;
- release candidates;
- nightly builds;
- security hotfixes;
- long-term-support releases;
- versioning;
- deprecation;
- artifact integrity;
- release authorization;
- release documentation;
- post-release verification.

This policy does not authorize product development.

---

## 2. Release Principles

PropertyOS release governance follows these principles:

1. Release authority is separate from technical access.
2. Stable releases require evidence and explicit authorization.
3. Release artifacts must correspond to approved source.
4. Security and migration safety take priority over speed.
5. Releases must be reproducible where practical.
6. Release scope must remain controlled.
7. Release notes must describe material behaviour accurately.
8. Breaking changes require explicit governance.
9. Emergency releases remain accountable and auditable.
10. Published stable releases are immutable.
11. Human authorization remains mandatory.
12. AI systems may assist but may not authorize publication.

---

## 3. Official Release Channels

PropertyOS may use these official channels:

| Channel | Purpose | Stability |
|---|---|---|
| Stable | Production-ready public releases | Highest |
| Patch | Compatible fixes to a stable line | High |
| Release Candidate | Final validation before stable release | Pre-release |
| Nightly | Automated development snapshots | Unstable |
| Security Hotfix | Urgent security remediation | Controlled |
| Long-Term Support | Formally declared extended maintenance | High |

A channel exists only when formally activated and documented.

---

## 4. Versioning

PropertyOS follows Semantic Versioning.

The version format is `MAJOR.MINOR.PATCH`.

- **MAJOR** indicates incompatible changes.
- **MINOR** indicates backward-compatible capability additions.
- **PATCH** indicates backward-compatible fixes.

Pre-release identifiers may include `rc`, `beta`, `alpha` or `nightly`.

Build metadata may support internal traceability but must not replace the
official version identity.

---

## 5. Version Authority

Version numbers are proposed by the Release Manager and approved by the
authorized Release Authority.

A person or automation system may not independently assign an official version
merely because it can create a tag.

Version decisions must consider:

- compatibility;
- migration impact;
- security;
- ecosystem impact;
- deprecation;
- documentation;
- release channel;
- previously published versions.

---

## 6. Stable Releases

A stable release represents an official production baseline.

A stable release must include:

- approved scope;
- clean repository state;
- required test evidence;
- successful production builds;
- migration verification;
- security review;
- release notes;
- changelog update;
- release manifest;
- artifact checksums;
- licence and notice files;
- authorization evidence;
- post-publication validation.

Stable releases must not contain known critical defects unless explicitly
documented and accepted by Release Authority.

---

## 7. Patch Releases

Patch releases may include:

- bug fixes;
- security fixes;
- documentation corrections;
- compatibility fixes;
- artifact corrections;
- operational fixes.

Patch releases must not introduce incompatible changes.

Internal refactoring is permitted only when behaviour remains compatible, risk
is controlled, testing is sufficient and the change is necessary for the
approved fix.

---

## 8. Minor Releases

Minor releases may introduce backward-compatible capabilities.

A minor release requires:

- approved roadmap scope;
- architecture review where required;
- compatibility review;
- extension-impact review;
- migration review;
- documentation;
- certification evidence.

No minor release work is authorized during the current Repository Foundation
product freeze.

---

## 9. Major Releases

A major release may include incompatible changes.

Major releases require:

- explicit governance approval;
- migration strategy;
- deprecation history;
- ecosystem-impact analysis;
- compatibility documentation;
- release-candidate programme;
- extended validation;
- Steward approval.

A major release must not be used to conceal avoidable incompatibility.

---

## 10. Release Candidates

Release candidates are intended for final validation.

A release candidate should:

- have frozen product scope;
- contain only approved fixes after publication;
- include draft release notes;
- use the final migration structure;
- use release-equivalent build processes;
- undergo production-like validation;
- identify known issues.

A release candidate does not guarantee promotion to stable.

---

## 11. Nightly Builds

Nightly builds may be automated from an approved branch.

Nightly builds:

- are not stable releases;
- may be incomplete;
- may change without notice;
- may not receive migration support;
- must not be represented as certified;
- must be clearly labelled.

Nightly publication requires separate activation and automation governance.

---

## 12. Security Hotfixes

Security hotfixes address urgent vulnerabilities.

An accelerated process may be used while preserving:

- confidential handling;
- minimum qualified review;
- scope control;
- authorization;
- artifact integrity;
- post-release audit;
- advisory publication.

A security hotfix should contain only changes required to remediate or safely
mitigate the issue.

---

## 13. Long-Term Support

A release line is LTS only when formally declared.

An LTS declaration must define:

- supported version;
- start date;
- expected end date;
- maintenance scope;
- security scope;
- compatibility commitment;
- migration path;
- responsible maintainers.

No version is implicitly LTS.

---

## 14. Supported Versions

Supported versions are defined in `SECURITY.md` and release documentation.

Support may be limited to:

- the latest stable patch release;
- explicitly supported stable lines;
- formally declared LTS lines.

Users may be required to upgrade before receiving fixes.

---

## 15. Release Roles

Release governance recognizes:

- Project Steward;
- Release Authority;
- Release Manager;
- Security Maintainer;
- Module Owners;
- Infrastructure Maintainer;
- Documentation Maintainer;
- Verification Reviewers.

One person may hold multiple roles, but significant releases should preserve
independent review where practical.

---

## 16. Release Authority

Only designated Release Authorities may approve an official PropertyOS release.

At adoption of this policy:

- stable releases require Project Steward approval or an explicit delegate;
- security releases require Project Steward or Security Authority approval;
- release execution is performed by the Release Manager or approved automation.

Technical access does not establish release authority.

---

## 17. Release Manager

The Release Manager coordinates:

- version confirmation;
- scope verification;
- test evidence;
- migration evidence;
- release documentation;
- artifact generation;
- checksum generation;
- publication;
- post-release validation.

The Release Manager must not publish without authorization.

---

## 18. Release Scope

Every release must have a declared scope.

The scope should identify:

- included commits;
- included capabilities;
- fixes;
- migrations;
- documentation;
- known limitations;
- excluded work;
- compatibility impact.

Unrelated changes must not be added during release preparation.

---

## 19. Release Freeze

A release freeze may be declared before publication.

During release freeze:

- feature work stops;
- only approved fixes are allowed;
- changed-file scope is controlled;
- migrations are frozen except approved corrections;
- documentation must reflect actual behaviour;
- release evidence is preserved;
- unauthorized refactoring is prohibited.

The freeze ends only through explicit Release Authority.

---

## 20. Required Evidence

A stable release normally requires evidence for:

- backend tests;
- frontend validation;
- production builds;
- migrations;
- Docker or deployment artifacts;
- readiness;
- observability;
- security;
- licence compliance;
- documentation;
- artifact integrity.

Evidence must be reproducible or sufficiently documented.

---

## 21. Test Requirements

Tests must be appropriate to release risk.

Validation may include:

- unit tests;
- integration tests;
- contract tests;
- migration tests;
- regression tests;
- security tests;
- build verification;
- container verification;
- operational exercises.

Passing tests do not replace release authorization.

---

## 22. Migration Governance

Releases containing migrations must document:

- migration order;
- prerequisites;
- backup requirements;
- rollback limitations;
- isolated-environment evidence;
- production authorization requirements;
- compatibility assumptions.

Production migration execution remains a separate authorized action.

---

## 23. Artifact Integrity

Official release artifacts must be traceable to approved source.

Controls may include:

- immutable tags;
- checksums;
- signed tags;
- signed artifacts;
- build provenance;
- reproducible builds;
- protected environments;
- controlled credentials.

Artifacts must not be modified after publication under the same version.

---

## 24. Tags

Official release tags must:

- use the approved version;
- point to the authorized release commit;
- remain immutable;
- be created by authorized people or automation;
- include appropriate annotation for stable releases.

A mistaken published tag must not be silently moved.

Correction requires governance review and transparent documentation.

---

## 25. Release Notes

Release notes should include:

- release identity;
- date;
- overview;
- notable changes;
- compatibility impact;
- migration guidance;
- security information;
- known limitations;
- upgrade instructions;
- supporting evidence.

Release notes must distinguish released facts from planned work.

---

## 26. Changelog

`CHANGELOG.md` records notable public release history.

The changelog must:

- list releases in reverse chronological order;
- retain historical context;
- identify the first certified release accurately;
- avoid duplicating complete release evidence;
- reference detailed release documents.

---

## 27. Release Manifest

A stable release should include a release manifest recording:

- version;
- release name;
- source commit;
- tag;
- certification baseline;
- test evidence;
- artifacts;
- checksums;
- required documents;
- authorization state.

---

## 28. Checksums

Published binary or archive artifacts should include cryptographic checksums.

Checksum files must:

- identify the algorithm;
- identify the artifact;
- be generated after the final artifact;
- be published with the release;
- remain immutable.

SHA-256 is the minimum expected algorithm unless governance approves otherwise.

---

## 29. Signing

PropertyOS may require signing for:

- Git tags;
- release commits;
- release artifacts;
- plugins;
- themes;
- marketplace packages.

Signing requirements must define:

- trusted keys;
- key ownership;
- rotation;
- revocation;
- verification procedure.

Signing complements authorization. It does not replace it.

---

## 30. Release Automation

Release automation may:

- build artifacts;
- run validation;
- generate checksums;
- prepare release notes;
- publish drafts;
- upload authorized artifacts.

Automation may not independently:

- approve stable releases;
- waive failed checks;
- change version policy;
- bypass protected environments;
- disclose embargoed security information.

---

## 31. Protected Environments

Official publication should use protected release environments where available.

Controls may include:

- required reviewers;
- restricted secrets;
- branch restrictions;
- deployment approvals;
- audit logs.

Release credentials must not be stored in source files.

---

## 32. Repository State

Before publication, the repository must be:

- on the approved branch or release commit;
- at the expected HEAD;
- free of unintended changes;
- free of staged unrelated files;
- consistent with the release manifest.

The release process must not depend on an uncommitted working tree.

---

## 33. Dependency State

Release preparation must evaluate:

- dependency lockfiles;
- known vulnerabilities;
- unsupported dependencies;
- build reproducibility;
- licence concerns;
- provider compatibility.

Dependency updates during release freeze require explicit scope approval.

---

## 34. Security Review

Security review should consider:

- authentication;
- authorization;
- secrets;
- migrations;
- file handling;
- plugins and themes;
- AI actions;
- infrastructure;
- dependencies;
- release credentials;
- artifact integrity.

Open critical vulnerabilities normally block stable release publication.

---

## 35. AI Release Governance

AI capabilities require release review for:

- provider compatibility;
- authorization boundaries;
- auditability;
- tool execution;
- prompt governance;
- human approval;
- data isolation;
- safety;
- fallback behaviour.

Model output must not be treated as release authority.

---

## 36. Plugin and Theme Compatibility

A release should document extension compatibility when relevant.

Compatibility evaluation may include:

- SDK versions;
- API contracts;
- lifecycle behaviour;
- migrations;
- signing;
- package format;
- deprecated capabilities.

Breaking ecosystem changes require major-release governance unless separately
approved through an exceptional process.

---

## 37. Deprecation

Deprecation must define:

- affected capability;
- rationale;
- replacement;
- announcement date;
- migration guidance;
- earliest removal version.

Deprecation does not mean immediate removal.

---

## 38. Removal

Removal of a public capability requires:

- completed deprecation period;
- migration path;
- compatibility review;
- governance approval;
- release-note disclosure.

Urgent security removal may use emergency authority.

---

## 39. Backports

Backports may be approved for supported release lines.

A backport should:

- remain narrowly scoped;
- preserve compatibility;
- include relevant tests;
- avoid unrelated refactoring;
- receive independent review.

Backporting is not guaranteed.

---

## 40. Release Branches

Release branches may be created when required.

A release-branch policy must define:

- branch naming;
- accepted change types;
- merge direction;
- protection rules;
- support period;
- closure process.

Release branches must not become undocumented parallel product lines.

---

## 41. Failed Releases

A release attempt is failed when:

- authorization is absent;
- required evidence fails;
- artifacts are incorrect;
- the tag points to the wrong source;
- publication is incomplete;
- post-release verification fails materially.

A failed release must be stopped, documented and corrected through a new
authorized process.

---

## 42. Withdrawn Releases

A release may be withdrawn for:

- critical vulnerabilities;
- corrupted artifacts;
- severe data-integrity risk;
- legal necessity;
- invalid source correspondence.

Withdrawal must be transparent.

Published version history must not be erased.

---

## 43. Post-Release Verification

After publication, maintainers should verify:

- tag correctness;
- artifact availability;
- checksums;
- release notes;
- installation or startup;
- migration guidance;
- documentation links;
- public release visibility.

Any discrepancy must be recorded.

---

## 44. Release Incidents

A release incident may include:

- compromised credentials;
- incorrect artifacts;
- missing files;
- invalid checksums;
- wrong tags;
- broken migrations;
- severe regressions;
- unauthorized publication.

Incidents must follow security and governance escalation.

---

## 45. Emergency Authority

Emergency release authority is limited to addressing immediate material harm.

Emergency actions must be:

- scoped;
- time-bound;
- documented;
- reviewed after stabilization;
- reversed when temporary.

Emergency authority may not permanently alter versioning or governance.

---

## 46. Release Records

Release records should include:

- authorization;
- version decision;
- test evidence;
- migration evidence;
- security review;
- artifact checksums;
- publication record;
- post-release validation;
- known issues.

Records should be retained with the repository or approved release systems.

---

## 47. Release Confidentiality

Release information may remain confidential for:

- embargoed vulnerabilities;
- credentials;
- private infrastructure;
- legal obligations;
- active incident response.

Confidentiality should be limited to the minimum necessary scope and duration.

---

## 48. Commercial Releases

Commercial services may package or host PropertyOS separately.

They must not misrepresent:

- unofficial builds as official releases;
- modified artifacts as certified upstream artifacts;
- commercial support terms as open-source governance;
- trademark permission.

Official PropertyOS release authority remains governed by this policy.

---

## 49. Forks and Distributions

Forks may create their own releases under the open-source licence.

They must not:

- reuse official release identity deceptively;
- imply upstream certification;
- misrepresent official support;
- violate trademark policy.

Official distributions must be explicitly approved.

---

## 50. Release Communication

Release communication should be:

- accurate;
- consistent;
- evidence-based;
- clear about support status;
- clear about known limitations;
- clear about upgrade requirements.

Marketing language must not contradict release evidence.

---

## 51. Current Release Baseline

At adoption of this policy:

- `v1.0.1` is the first fully audited and certified PropertyOS release;
- `v1.0.0` remains a historical development tag;
- product development is frozen during Repository Foundation;
- no new release line is authorized by this policy alone.

---

## 52. Current Product-Freeze Boundary

During Repository Foundation:

- no minor or major feature release is authorized;
- patch or security releases require explicit approval;
- governance commits do not change product version;
- product CI remains unchanged unless separately authorized;
- release automation must remain isolated from product behaviour.

---

## 53. Amendments

Changes to this policy must follow `GOVERNANCE.md`.

Material changes include:

- changing release authority;
- changing versioning;
- changing support commitments;
- changing artifact requirements;
- changing security-release authority;
- changing deprecation requirements.

---

## 54. Related Documents

- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `SECURITY.md`
- `SUPPORT.md`
- `LICENSE`
- `NOTICE`
- `TRADEMARKS.md`
- `docs/release/PROPERTYOS_V1_0_1_RELEASE_NOTES.md`
- `docs/release/PROPERTYOS_V1_0_1_RELEASE_MANIFEST.md`
- `docs/release/PROPERTYOS_V1_FINAL_RELEASE_AUDIT.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
