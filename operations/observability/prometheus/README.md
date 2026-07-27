# PropertyOS Prometheus Contract

Warning threshold: failure ratio above 5 percent for 10 minutes with at least 10 requests.
Critical threshold: failure ratio above 20 percent for 5 minutes with at least 10 requests.
Idempotency conflict warning: more than 10 conflicts in 5 minutes.
Scheduler latency warning: average duration above 30 seconds for 10 minutes.
Metrics endpoint critical: unavailable for 5 minutes.

Allowed labels: operation, jobType, result, errorType, conflictCode.
Forbidden labels: IDs, payloads, tenant identifiers, property identifiers, actor identifiers, correlation identifiers.

Prometheus job name: propertyos-api.
Existing metrics authentication and authorization remain unchanged.
