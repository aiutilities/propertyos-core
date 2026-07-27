# PropertyOS Performance and Scale Validation

## Purpose

This directory contains the Phase 17D performance-validation contract for PropertyOS.

The contract measures the existing application. It does not redesign application modules, add instrumentation, or change the completed Prometheus and Grafana contracts.

## Initial Validation Surface

The first baseline uses the public operational endpoints:

- GET /api/v1/health
- GET /api/v1/health/live
- GET /api/v1/health/ready

These routes are read-only and require no authentication.

The readiness route exercises database and operational subsystem dependencies. The liveness route provides the lowest-cost runtime baseline.

## Execution Profile

- Target: local production build
- Default base URL: http://127.0.0.1:3000
- Override variable: PROPERTYOS_PERFORMANCE_BASE_URL
- Warm-up requests per route: 10
- Measured requests per route: 100
- Concurrency levels: 1, 5 and 10
- Request timeout: 5000 milliseconds

## Isolated Runtime Requirement

The complete performance workload exceeds the normal API rate-limit budget.

The benchmark must therefore run against a separate local production process using:

- Port: 3017
- NODE_ENV: production
- RATE_LIMIT_MAX: 5000
- RATE_LIMIT_TTL_MS: 60000

The normal development or production configuration must not be changed.

HTTP 429 responses indicate an invalid benchmark environment rather than an application latency regression.

## Measurements

Each route and concurrency level must report:

- total requests
- successful requests
- failed requests
- failure ratio
- minimum latency
- average latency
- p50 latency
- p95 latency
- p99 latency
- maximum latency
- requests per second

## Safety Rules

- The harness must use read-only routes.
- The harness must not write application or business data.
- The harness must not run against public production.
- The harness must not alter Prometheus instrumentation.
- The harness must not alter the Grafana dashboard contract.
- Threshold failures must produce a non-zero process exit code.
- Raw measurements must be reproducible from the committed contract.

## Files

- propertyos-performance-contract.json
- scripts/validate-performance-contract.py
- scripts/validate-performance-baseline.py
- scripts/run-performance-validation.mjs
- baselines/phase-17d-operational-health-baseline.json

## Current Scope

This contract establishes the initial operational baseline. Authenticated business-operation scenarios may be added only within the existing Phase 17D scope and only after deterministic test-data and authorization handling are established.

## Initial Operational Baseline

The first valid isolated production-build baseline completed successfully.

Results:

- 3 public operational routes
- 3 concurrency levels
- 30 warm-up requests
- 900 measured requests
- 900 successful responses
- 0 failed responses
- 0 environment failures
- 0 threshold failures
- all 9 route/concurrency result groups passed

The normal runtime rate limit was not changed. The baseline used the isolated runtime override defined by the committed contract.
