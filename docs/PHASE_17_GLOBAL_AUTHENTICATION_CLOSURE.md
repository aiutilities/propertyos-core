# Phase 17 — Global Authentication Closure

## Status

Phase 17 global authentication rollout is complete and validated.

## Objective

Establish authentication as a platform-wide default so that HTTP endpoints are
protected unless deliberately and explicitly classified as public.

## Security model

PropertyOS now applies the following guards globally through NestJS `APP_GUARD`
registration:

1. `JwtAuthGuard`
2. `PermissionGuard`

The JWT guard evaluates public-route metadata before requiring a bearer token.
Routes without public metadata require a valid authenticated request.

The permission guard remains responsible for evaluating permission metadata
where such metadata is declared.

## Explicit public surface

The following endpoint groups are intentionally public:

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/auth/login` | Authenticate a user and obtain an access token |
| `/api/v1/bootstrap/*` | Support initial platform bootstrap |
| `GET /api/v1/health` | Support health and readiness monitoring |

Public classification is expressed through the `@Public()` decorator rather
than through omission of controller guards.

All other routes inherit global authentication protection.

## Implementation

The rollout includes:

- Global registration of JWT and permission guards.
- Public-route metadata and the `@Public()` decorator.
- Public-route bypass handling in `JwtAuthGuard`.
- Explicit public classification for login, bootstrap, and health.
- Authentication-module availability for the AI module.
- Static global-auth wiring contract tests.
- JWT/public-route guard contract tests.
- Shared authenticated integration-test provisioning.
- Authentication updates to affected Search, Configuration, Plugin,
  Marketplace, Plugin Package, Theme, and Theme Package integration suites.

## Integration-test authentication

Authenticated integration suites provision an isolated administrative user,
log in through the normal authentication endpoint, use the returned bearer
token, and clean up the provisioned identity records after execution.

This preserves production-equivalent authentication behavior instead of
bypassing the global guard during integration testing.

## Verification evidence

### Targeted authentication remediation

- Test suites: 2 passed
- Tests: 10 passed
- Search integration: passed
- Configuration integration: passed

### Complete backend regression

- Test suites: 209 passed
- Tests: 1785 passed
- Snapshots: 0
- TypeScript build before regression: passed
- TypeScript build after regression: passed

### Release audit

- Expected branch: `feature/v3-documentation`
- Expected baseline HEAD:
  `c4bc5d3df689563166af0182921d8f8179dfc151`
- Branch validation: passed
- HEAD validation: passed
- Diff validation: passed
- Controller files audited: 62
- Explicit public endpoint groups: 3
- Source migrations added or applied: none
- Production data mutation: none

## Security conclusions

1. Authentication is now deny-by-default at the platform HTTP boundary.
2. Public access requires explicit metadata.
3. Login remains reachable without an existing token.
4. Bootstrap remains reachable for initial installation.
5. Health remains reachable for infrastructure monitoring.
6. Existing authenticated business APIs continue to pass regression testing.
7. No database schema migration was needed for this rollout.

## Release state

Phase 17 implementation and regression validation are complete.

The repository is ready for final release-candidate verification, commit, and
tag creation, provided the final changed-file scope remains unchanged.
