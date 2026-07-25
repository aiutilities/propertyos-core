# PropertyOS Website Information Architecture

This document defines the public information architecture for the future
PropertyOS website.

It does not implement or modify the PropertyOS product frontend.

---

## 1. Website Objective

The website should help visitors understand:

- what PropertyOS is;
- who it is for;
- what is available today;
- how to install it;
- how to evaluate it;
- how to contribute;
- how to extend it;
- how the project is governed;
- where to obtain support;
- how to report security issues.

The website must distinguish released capabilities from roadmap work.

---

## 2. Primary Navigation

Recommended primary navigation:

1. Product
2. Solutions
3. Developers
4. Documentation
5. Ecosystem
6. Downloads
7. Community
8. Governance

Persistent utility links may include:

- GitHub;
- current release;
- security;
- support;
- search.

---

## 3. Home

The Home page should provide:

- official positioning;
- vision;
- primary value proposition;
- major platform capabilities;
- architecture principles;
- extension ecosystem;
- AI-native positioning;
- open-source licence;
- current stable release;
- primary calls to action.

Recommended calls to action:

- Explore PropertyOS;
- Read the documentation;
- View the source;
- Download the current release;
- Join the community.

The Home page must not claim unavailable hosted services or marketplaces.

---

## 4. Product

The Product section should explain the complete platform.

Suggested pages:

- Product Overview
- Core Platform
- Property Operations
- Workspace Operations
- Hospitality Operations
- Platform Services
- AI Runtime
- Plugin System
- Theme System
- Security and Governance

Product pages should link to certified release evidence where appropriate.

---

## 5. Solutions

Solutions organize capabilities by audience or operating context.

Suggested pages:

- Residential Communities
- Rental Properties
- Co-living and Hostels
- Commercial Workspaces
- Hospitality
- Facility Operations
- Property Owners
- Property Operators
- Developers and System Integrators

Solutions pages must not imply separate product editions unless such editions
actually exist.

---

## 6. Developers

The Developers section should use:

- `DEVELOPER_PORTAL.md`;
- `docs/developer/README.md`;
- existing SDK documentation;
- existing architecture documentation.

Suggested pages:

- Developer Overview
- Getting Started
- Architecture
- API and Events
- Plugin Development
- Theme Development
- AI Development
- Contribution Guide

The public website should link to canonical repository documents until a
separate documentation renderer is approved.

---

## 7. Documentation

The Documentation section should organize:

- installation;
- configuration;
- administration;
- deployment;
- operations;
- architecture;
- generated module documentation;
- developer guides;
- governance;
- release evidence;
- troubleshooting.

Documentation should identify its intended audience and applicable version.

---

## 8. Ecosystem

The Ecosystem section should explain:

- plugins;
- themes;
- AI providers;
- AI specialists;
- SDKs;
- certification;
- future marketplaces.

Suggested pages:

- Ecosystem Overview
- Plugin Ecosystem
- Theme Ecosystem
- AI Ecosystem
- Certification
- Publishing Requirements
- Compatibility

Future marketplaces must be labelled as planned until operational.

---

## 9. Downloads

The Downloads section should provide trusted paths to:

- GitHub releases;
- source archives;
- container images when published;
- checksums;
- release notes;
- release manifests;
- installation instructions;
- upgrade guidance;
- compatibility information.

Every artifact should be traceable to an official release.

Unsigned or unverifiable artifacts must not be presented as official downloads.

---

## 10. Community

The Community section should route visitors to:

- GitHub Discussions;
- GitHub Issues;
- contribution guidance;
- Code of Conduct;
- support guidance;
- roadmap;
- announcements;
- architecture discussions;
- plugin discussions;
- theme discussions;
- AI discussions.

Security vulnerabilities must not be routed to public community channels.

---

## 11. Governance

The Governance section should link to:

- Constitution;
- Manifesto;
- Governance;
- Maintainers;
- Contribution Guide;
- Code of Conduct;
- Security Policy;
- Support Policy;
- Release Governance;
- Plugin Marketplace Governance;
- Theme Marketplace Governance;
- AI Ecosystem Governance;
- Trademark Policy;
- Roadmap;
- Changelog.

Governance documents should remain accessible without registration.

---

## 12. Security and Support

