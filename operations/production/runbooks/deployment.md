# PropertyOS Production Deployment Runbook

## Purpose

Deploy an approved PropertyOS release using the existing production-safety, migration-governance and observability contracts.

## Preconditions

- Explicit human production authorization is recorded.
- Release commit and artifact digests are approved.
- Repository is clean.
- Production environment validation passes.
- Database connectivity passes.
- Backup evidence is current.
- Restore evidence is current.
- Previous deployable artifact is available.
- Migration static preflight passes.
- Migration database preflight passes.
- Rollback plan is documented.
- Monitoring and alerting contracts are available.

## Deployment Sequence

1. Record the approved release commit.
2. Record backend, frontend and container artifact digests.
3. Confirm the previous artifact remains available.
4. Create and verify database backup evidence.
5. Preserve production configuration evidence without secret values.
6. Run migration static preflight.
7. Run migration database preflight.
8. Obtain separate migration execution authorization when required.
9. Build or retrieve approved immutable artifacts.
10. Stop application processes using the shutdown runbook.
11. Apply only explicitly authorized migrations.
12. Deploy the approved backend artifact.
13. Deploy the approved scheduler artifact.
14. Deploy the approved frontend artifact.
15. Start services using the startup runbook.
16. Verify liveness.
17. Verify readiness.
18. Verify Prometheus scraping.
19. Verify Grafana dashboards.
20. Verify alert rules.
21. Perform controlled smoke validation.
22. Record deployment evidence.

## Acceptance Gates

Deployment succeeds only when:

- liveness returns HTTP 200
- readiness returns HTTP 200
- readiness status equals ok
- no readiness subsystem is degraded
- no failed plugins are reported
- database schema matches the approved state
- monitoring data is visible
- alert rules are loaded
- controlled smoke validation passes

## Failure Handling

If any gate fails:

- stop rollout
- do not expose the deployment to users
- preserve logs and evidence
- classify database compatibility
- invoke the rollback runbook when safe
- invoke the incident runbook when rollback safety is uncertain

## Safety Boundary

This runbook does not itself authorize deployment, migration execution, database mutation, secret disclosure or destructive rollback.
