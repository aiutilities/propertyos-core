# PropertyOS Post-Deployment Checklist

## Deployment Identity

- [ ] Deployed release commit is recorded.
- [ ] Backend artifact identity is recorded.
- [ ] Scheduler artifact identity is recorded.
- [ ] Frontend artifact identity is recorded.
- [ ] Container image digests are recorded.
- [ ] Deployment completion time is recorded.

## Runtime Validation

- [ ] Backend process is running.
- [ ] Scheduler process is running.
- [ ] Frontend process is running.
- [ ] PostgreSQL is reachable.
- [ ] Liveness returns HTTP 200.
- [ ] Readiness returns HTTP 200.
- [ ] Readiness status equals ok.
- [ ] No failed plugins are reported.

## Subsystem Validation

- [ ] Database readiness check is ok.
- [ ] Scheduler readiness check is ok.
- [ ] Storage readiness check is ok.
- [ ] Event-bus readiness check is ok.
- [ ] Workflow readiness check is ok.
- [ ] Plugin readiness check is ok.

## Monitoring

- [ ] Prometheus is scraping the API.
- [ ] Recording rules are loaded.
- [ ] Alert rules are loaded.
- [ ] Grafana datasource is healthy.
- [ ] Grafana dashboard loads.
- [ ] Incident monitor is active.
- [ ] No unexpected critical alert is firing.

## Controlled Smoke Validation

- [ ] Authentication smoke test passes.
- [ ] Read-only platform smoke test passes.
- [ ] Approved business-operation smoke test passes.
- [ ] Scheduler execution smoke test passes.
- [ ] No duplicate mutation is observed.
- [ ] No unexpected error spike is observed.

## Evidence and Decision

- [ ] Logs are preserved.
- [ ] Health responses are preserved.
- [ ] Monitoring screenshots or references are preserved.
- [ ] Deployment owner reviewed the evidence.
- [ ] Rollback decision is recorded.
- [ ] Production traffic decision is recorded.

## Failure Gate

If any required check fails:

- [ ] Stop rollout.
- [ ] Restrict user exposure.
- [ ] Preserve evidence.
- [ ] Follow rollback or incident runbook.

## Safety Boundary

This checklist does not authorize rollback, reverse migration, database restore, data deletion or destructive infrastructure action.
