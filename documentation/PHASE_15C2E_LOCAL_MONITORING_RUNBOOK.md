# Phase 15C2E Local Monitoring and Incident Runbook

## Scope

This runbook governs the initial Advaith's Nest local pilot monitor.

- Incident owner: Anand Nataraj
- Incident channel: local macOS notification and protected JSONL incident log
- Escalation: manual phone escalation
- External alert delivery: disabled
- Poll interval: 60 seconds
- Incident threshold: two consecutive failed probes
- Automatic remediation: prohibited
- Automatic API restart: prohibited
- Automatic database migration: prohibited
- Automatic WhatsApp retry: prohibited

## Monitored endpoints

The monitor checks:

1. `GET /api/v1/health/live`
2. `GET /api/v1/health/ready`

Both endpoints must return HTTP 200 with a literal JSON status of `ok`.

A readiness response with HTTP 503, a non-`ok` status, a transport error, or a timeout is a failed probe.

## State transitions

- `UNCHANGED_HEALTHY`: both probes passed.
- `FAILURE_PENDING_THRESHOLD`: first consecutive failure; no notification.
- `INCIDENT_OPENED`: failure threshold reached; one local notification.
- `INCIDENT_CONTINUES`: subsequent failures; no notification storm.
- `RECOVERED`: first healthy probe after an opened incident; one recovery notification.

## Protected local artifacts

The installed monitor writes only to:

- `~/Library/Logs/PropertyOS/incident-monitor.jsonl`
- `~/Library/Application Support/PropertyOS/monitoring/state`
- `~/Library/LaunchAgents/com.propertyos.incident-monitor.plist`

Directories and files are created with owner-only permissions.

No authentication secret, database password, webhook token, phone number, recipient, message content or endpoint credential is logged.

## Incident response

When `INCIDENT_OPENED` appears:

1. Anand Nataraj becomes the incident operator.
2. Confirm Docker status for `propertyos-api` and `propertyos-postgres`.
3. Probe health, liveness, readiness and database health locally.
4. Preserve logs before changing runtime state.
5. Confirm source database safety remains `1|37|0`.
6. Do not apply migrations.
7. Do not invoke the WhatsApp executor.
8. Do not retry an ambiguous external delivery.
9. Escalate manually by phone if the issue affects the pilot.
10. Obtain separate authorization before rollback, restart, secret rotation, migration or external communication.

## Abort conditions

Stop and escalate if any of these occur:

- readiness remains degraded for two probes;
- either container stops unexpectedly;
- source state differs from `1|37|0`;
- metrics persistence terminates the API;
- the active image differs from the approved revision;
- rollback state is unclear;
- an external delivery outcome is ambiguous.

## Dry-run validation

The monitor supports:

```text
operations/phase-15c2e-local-monitor.sh --dry-run
```

Dry-run mode performs probes and prints one sanitized JSON event. It does not write state, create logs or send a local notification.

## Governance

This local channel is appropriate only for the controlled Advaith's Nest pilot.

It is not a substitute for commercial multi-operator observability. External email, Slack, Teams, paging or WhatsApp alert delivery requires separate configuration, credential governance and explicit authorization.
