#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = (
    ROOT / "propertyos-production-contract.json"
)


def main() -> None:
    try:
        contract = json.loads(CONTRACT_PATH.read_text())
    except FileNotFoundError as error:
        raise SystemExit(
            f"ERROR: missing production contract: {CONTRACT_PATH}"
        ) from error
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid production contract JSON: {error}"
        ) from error

    profile = contract["profile"]
    health = contract["healthRequirements"]
    backup = contract["backupPolicy"]
    rollback = contract["rollbackPolicy"]
    monitoring = contract["monitoringRequirements"]
    safety = contract["safety"]

    assert contract["schemaVersion"] == 1
    assert contract["phase"] == "18"
    assert contract["name"] == "Production Operations"

    assert profile == {
        "runtime": "compiled-node-production",
        "backendEntryPoint": "backend/dist/main.js",
        "schedulerEntryPoint": "backend/dist/scheduler-worker.js",
        "frontendRuntime": "next-production-server",
        "deploymentModel": "self-hosted-docker",
        "database": "postgresql-16",
    }

    assert contract["requiredRunbooks"] == [
        "startup",
        "shutdown",
        "deployment",
        "rollback",
        "backup",
        "restore",
        "incident",
    ]

    assert contract["startupSequence"] == [
        "validate-environment",
        "validate-database-connectivity",
        "run-migration-preflight",
        "start-database",
        "start-backend",
        "start-scheduler",
        "start-frontend",
        "verify-liveness",
        "verify-readiness",
        "verify-monitoring",
    ]

    assert contract["shutdownSequence"] == [
        "stop-frontend",
        "stop-scheduler",
        "stop-backend",
        "verify-process-termination",
        "preserve-database",
    ]

    assert health == {
        "livenessPath": "/api/v1/health/live",
        "readinessPath": "/api/v1/health/ready",
        "expectedStatus": 200,
        "readinessMustBeOk": True,
    }

    assert backup == {
        "requiredBeforeDeployment": True,
        "databaseBackupRequired": True,
        "configurationBackupRequired": True,
        "restoreEvidenceRequired": True,
        "backupIntegrityVerificationRequired": True,
    }

    assert rollback == {
        "rollbackPlanRequired": True,
        "databaseCompatibilityCheckRequired": True,
        "previousArtifactRequired": True,
        "humanAuthorizationRequired": True,
    }

    assert monitoring == {
        "prometheusRequired": True,
        "grafanaRequired": True,
        "alertRulesRequired": True,
        "incidentMonitorRequired": True,
    }

    assert safety == {
        "productionExecutionAuthorized": False,
        "databaseMutationAuthorized": False,
        "migrationExecutionAuthorized": False,
        "secretValuesMayBeCommitted": False,
        "normalRateLimitsMayBeChanged": False,
        "prometheusContractMayBeChanged": False,
        "grafanaContractMayBeChanged": False,
        "applicationCodeMayBeChanged": False,
        "dockerContractMayBeChanged": False,
    }

    print("Production contract:       VALID")
    print(
        "Required runbooks:        ",
        len(contract["requiredRunbooks"]),
    )
    print(
        "Startup sequence steps:   ",
        len(contract["startupSequence"]),
    )
    print(
        "Shutdown sequence steps:  ",
        len(contract["shutdownSequence"]),
    )
    print(
        "Production authorized:    ",
        safety["productionExecutionAuthorized"],
    )
    print(
        "Database mutation allowed:",
        safety["databaseMutationAuthorized"],
    )


if __name__ == "__main__":
    main()
