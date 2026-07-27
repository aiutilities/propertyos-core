# PropertyOS Post-Restore Checklist

## Restore Identity

- [ ] Restore authorization is recorded.
- [ ] Backup identity is recorded.
- [ ] Backup digest matches.
- [ ] Restore destination is confirmed.
- [ ] Restore completion time is recorded.
- [ ] Data-loss boundary is documented.

## Database Validation

- [ ] PostgreSQL restore completed without error.
- [ ] Database connectivity passes.
- [ ] Schema state is approved.
- [ ] Applied migration state is approved.
- [ ] Required tables are present.
- [ ] Controlled record counts are validated.
- [ ] No unexpected corruption is detected.

## Runtime Validation

- [ ] Backend starts successfully.
- [ ] Scheduler starts successfully.
- [ ] Frontend starts successfully.
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

## Monitoring and Smoke Tests

- [ ] Prometheus scraping resumes.
- [ ] Grafana dashboards load.
- [ ] Alert rules are active.
- [ ] Authentication smoke test passes.
- [ ] Read-only data validation passes.
- [ ] Approved business-operation validation passes.
- [ ] No unexpected error spike is observed.

## Evidence and Approval

- [ ] Restore logs are preserved.
- [ ] Health evidence is preserved.
- [ ] Data-validation evidence is preserved.
- [ ] Monitoring evidence is preserved.
- [ ] Restore owner reviewed the result.
- [ ] Reopening decision is recorded.
- [ ] Unresolved risks are documented.

## Safety Boundary

This checklist records restore validation only. It does not authorize production traffic exposure, data deletion, additional restore execution or destructive cleanup.
