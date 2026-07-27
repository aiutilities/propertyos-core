# PropertyOS Pre-Deployment Checklist

## Authorization

- [ ] Explicit human production authorization is recorded.
- [ ] Approved release commit is recorded.
- [ ] Deployment owner is identified.
- [ ] Maintenance window is confirmed.
- [ ] Production traffic exposure decision is recorded.

## Repository and Artifacts

- [ ] Repository is on the approved branch.
- [ ] Repository HEAD matches the approved release commit.
- [ ] Working tree is clean.
- [ ] Backend production build passes.
- [ ] Frontend production build passes.
- [ ] Scheduler production artifact exists.
- [ ] Docker image digest is recorded.
- [ ] Previous deployable artifact remains available.

## Environment

- [ ] NODE_ENV is production.
- [ ] Required PostgreSQL variables are present.
- [ ] AUTH_SECRET is present and at least 32 characters.
- [ ] Secret values are supplied outside version control.
- [ ] CORS_ORIGIN is explicit.
- [ ] Storage paths are available.
- [ ] Scheduler configuration is validated.

## Database and Migrations

- [ ] Database connectivity passes.
- [ ] Migration static preflight passes.
- [ ] Migration database preflight passes.
- [ ] Applied migration inventory is recorded.
- [ ] Pending migration inventory is recorded.
- [ ] Backup evidence is current.
- [ ] Restore evidence is current.
- [ ] Separate migration execution authorization is recorded when required.

## Operations and Recovery

- [ ] Deployment runbook is available.
- [ ] Startup runbook is available.
- [ ] Shutdown runbook is available.
- [ ] Rollback runbook is available.
- [ ] Incident runbook is available.
- [ ] Previous artifact compatibility is understood.
- [ ] Data-loss boundary is understood.
- [ ] Incident owner is identified.

## Monitoring

- [ ] Prometheus configuration validates.
- [ ] Alert rules validate.
- [ ] Grafana dashboard contract validates.
- [ ] Metrics endpoint access is confirmed.
- [ ] Incident monitoring process is available.

## Final Gate

- [ ] No unresolved critical blocker remains.
- [ ] No unauthorized database action is planned.
- [ ] No secret value is committed.
- [ ] Production deployment is explicitly authorized.

## Safety Boundary

Completing this checklist records readiness only. It does not itself authorize deployment, migration execution, database mutation, traffic exposure or secret disclosure.
