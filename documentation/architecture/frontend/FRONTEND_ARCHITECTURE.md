# Frontend Architecture

## Layered Model

```text
Browser
  ↓
Application Shell
  ↓
Protected Route
  ↓
Feature Page
  ↓
Feature Hook / Repository
  ↓
API Client
  ↓
Session and Authentication Manager
  ↓
Notification and Error Presentation
  ↓
Fetch / Browser Runtime
```

## Rules

- Feature pages must not call `fetch()` directly.
- Feature hooks must not independently clear sessions or redirect to login.
- The API client must never throw raw response bodies.
- Authentication failures are handled centrally.
- Every data screen distinguishes loading, empty, error and success states.
- Technical details may be logged in development but must not appear in the UI.

## Reuse Target

This architecture is intended for PropertyOS, FoodOS, BankOps, LegalOS and future Cogzidel platforms.
