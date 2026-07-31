# Founder Visual Audit — Wave 1 Findings

## Review Context

- Review date: 31 July 2026
- Pilot property: Advaith Nest
- Frontend: `http://localhost:3002`
- API: `http://localhost:3001/api/v1`
- Review scope: platform entry, authentication, dashboard and Property setup
  journey

## Executive Assessment

The reviewed screens demonstrate a strong and consistent visual system.

Typography, spacing, forms, navigation, buttons and the administrative shell
already provide a credible enterprise-product appearance.

The Wave 1 blockers are concentrated in session handling, API error
presentation and Property data binding rather than visual design.

## Primary Cross-Cutting Finding

The browser displays an authenticated administrator shell while protected API
requests return:

`401 Unauthorized — Invalid token`

This produces an inconsistent session state:

1. the local browser session appears authenticated;
2. protected pages remain visible;
3. API requests fail;
4. raw API JSON is displayed inside the product;
5. the user is not redirected to the login page.

A rejected or expired token must invalidate the browser session, clear stored
authentication state and redirect the user to login with a safe message.

Raw backend error payloads must never be shown directly to an end user.

## Route Findings

### `/`

**Status:** Needs Polish
**Score:** 3.5/5

Strengths:

- clean visual composition;
- clear product statement;
- obvious entry actions;
- professional typography.

Gaps:

- limited explanation of supported property types;
- no visible plugin, marketplace, documentation or community story;
- both primary buttons have similar visual weight and overlapping intent.

### `/login`

**Status:** Production Ready
**Score:** 4.5/5

Strengths:

- simple and focused;
- fields begin empty;
- clear hierarchy;
- professional styling.

Revalidation still required for:

- invalid-credential feedback;
- expired-session messaging;
- successful redirect.

### `/dashboard`

**Status:** Production Ready
**Score:** 4.3/5

Strengths:

- strong command-centre presentation;
- priorities and exceptions precede analytics;
- useful quick actions;
- clear enterprise hierarchy.

Observation:

- the displayed portfolio count should later be validated against test-data
  volume and pilot expectations.

### `/properties`

**Status:** Pilot Blocker
**Score:** 1.5/5

The shell and search controls load, but the list request fails with
`401 Invalid token`.

The complete backend payload is displayed as raw JSON.

Required behavior:

- clear invalid session;
- redirect to login;
- show a human-readable session-expired message;
- never render raw transport errors.

### `/properties/new`

**Status:** Pilot Blocker
**Score:** 3.0/5

Improvements visible from the earlier audit:

- semantic Property setup introduction;
- required-field guidance;
- Cancel action;
- clearer section hierarchy.

Remaining blocker:

- the sticky action bar overlays form content during scrolling.

### `/properties/[id]`

**Status:** Broken
**Score:** 1.0/5

The page shell and title load, but no Property content, loading state, empty
state or safe error state appears.

The page is not usable for pilot review.

### `/properties/[id]/edit`

**Status:** Pilot Blocker
**Score:** 2.0/5

The edit form renders, but existing Property values are not populated.

The page visually resembles a create form and could overwrite data if a user
submits without recognising the failed prefill.

### `/properties/[id]/zones`

**Status:** Broken
**Score:** 1.0/5

The page renders raw `401 Invalid token` JSON.

No safe error state, login redirect or retry action is provided.

### `/properties/[id]/zones/new`

**Status:** Needs Polish
**Score:** 3.5/5

Strengths:

- clean and understandable form;
- concise field set;
- clear primary action.

Gaps:

- no Cancel or Back action;
- no breadcrumb or Property context;
- required and optional fields are not clearly distinguished.

### `/properties/[id]/spaces`

**Status:** Broken
**Score:** 1.0/5

The page renders raw `401 Invalid token` JSON.

No safe error state, login redirect or retry action is provided.

### `/properties/[id]/spaces/new`

**Status:** Needs Polish
**Score:** 3.5/5

Strengths:

- clean form layout;
- logical field sequence;
- clear primary action.

Gaps:

- Zone ID requires technical knowledge instead of offering a Zone selector;
- no Cancel or Back action;
- no breadcrumb or Property context;
- required fields are not clearly identified.

## Defect Priorities

### P1 — Pilot blockers

1. Invalid-token responses do not terminate the client session.
2. Raw API error JSON is rendered in protected pages.
3. Property details do not render data or a safe failure state.
4. Edit Property does not populate existing values.
5. Zone and Space list pages fail under an invalid session.
6. Sticky Property form actions obscure content.

### P2 — Significant usability issues

1. Create Zone lacks contextual navigation and field guidance.
2. Create Space exposes a raw Zone ID rather than a user-facing selector.
3. Property-related pages lack a consistent breadcrumb and Property context.
4. Protected pages lack consistent loading, empty and retry states.

## Wave 1 Decision

Visual direction: **Approved**

Functional pilot readiness: **Not approved**

Remediation must begin with the shared authentication and API error-handling
contract before individual Property pages are corrected.
