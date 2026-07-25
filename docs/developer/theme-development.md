# PropertyOS Theme Development Guide

This guide provides a developer-oriented overview of the existing PropertyOS
theme platform.

Themes customize presentation while preserving protected Core behaviour.

---

## 1. Theme Model

Themes may customize approved presentation areas such as:

- layout;
- typography;
- spacing;
- colour;
- icons;
- navigation presentation;
- dashboards;
- responsive behaviour;
- branding assets.

Themes must not change business authority.

---

## 2. Product-Freeze Boundary

During Repository Foundation:

- no new theme runtime behaviour is authorized;
- no new frontend route is authorized;
- no theme registry change is authorized;
- no marketplace activation is authorized;
- no Core presentation contract may be changed.

This guide documents existing capabilities only.

---

## 3. Canonical References

Begin with:

- `../../THEME_MARKETPLACE_GOVERNANCE.md`
- `../generated/modules/theme.md`
- `../release/PLATFORM_PLUGIN_THEME_CERTIFICATION.md`
- `architecture.md`
- `../../SECURITY.md`

---

## 4. Theme Identity

A theme should have a stable identifier.

The identifier should be:

- unique;
- attributable;
- versioned;
- non-deceptive;
- compatible with registry rules.

A theme must not impersonate PropertyOS Core or official status.

---

## 5. Theme Manifest

A theme manifest may identify:

- identifier;
- name;
- version;
- publisher;
- compatibility;
- supported surfaces;
- layouts;
- assets;
- design tokens;
- localization;
- licence;
- integrity metadata.

Manifest declarations must match actual package behaviour.

---

## 6. Package Structure

A theme package may contain:

- manifest;
- layouts;
- templates;
- components;
- styles;
- design tokens;
- images;
- icons;
- localization resources;
- documentation;
- integrity metadata.

Packages must not rely on undeclared local or remote files.

---

## 7. Presentation Boundary

Themes may control presentation.

Themes must not alter:

- authentication;
- authorization;
- approvals;
- validation;
- audit events;
- legal notices;
- privacy controls;
- payment state;
- security warnings;
- AI approval boundaries.

Visual customization must preserve platform meaning.

---

## 8. Supported Surfaces

A theme should declare supported surfaces.

Examples may include:

- administrator portal;
- owner portal;
- resident portal;
- tenant portal;
- staff portal;
- security portal;
- public pages;
- hospitality interfaces;
- workspace interfaces.

Do not claim support for an untested surface.

---

## 9. Layouts

Layouts should preserve:

- navigation;
- required controls;
- content regions;
- responsive behaviour;
- accessibility landmarks;
- loading states;
- error states;
- empty states;
- fallback behaviour.

A layout must not hide required actions for visual simplicity.

---

## 10. Components

Theme components should:

- use approved public contracts;
- preserve input behaviour;
- preserve output behaviour;
- support keyboard interaction;
- expose meaningful labels;
- preserve validation;
- preserve errors;
- preserve focus.

Components must not silently replace governed Core actions.

---

## 11. Design Tokens

Themes may define tokens for:

- colour;
- typography;
- spacing;
- borders;
- shadows;
- radius;
- elevation;
- icons;
- motion;
- responsive breakpoints.

Critical system states must remain distinguishable.

---

## 12. Accessibility

Themes should preserve:

- keyboard navigation;
- focus order;
- focus visibility;
- semantic structure;
- labels;
- headings;
- contrast;
- error identification;
- status announcements;
- reduced motion;
- zoom behaviour.

Essential workflows must remain accessible.

---

## 13. Colour and Contrast

Theme colour systems should preserve:

- readable text;
- visible controls;
- visible focus;
- errors;
- warnings;
- success states;
- disabled states;
- charts;
- financial states.

Information must not depend on colour alone.

---

## 14. Typography

Typography should support:

- readability;
- hierarchy;
- responsive scaling;
- long-form content;
- forms;
- localization;
- status displays.

Typography must not obscure important information.

---

## 15. Responsive Behaviour

Responsive validation may include:

- navigation;
- forms;
- tables;
- dialogs;
- dashboards;
- charts;
- long text;
- touch targets;
- overflow;
- rotation.

Required functionality must remain available.

---

## 16. Localization

Themes should support:

