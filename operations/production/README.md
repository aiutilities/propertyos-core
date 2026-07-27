# PropertyOS Production Operations

## Purpose

This directory contains the Phase 18 production-operations contract and operational runbooks.

It consolidates existing deployment, backup, restore, monitoring, migration-governance and incident-response assets. It does not replace or redesign mature runtime modules.

## Production Profile

- Compiled NestJS backend
- Compiled scheduler worker
- Next.js production frontend
- PostgreSQL 16
- Self-hosted Docker deployment
- Prometheus monitoring
- Grafana dashboards
- Fail-closed readiness verification

## Required Runbooks

- startup
- shutdown
- deployment
- rollback
- backup
- restore
- incident

## Safety Boundary

This contract does not authorize:

- production deployment
- database mutation
- production migration execution
- secret publication
- normal runtime rate-limit changes
- application-code changes
- Prometheus changes
- Grafana changes
- Docker changes

Explicit human authorization remains required for production execution.

## Existing Source References

- ../../documentation/DEPLOYMENT.md
- ../../documentation/BACKUP_RESTORE.md
- ../../documentation/OPERATIONS.md
- ../../documentation/PHASE_13D6_PRODUCTION_OPERATIONAL_RUNBOOK.md
- ../../documentation/PHASE_15C2E_LOCAL_MONITORING_RUNBOOK.md
- ../../docs/release/PRODUCTION_DEPLOYMENT_SAFETY_CERTIFICATION.md
- ../../docs/release/PRODUCTION_OBSERVABILITY_CERTIFICATION.md

## Files

- propertyos-production-contract.json
- scripts/validate-production-contract.py
- scripts/validate-runbooks.py
- scripts/validate-production-inventory.py
- inventory/runtime-inventory.json
- inventory/environment-inventory.json
- inventory/network-inventory.json
- inventory/storage-inventory.json
- inventory/service-inventory.json
- templates/.env.production.template
- templates/docker-compose.production.template.yml
- templates/systemd-api.service
- templates/systemd-scheduler.service
- checklists/pre-deployment.md
- checklists/post-deployment.md
- checklists/pre-backup.md
- checklists/post-restore.md
- runbooks/startup.md
- runbooks/shutdown.md
- runbooks/deployment.md
- runbooks/rollback.md
- runbooks/backup.md
- runbooks/restore.md
- runbooks/incident.md
