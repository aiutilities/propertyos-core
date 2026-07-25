# PropertyOS Security Policy

| Field | Value |
|---|---|
| Status | Active |
| Version | 1.0 |
| Effective date | 25 July 2026 |
| Steward | Cogzidel Technologies Pvt. Ltd. |
| Applies to | PropertyOS Core, official plugins, themes, SDKs, release artifacts and project infrastructure |
| Authority | PropertyOS Constitution |

---

## 1. Purpose

PropertyOS is infrastructure for properties, workspaces and hospitality.

Security failures may affect operational data, identities, permissions,
financial records, assets, facilities, integrations and automated workflows.

This policy defines how vulnerabilities should be reported, evaluated,
remediated and disclosed.

---

## 2. Security Principles

PropertyOS security governance follows these principles:

1. Security is part of the product.
2. Secure defaults are preferred over optional hardening.
3. Access should follow least privilege.
4. Sensitive actions must be authenticated, authorized and auditable.
5. Important operational actions should be observable.
6. Security controls should fail safely.
7. Security fixes should be reproducible and independently verifiable.
8. Vulnerability disclosure should protect users while enabling transparency.
9. Human authorization remains required for consequential actions.
10. Official extensions must not weaken the platform security model.

---

## 3. Supported Versions

Security maintenance is provided for currently supported release lines.

| Version | Supported |
|---|---|
| `v1.0.x` | Yes |
| Earlier development snapshots | No |
| Unreleased branches | Best effort |
| Third-party forks | No |
| Unofficial distributions | No |

Support status may change as newer release lines are introduced.

Security fixes may require upgrading to the latest supported patch release.

The project may decline to backport fixes when doing so would create additional
risk or produce an inadequately tested release.

---

## 4. Reporting a Vulnerability

Do not report suspected security vulnerabilities through public GitHub issues,
public discussions, social media or other public channels.

Use the private security-reporting mechanism published by the PropertyOS
project repository.

Where GitHub private vulnerability reporting is enabled, reporters should use
the repository's **Security** section and select **Report a vulnerability**.

If private vulnerability reporting is temporarily unavailable, contact the
project steward through an official private channel published by Cogzidel
Technologies Pvt. Ltd.

Do not send secrets, credentials, personal data or production data unless they
are strictly necessary and can be shared safely.

---

## 5. Information to Include

A useful vulnerability report should include:

- affected PropertyOS version or commit;
- affected component, module, plugin, theme or integration;
- vulnerability description;
- prerequisites required for exploitation;
- reproduction steps;
- proof-of-concept material where safe;
- expected and observed behaviour;
- potential impact;
- suggested remediation, when available;
- whether the vulnerability is already publicly known;
- reporter contact details;
- preferred credit or anonymity.

Reports should use test data rather than real customer information.

---

## 6. Security Scope

Examples of security issues that may be in scope include:

- authentication bypass;
- authorization or privilege-escalation flaws;
- insecure direct-object references;
- remote code execution;
- command injection;
- SQL or query injection;
- cross-site scripting;
- cross-site request forgery;
- server-side request forgery;
- unsafe file upload or extraction;
- directory traversal;
- sensitive-information disclosure;
- insecure secret handling;
- cryptographic implementation flaws;
- tenant or property data isolation failures;
- plugin or theme sandbox escape;
- plugin package-signing bypass;
- marketplace publication-trust bypass;
- webhook signature bypass;
- workflow authorization bypass;
- unsafe AI action execution;
- security-audit suppression or tampering;
- dependency vulnerabilities with a demonstrated PropertyOS impact;
- release-artifact integrity failures.

This list is illustrative and not exhaustive.

---

## 7. Normally Out of Scope

The following are normally outside the vulnerability programme unless they
create a meaningful security impact:

- documentation errors without security consequences;
- feature requests;
- unsupported versions;
- third-party forks;
- unofficial distributions;
- social-engineering attacks against project contributors;
- denial-of-service reports requiring unrealistic resources;
- missing security headers without demonstrated impact;
- automated scanner output without verification;
- dependency-version reports without an exploitable PropertyOS path;
- theoretical concerns without a credible attack scenario;
- vulnerabilities requiring prior full administrative compromise;
- attacks requiring physical access to an already compromised host;
- reports based only on outdated development snapshots.

The security team may still review an out-of-scope report when it reveals a
broader architectural concern.

---

## 8. Safe-Harbour Expectations

Good-faith security research should:

- avoid accessing data belonging to other people;
- avoid modifying or destroying data;
- avoid degrading availability;
- avoid persistence after testing;
- avoid social engineering;
- avoid testing against systems without authorization;
- stop immediately when sensitive data is encountered;
- report findings privately and promptly;
- allow reasonable remediation time before disclosure;
- comply with applicable law.

The project intends to work constructively with researchers who follow these
expectations.

This policy does not authorize testing against deployments operated by third
parties. Researchers must obtain authorization from the relevant system owner.

---

## 9. Intake and Triage

After receiving a report, the security maintainers will endeavour to:

1. confirm receipt;
2. establish a private communication channel;
3. assess reproducibility;
4. identify affected versions and components;
5. evaluate severity and exploitability;
6. determine whether active exploitation is known;
7. assign remediation ownership;
8. establish a disclosure plan.

Response times are targets rather than contractual service-level commitments.

Complex reports may require additional information or extended investigation.

---

## 10. Severity Assessment

PropertyOS may consider:

- confidentiality impact;
- integrity impact;
- availability impact;
- required privileges;
- attack complexity;
- user interaction;
- affected deployment scope;
- tenant-boundary impact;
- property-operation impact;
- financial-record impact;
- exploit maturity;
- active exploitation;
- availability of mitigations.

Industry-standard scoring systems may be used as supporting tools.

Final severity remains a project governance decision based on the complete
PropertyOS context.

---

## 11. Remediation

Security remediation may include:

- source-code fixes;
- configuration changes;
- dependency upgrades;
- release replacement;
- plugin or theme revocation;
- signing-key rotation;
- credential rotation;
- migration guidance;
- temporary mitigations;
- documentation changes;
- security-advisory publication.

Fixes must follow repository governance, review and release controls.

Urgent remediation may use an accelerated hotfix process while preserving
minimum review, integrity and audit requirements.

---

## 12. Coordinated Disclosure

PropertyOS follows coordinated vulnerability disclosure.

Disclosure timing will consider:

- severity;
- active exploitation;
- fix availability;
- release readiness;
- deployment complexity;
- user protection;
- downstream coordination.

A public advisory may include:

- affected versions;
- impact summary;
- fixed versions;
- mitigation guidance;
- upgrade instructions;
- acknowledgement of the reporter;
- relevant technical details.

Reporter credit will be provided unless anonymity is requested or attribution
would create legal or safety concerns.

---

## 13. Confidentiality

Vulnerability information should remain restricted to people directly involved
in triage, remediation, review, release and disclosure.

Access should follow least privilege.

Embargoed information must not be used for personal, commercial or competitive
advantage.

Security records should be retained according to project governance and
applicable legal requirements.

---

## 14. Security Advisories and Releases

Confirmed vulnerabilities may result in:

- a GitHub Security Advisory;
- a patch release;
- a hotfix release;
- updated release checksums;
- replacement artifacts;
- deployment guidance;
- revocation of affected packages;
- notification to maintainers or downstream distributors.

Users should verify official release artifacts and checksums before deployment.

Security releases may contain limited technical detail until users have had a
reasonable opportunity to update.

---

## 15. Dependencies and Supply Chain

PropertyOS security includes its software supply chain.

Official development and release processes should address:

- dependency provenance;
- package-lock integrity;
- release reproducibility;
- artifact checksums;
- secret scanning;
- static analysis;
- dependency scanning;
- protected release authority;
- plugin and theme signing;
- publication governance;
- build-environment isolation.

Third-party dependencies remain governed by their respective maintainers and
licences.

A vulnerability in a dependency is considered actionable when it creates a
credible risk to a supported PropertyOS release.

---

## 16. Plugins, Themes and Extensions

Official plugins, themes and extensions must comply with PropertyOS security
requirements.

Extension maintainers are responsible for:

- secure implementation;
- least-privilege permissions;
- compatibility declarations;
- dependency maintenance;
- vulnerability response;
- release integrity;
- protecting credentials and secrets.

Official certification does not guarantee that software is free from all
defects or vulnerabilities.

Third-party extensions that are not officially maintained remain the
responsibility of their publishers and users.

---

## 17. AI Security

AI capabilities must operate within PropertyOS authorization, audit and safety
boundaries.

AI components must not:

- bypass authentication or authorization;
- silently escalate privileges;
- expose secrets or protected data;
- execute consequential actions without required approval;
- disable audit controls;
- weaken tenant or property isolation;
- treat model output as trusted executable authority.

Security reports involving prompt injection, tool misuse, unsafe action
execution, provider isolation or AI data leakage are within scope when they
produce a credible PropertyOS security impact.

---

## 18. Deployment Responsibility

PropertyOS provides software and security guidance, but each deployment remains
responsible for its operational security.

Operators should:

- apply supported security updates;
- protect administrative credentials;
- rotate secrets;
- configure access controls;
- use secure network boundaries;
- maintain backups;
- test restoration;
- monitor logs and alerts;
- review plugins and integrations;
- follow applicable privacy and regulatory requirements.

Running an unsupported or modified deployment may affect the project's ability
to investigate or remediate a vulnerability.

---

## 19. No Warranty

Security support does not create a warranty, guarantee, indemnity or
service-level commitment.

PropertyOS is provided under the terms of its open-source licence.

Commercial security services, where separately contracted, are governed by
their applicable agreement.

---

## 20. Policy Governance

This policy is governed by:

- the PropertyOS Constitution;
- `GOVERNANCE.md`;
- release governance;
- maintainer authority;
- applicable project policies.

Material amendments should be reviewed through the repository governance
process.

Security maintainers may issue temporary operational guidance during an active
incident, subject to later governance review.

---

## 21. Related Documents

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SUPPORT.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `TRADEMARKS.md`
- `NOTICE`
- `LICENSE`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
