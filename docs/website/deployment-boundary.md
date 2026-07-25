# PropertyOS Website Deployment Boundary

This document defines the operational boundary between the future public
PropertyOS website and the PropertyOS product platform.

It does not authorize website deployment.

---

## 1. Separation Principle

The public website must remain operationally separate from the PropertyOS
application.

Separation protects:

- product availability;
- product credentials;
- product data;
- release integrity;
- administrative controls;
- deployment independence;
- security boundaries.

The website must not become part of the product control plane.

---

## 2. Repository Boundary

Repository Foundation may document the website inside the PropertyOS
repository.

Documentation may include:

- information architecture;
- content plan;
- deployment policy;
- branding guidance;
- navigation;
- release links;
- governance links.

Website runtime implementation requires separate authorization.

---

## 3. Product Frontend Boundary

The current `frontend/` directory belongs to the PropertyOS product.

The public website must not be implemented by modifying product frontend routes
during Repository Foundation.

In particular, this phase must not:

- replace the product home page;
- change product authentication;
- add public marketing routes;
- change product navigation;
- change documentation runtime routes;
- change product styles;
- add website analytics.

---

## 4. Backend Boundary

The website must not depend on private backend services.

The website must not:

- use administrative APIs;
- access private tenant data;
- access property data;
- access private configuration;
- share backend credentials;
- trigger product mutations;
- bypass authentication;
- expose internal endpoints.

Public release metadata may be sourced from approved public artifacts.

---

## 5. Credential Separation

Website credentials must remain separate from product credentials.

The website must not share:

- database credentials;
- application secrets;
- encryption keys;
- provider credentials;
- deployment tokens;
- administrative tokens;
- signing keys;
- marketplace credentials.

Credential ownership and rotation must remain explicit.

---

## 6. Data Boundary

The public website should use only approved public information.

Permitted public information may include:

- product positioning;
- public documentation;
- public release metadata;
- public governance;
- public roadmap;
- public community links;
- approved screenshots;
- approved case studies.

The website must not access private customer or deployment data.

---

## 7. Release Artifact Boundary

Website download links must point to approved release artifacts.

Official artifacts should be traceable to:

- a release tag;
- a release commit;
- release notes;
- a release manifest;
- checksums;
- certification evidence.

The website must not rebuild or alter product release packages.

---

## 8. Domain Boundary

Future domain configuration should remain separate from product deployment.

Domain work may include:

- `propertyos.org`;
- documentation subdomains;
- download subdomains;
- community links;
- release links.

Repository Foundation does not authorize:

- DNS changes;
- certificate issuance;
- production hosting;
- redirects;
- domain analytics;
- email configuration.

---

## 9. Hosting Boundary

Future website hosting should be independently deployable.

Hosting should support:

- static delivery where practical;
- versioned deployments;
- rollback;
- secure transport;
- cache control;
- accessibility;
- performance;
- operational monitoring.

Website hosting must not require access to the product database.

---

## 10. Documentation Hosting

Documentation may initially remain repository-hosted.

A future documentation site may render:

- developer guides;
- architecture;
- generated module documentation;
- governance;
- releases;
- certification;
- support material.

Rendered documentation must preserve links to canonical repository sources.

---

## 11. Download Delivery

Official downloads should be delivered through approved release channels.

Download delivery must preserve:

- artifact identity;
- release version;
- checksums;
- release notes;
- release manifest;
- source attribution;
- licence information;
- integrity verification.

The website must not silently replace or repackage official artifacts.

---

## 12. Community Integration

The website may link to approved public community channels.

Community integration may include:

- GitHub Discussions;
- GitHub Issues;
- contribution guidance;
- release announcements;
- roadmap information;
- support guidance.

The website must not expose private moderation or administrative credentials.

---

## 13. Security Boundary

Website security controls should include:

- secure transport;
- dependency review;
- content integrity;
- controlled deployment;
- credential isolation;
- access logging where appropriate;
- rollback capability;
- incident response.

A website compromise must not provide access to the PropertyOS product runtime.

---

## 14. Analytics Boundary

Analytics must remain optional and separately governed.

Analytics must not:

- collect product tenant data;
- access private application events;
- require product credentials;
- track documentation users unnecessarily;
- expose confidential information;
- become required for access to downloads or documentation.

Repository Foundation does not authorize analytics deployment.

---

## 15. Operational Ownership

Website operations should have explicitly assigned ownership.

Operational responsibilities may include:

- hosting;
- deployments;
- domain management;
- certificates;
- monitoring;
- content publication;
- incident response;
- rollback;
- security updates.

Ownership should align with `MAINTAINERS.md` and future deployment governance.

---

## 16. Deployment Approval

Website deployment requires explicit authorization.

Approval should identify:

- target environment;
- source commit;
- deployment artifact;
- hosting destination;
- domain scope;
- responsible operator;
- rollback plan;
- validation evidence.

Repository documentation alone does not authorize deployment.

---

## 17. Release Independence

Website releases should remain independent from PropertyOS product releases.

A website release may publish:

- content updates;
- navigation changes;
- documentation rendering;
- release links;
- governance links;
- approved visual assets.

A website release must not change product runtime behaviour.

---

## 18. Rollback

Website deployment should support rollback.

Rollback planning should preserve:

- prior deployable artifact;
- prior content state;
- prior configuration;
- certificate continuity;
- domain continuity;
- incident evidence;
- operator accountability.

Rollback must not require access to private product data.

---

## 19. Incident Response

Website incidents may include:

- unavailable pages;
- compromised content;
- malicious redirects;
- broken downloads;
- incorrect release links;
- credential exposure;
- domain compromise;
- certificate failure.

Website incidents should be contained without disrupting the product runtime.

---

## 20. Product-Freeze Boundary

During Repository Foundation:

- no website runtime is deployed;
- no public domain is configured;
- no product frontend is modified;
- no backend service is modified;
- no private API is exposed;
- no analytics service is enabled;
- no release artifact is repackaged;
- no external website credential is created.

This document defines deployment boundaries only.

---

## 21. Related Documents

- `../../WEBSITE.md`
- `README.md`
- `information-architecture.md`
- `content-plan.md`
- `../../DEVELOPER_PORTAL.md`
- `../../ROADMAP.md`
- `../../GOVERNANCE.md`
- `../../MAINTAINERS.md`
- `../../SECURITY.md`
- `../../SUPPORT.md`
- `../../RELEASE_GOVERNANCE.md`
- `../../TRADEMARKS.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
