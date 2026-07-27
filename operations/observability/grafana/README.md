# PropertyOS Grafana Dashboard Contract

## Purpose

This directory contains the version-controlled Grafana dashboard contract for PropertyOS operational metrics.

The dashboard consumes the existing Prometheus recording rules and alert contract. It does not define, rename, or modify application metrics.

## Dashboard

Dashboard title: PropertyOS Operations
Dashboard UID: propertyos-operations
Default refresh interval: 30s
Default time range: last 6 hours
Prometheus datasource variable: DS_PROMETHEUS

## Operational Sections

1. Platform Availability
2. Idempotency
3. Marketplace
4. Inventory
5. Procurement
6. Workflow
7. Scheduler

## Contract Rules

- Panels must use the existing PropertyOS Prometheus recording rules where available.
- The Prometheus job name remains propertyos-api.
- Dashboard queries must not introduce high-cardinality identifiers.
- Allowed dimensions are operation, jobType, errorType, conflictCode, severity and subsystem.
- IDs, payloads, tenant identifiers, property identifiers, actor identifiers and correlation identifiers are forbidden.
- Existing metrics authentication and authorization remain unchanged.
- Grafana datasource and dashboard-file provisioning are included in this contract.

## Files

- propertyos-dashboard-contract.json
- dashboards/propertyos-operations.json
- provisioning/datasources/propertyos-prometheus.yml
- provisioning/dashboards/propertyos-dashboards.yml
- scripts/validate-dashboard-contract.py

## Source Contracts

- ../prometheus/propertyos-recording-rules.yml
- ../prometheus/propertyos-alert-rules.yml
- ../prometheus/README.md
