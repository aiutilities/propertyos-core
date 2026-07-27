#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

CONTRACT_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "runtime"
    / "isolated-runtime-contract.json"
)

COMPOSE_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "templates"
    / "docker-compose.fat.template.yml"
)


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(
            f"ERROR: required artifact missing: {path}"
        )

    try:
        return json.loads(
            path.read_text()
        )
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid JSON in {path}: {error}"
        ) from error


def validate_contract_only(
    contract: dict,
) -> None:
    for key in [
        "runtimeStartAuthorized",
        "databaseCreationAuthorized",
        "migrationExecutionAuthorized",
        "databaseWritesAuthorized",
        "acceptanceExecutionAuthorized",
        "productionExecutionAuthorized",
        "publicReleaseAuthorized",
    ]:
        assert (
            contract["authorization"][key]
            is False
        ), key

    assert "activeAuthorization" not in contract


def validate_authorized_procurement(
    contract: dict,
) -> None:
    for key in [
        "runtimeStartAuthorized",
        "databaseCreationAuthorized",
        "migrationExecutionAuthorized",
        "databaseWritesAuthorized",
        "acceptanceExecutionAuthorized",
    ]:
        assert (
            contract["authorization"][key]
            is True
        ), key

    assert (
        contract["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    assert (
        contract["authorization"]
        ["publicReleaseAuthorized"]
        is False
    )

    active = contract[
        "activeAuthorization"
    ]

    assert (
        active["suiteId"]
        == "procurement"
    )

    assert (
        active["automaticRevocationRequired"]
        is True
    )

    assert (
        active["scope"]
        == [
            "postgres-fat",
            "migrate-fat",
            (
                "backend/src/core/procurement/"
                "procurement-http-idempotency."
                "integration-spec.ts"
            ),
        ]
    )

    assert isinstance(
        active["authorizedAt"],
        str,
    )

    assert (
        active["authorizedAt"]
        .endswith("Z")
    )


def main() -> None:
    contract = load_json(
        CONTRACT_PATH
    )

    if not COMPOSE_PATH.is_file():
        raise SystemExit(
            f"ERROR: Compose template missing: {COMPOSE_PATH}"
        )

    compose_text = (
        COMPOSE_PATH.read_text()
    )

    assert contract["schemaVersion"] == 1
    assert contract["phase"] == "19"

    assert (
        contract["artifact"]
        == "isolated-fat-runtime"
    )

    runtime = contract["runtime"]

    assert (
        runtime["environmentName"]
        == "propertyos-fat"
    )

    assert (
        runtime["nodeEnvironment"]
        == "production"
    )

    assert runtime["apiPort"] == 3019
    assert runtime["frontendPort"] == 3020
    assert runtime["postgresHostPort"] == 5439

    assert (
        runtime["databaseName"]
        == "propertyos_fat"
    )

    assert (
        runtime["databaseUser"]
        == "propertyos_fat"
    )

    assert (
        contract["services"]
        ["postgres"]["required"]
        is True
    )

    assert (
        contract["services"]
        ["postgres"]["persistent"]
        is False
    )

    assert (
        contract["services"]
        ["migrate"]["required"]
        is True
    )

    assert (
        contract["services"]
        ["migrate"]
        ["automaticExecutionPermitted"]
        is False
    )

    assert (
        contract["services"]
        ["migrate"]
        ["authorizationRequired"]
        is True
    )

    assert (
        contract["environment"]
        ["syntheticDataOnly"]
        is True
    )

    assert (
        contract["environment"]
        ["dedicatedDatabaseRequired"]
        is True
    )

    assert (
        contract["environment"]
        ["productionCredentialsPermitted"]
        is False
    )

    status = contract["status"]

    if status == "contract-only":
        validate_contract_only(
            contract
        )
    elif (
        status
        == "authorized-for-isolated-procurement"
    ):
        validate_authorized_procurement(
            contract
        )
    else:
        raise AssertionError(
            f"unsupported runtime status: {status}"
        )

    for key, value in (
        contract["execution"].items()
    ):
        assert value is False, (
            "runtime execution state changed before "
            f"execution: {key}"
        )

    assert "postgres-fat:" in compose_text
    assert "migrate-fat:" in compose_text
    assert "api-fat:" in compose_text
    assert "scheduler-fat:" in compose_text

    assert (
        "authorized-fat-migration"
        in compose_text
    )

    assert (
        "127.0.0.1:5439:5432"
        in compose_text
    )

    assert (
        "/api/v1/health/ready"
        in compose_text
    )

    print(
        "FAT isolated runtime:       VALID"
    )
    print(
        "Runtime status:            ",
        status,
    )
    print(
        "API port:                  ",
        runtime["apiPort"],
    )
    print(
        "Frontend port:             ",
        runtime["frontendPort"],
    )
    print(
        "PostgreSQL host port:      ",
        runtime["postgresHostPort"],
    )
    print(
        "Environment variables:      17"
    )
    print(
        "Services started:          ",
        contract["execution"]
        ["servicesStarted"],
    )
    print(
        "Database created:          ",
        contract["execution"]
        ["databaseCreated"],
    )
    print(
        "Migrations executed:       ",
        contract["execution"]
        ["migrationsExecuted"],
    )
    print(
        "Acceptance authorized:     ",
        contract["authorization"]
        ["acceptanceExecutionAuthorized"],
    )


if __name__ == "__main__":
    main()
