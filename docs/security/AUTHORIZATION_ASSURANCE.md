# Authorization Assurance

## Purpose

PropertyOS authorization assurance provides a deterministic repository-level validation of controller authorization declarations.

## Commands

Generate reports:

    cd backend
    npm run knowledge:authorization

Verify reports and fail on blocking violations:

    cd backend
    npm run knowledge:authorization:check

Run directly:

    python3 -m tools.knowledge_engine.authorization_cli --check

Verify committed reports:

    python3 -m tools.knowledge_engine.authorization_cli --verify-generated

## Generated Reports

generated/knowledge/authorization-report.json

generated/knowledge/authorization-report.md

## Endpoint Classifications

Public
- Uses @Public()
- Must not also declare @RequirePermission(...)

Authenticated
- Requires authentication
- No explicit permission
- Governance finding only

Permission Protected
- Declares @RequirePermission(...)
- Requires JwtAuthGuard
- Requires PermissionGuard
- Requires @ApiBearerAuth()

## Blocking Violations

- Duplicate permission values
- Undefined permission references
- Missing JwtAuthGuard
- Missing PermissionGuard
- Missing @ApiBearerAuth()
- Public endpoint declaring permissions

## Governance Findings

Currently non-blocking:

- Unused permission definitions
- Authenticated-only endpoints

## Determinism

Generated JSON and Markdown reports must be deterministic.

The verification command compares committed reports with freshly generated output.

## Baseline

Controllers: 62

Endpoints: 460

Permission definitions: 55

Blocking violations: 0

Unused permission definitions: 13

## CI

Run:

    cd backend
    npm run knowledge:authorization:check

This validates authorization policy and verifies generated reports are current.