The Security page should provide:

- private vulnerability-reporting guidance;
- supported-version information;
- disclosure expectations;
- deployment responsibilities;
- links to `SECURITY.md`.

The Support page should distinguish:

- community support;
- bug reports;
- feature requests;
- documentation questions;
- security reporting;
- commercial support where separately offered.

The pages must align with `SECURITY.md` and `SUPPORT.md`.

---

## 13. Roadmap

The Roadmap page should be based on `ROADMAP.md`.

It should distinguish:

- completed;
- in progress;
- near term;
- mid term;
- long term;
- ecosystem plans.

Roadmap content must not be represented as a release commitment.

---

## 14. Releases

The Releases section should include:

- current stable release;
- previous releases;
- release notes;
- changelog;
- manifests;
- certification;
- checksums;
- known limitations;
- upgrade guidance.

Release status must align with `RELEASE_GOVERNANCE.md`.

---

## 15. Search

Website search should cover:

- product pages;
- documentation;
- developer guides;
- governance;
- releases;
- ecosystem material.

Search results should identify content type and version where practical.

Search implementation is outside Repository Foundation.

---

## 16. Footer

The footer should include:

- Project;
- Developers;
- Documentation;
- Community;
- Governance;
- Security;
- Support;
- Releases;
- Licence;
- Trademark notice;
- Stewardship attribution.

The footer should state that PropertyOS is created, maintained and stewarded
by Cogzidel Technologies Pvt. Ltd.

---

## 17. URL Structure

Recommended public paths include:

- `/`
- `/product/`
- `/solutions/`
- `/developers/`
- `/docs/`
- `/ecosystem/`
- `/downloads/`
- `/community/`
- `/governance/`
- `/security/`
- `/support/`
- `/roadmap/`
- `/releases/`

URLs should use stable and readable slugs.

Implementation-specific route names should not become public URL contracts.

---

## 18. Content Ownership

Website content ownership should follow `MAINTAINERS.md`.

Typical ownership includes:

- product positioning — Project Steward;
- architecture — Architecture Maintainers;
- developer content — Documentation and SDK Maintainers;
- security — Security Maintainers;
- releases — Release Maintainers;
- plugins — Plugin Maintainers;
- themes — Theme Maintainers;
- AI — AI Maintainers;
- governance — Project Steward and Governance Maintainers.

Content changes should receive review from the relevant owner.

---

## 19. Version Labelling

Technical pages should identify version scope where relevant.

Recommended labels:

- Current stable
- Historical
- Unreleased
- Proposed
- Experimental
- Deprecated

Unreleased and proposed content must remain clearly distinct from stable
documentation.

Historical pages must identify the applicable release.

---

## 20. Accessibility

The future website should support:

- keyboard navigation;
- visible focus;
- semantic headings;
- sufficient contrast;
- meaningful links;
- alternative text;
- responsive content;
- reduced motion;
- accessible forms.

Accessibility applies to implementation, not only documentation.

Critical content must remain usable without relying only on colour, animation
or pointer interaction.

---

## 21. Performance

The future website should prioritize:

- static delivery where practical;
- minimal client-side JavaScript;
- optimized media;
- predictable navigation;
- fast documentation access;
- resilient external links.

Performance should not be sacrificed for decorative complexity.

---

## 22. Privacy

The public website should minimize data collection.

Analytics, if approved, should be:

- disclosed;
- privacy-conscious;
- limited;
- non-essential;
- governed by an approved privacy policy.

Documentation and downloads should not require unnecessary tracking.

---

## 23. Deployment Separation

The public project website should remain operationally separate from the
PropertyOS product application.

Website deployment must not:

- share production application credentials;
- alter product routes;
- depend on private product APIs;
- weaken product availability;
- modify product release artifacts;
- become an administrative control plane.

---

## 24. Product-Freeze Boundary

During Repository Foundation:

- this information architecture remains documentation only;
- no product frontend route is added;
- no backend endpoint is added;
- no website runtime is deployed;
- no domain configuration is changed;
- no analytics are enabled;
- no external service is activated.

Implementation requires separate authorization.

---

## 25. Related Documents

- `../../WEBSITE.md`
- `README.md`
- `../../DEVELOPER_PORTAL.md`
- `../developer/README.md`
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