- translated text expansion;
- right-to-left layouts;
- date and time presentation;
- currency presentation;
- pluralization;
- locale typography;
- fallback language;
- localized labels.

Avoid hard-coded user-facing text where platform localization is expected.

---

## 17. Forms

Themes must preserve:

- labels;
- descriptions;
- required indicators;
- validation errors;
- server errors;
- disabled states;
- loading states;
- confirmation;
- keyboard operation;
- focus management.

A theme must not reinterpret validation results.

---

## 18. Tables and Data

Tables and data displays should preserve:

- headings;
- sorting;
- filtering;
- pagination;
- selection;
- empty states;
- loading;
- errors;
- accessible alternatives.

Dense data must remain understandable on supported screens.

---

## 19. Status Representation

Themes should clearly distinguish:

- active;
- inactive;
- pending;
- approved;
- rejected;
- suspended;
- revoked;
- failed;
- warning;
- complete.

A visual state must match the underlying platform state.

---

## 20. Financial Interfaces

Financial interfaces must preserve:

- currency;
- amount precision;
- debit and credit distinction;
- due state;
- payment state;
- refund state;
- invoice identity;
- receipt identity;
- confirmation state.

A theme must not visually imply completion when processing is incomplete.

---

## 21. Security-Sensitive Interfaces

Enhanced review is appropriate for:

- sign-in;
- credentials;
- permissions;
- access control;
- recovery;
- security warnings;
- audit views;
- plugin and theme trust;
- AI authorization;
- deployment approval.

Security consequences must remain visible.

---

## 22. Remote Assets

Remote assets must be declared.

Examples include:

- fonts;
- images;
- styles;
- scripts;
- analytics;
- trackers;
- content-delivery networks.

Undisclosed remote execution or tracking is prohibited.

---

## 23. Scripts

Theme scripts should be avoided unless explicitly supported.

Where permitted, scripts must be:

- declared;
- reviewable;
- presentational;
- free of credential handling;
- free of authorization bypass;
- free of hidden network access;
- free of business-rule replacement.

Obfuscated scripts may be rejected.

---

## 24. Installation

Theme installation should preserve:

- package validation;
- compatibility;
- registry integrity;
- fallback availability;
- administrator authorization;
- audit records;
- recovery from failure.

Marketplace publication does not automatically install a theme.

---

## 25. Activation

Activation should require:

- installed package;
- compatible version;
- valid registry state;
- approved operator;
- fallback theme availability.

Activation must remain recoverable and auditable.

---

## 26. Update

A theme update should include:

- new immutable version;
- compatibility changes;
- layout changes;
- asset changes;
- accessibility impact;
- branding changes;
- security impact;
- release notes.

Earlier approval does not automatically approve later versions.

---

## 27. Fallback

A safe fallback theme should remain available.

Fallback may be required when:

- activation fails;
- compatibility fails;
- assets are unavailable;
- accessibility is materially broken;
- a theme is suspended;
- a theme is revoked;
- security containment is authorized.

Fallback must preserve essential platform access.

---

## 28. Testing

Theme testing may include:

- manifest validation;
- package validation;
- compatibility;
- layout rendering;
- responsive behaviour;
- accessibility;
- localization;
- browser support;
- activation;
- fallback;
- security-sensitive surfaces;
- financial interfaces.

Test scope should match declared support.

---

## 29. Marketplace Publication

Marketplace publication follows
`../../THEME_MARKETPLACE_GOVERNANCE.md`.

Publication may require:

- publisher trust;
- package integrity;
- compatibility evidence;
- accessibility review;
- security review;
- branding review;
- certification;
- human approval.

Publication does not automatically activate a theme.

---

## 30. Branding

Themes must comply with `../../TRADEMARKS.md`.

A theme must not imply official, certified or endorsed status unless that
status has been explicitly granted.

---

## 31. Security

Themes must not:

- bypass authorization;
- hide warnings;
- embed credentials;
- inject unsafe remote content;
- collect undisclosed data;
- replace business rules;
- change protected state;
- misrepresent approval or payment status.

Security reports must follow `../../SECURITY.md`.

---

## 32. Contribution

Theme runtime or registry changes require explicit authorization.

Documentation and examples should clarify existing contracts without silently
redefining them.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
