# Identity, Authentication and Authorization Certification Evidence

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD: `d1244194eff640f46aff00271e461ffba9df2112`

## Scope

- Identity
- Authentication
- Authorization
- Access control
- Credential handling

## Identity files

- `backend/src/core/identity/controllers/identity.controller.ts`
- `backend/src/core/identity/dto/create-organization.dto.ts`
- `backend/src/core/identity/dto/create-permission.dto.ts`
- `backend/src/core/identity/dto/create-person.dto.ts`
- `backend/src/core/identity/dto/create-role.dto.ts`
- `backend/src/core/identity/identity.module.ts`
- `backend/src/core/identity/repositories/identity-repository.interface.ts`
- `backend/src/core/identity/repositories/identity.repository.ts`
- `backend/src/core/identity/repositories/postgres-identity.repository.ts`
- `backend/src/core/identity/services/identity.service.ts`
- `backend/src/core/identity/types/identity.types.ts`
- `backend/src/core/identity/types/permission.types.ts`
- `backend/src/core/identity/types/person-role.types.ts`
- `backend/src/core/identity/types/role-permission.types.ts`

## Authentication files

- `backend/src/core/auth/auth.controller.ts`
- `backend/src/core/auth/auth.module.ts`
- `backend/src/core/auth/constants/permissions.ts`
- `backend/src/core/auth/decorators/current-user.decorator.ts`
- `backend/src/core/auth/decorators/public.decorator.ts`
- `backend/src/core/auth/decorators/require-permission.decorator.ts`
- `backend/src/core/auth/dto/login.dto.ts`
- `backend/src/core/auth/global-auth-wiring.integration-spec.ts`
- `backend/src/core/auth/guards/global-auth-guard-contract.integration-spec.ts`
- `backend/src/core/auth/guards/jwt-auth.guard.ts`
- `backend/src/core/auth/guards/permission.guard.ts`
- `backend/src/core/auth/guards/platform-permission-coverage.integration-spec.ts`
- `backend/src/core/auth/services/auth.service.ts`
- `backend/src/core/auth/types/auth-request.type.ts`

## Authorization files

- `backend/src/core/authorization/authorization.module.ts`
- `backend/src/core/authorization/services/authorization.service.ts`
- `backend/src/core/authorization/types/authorization.types.ts`

## Integration-test files

- `backend/src/core/access-control/services/access-control-credential-evaluation.integration-spec.ts`
- `backend/src/core/ai/credentials/environment-ai-provider-credential-resolver.service.integration-spec.ts`
- `backend/src/core/auth/global-auth-wiring.integration-spec.ts`
- `backend/src/core/auth/guards/global-auth-guard-contract.integration-spec.ts`
- `backend/src/core/auth/guards/platform-permission-coverage.integration-spec.ts`
- `backend/src/database/runner/access-control-credential-migration.integration-spec.ts`
- `backend/tests/integration/auth.integration-spec.ts`
- `backend/tests/integration/identity.integration-spec.ts`

## Verification

- Targeted integration tests: PASSED
- Backend build: PASSED
- Full backend regression baseline: 294 suites / 2069 tests passed

## Certification decision

Status: PENDING MANUAL EVIDENCE REVIEW
