#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

AUTHORIZATION_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "authorization"
    / "procurement-runtime-authorization.json"
)

EXECUTION_PLAN_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "plans"
    / "execution-plan.json"
)

RUNTIME_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "runtime"
    / "isolated-runtime-contract.json"
)

READINESS_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "readiness"
    / "isolated-execution-readiness.json"
)

HTTP_TEST_PATH = (
    ROOT
    / "backend"
    / "src"
    / "core"
    / "procurement"
    / "procurement-http-idempotency.integration-spec.ts"
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


def assert_iso_timestamp(value: object) -> None:
    assert isinstance(value, str)
    assert value.endswith("Z")
    assert "T" in value


def main() -> None:
    authorization = load_json(
        AUTHORIZATION_PATH
    )

    execution_plan = load_json(
        EXECUTION_PLAN_PATH
    )

    runtime = load_json(
        RUNTIME_PATH
    )

    readiness = load_json(
        READINESS_PATH
    )

    assert (
        authorization["status"]
        == "AUTHORIZED_FOR_ISOLATED_EXECUTION"
    )

    assert (
        authorization["suiteId"]
        == "procurement"
    )

    assert (
        authorization["scope"]
        ["servicesPermitted"]
        == [
            "postgres-fat",
            "migrate-fat",
        ]
    )

    assert (
        authorization["scope"]
        ["servicesNotPermitted"]
        == [
            "api-fat",
            "scheduler-fat",
            "frontend-fat",
        ]
    )

    assert (
        authorization["scope"]
        ["expectedRuntimeTests"]
        == 13
    )

    assert HTTP_TEST_PATH.is_file()

    expected_enabled = [
        "founderAuthorizationRecorded",
        "runtimeStartAuthorized",
        "databaseCreationAuthorized",
        "migrationExecutionAuthorized",
        "databaseWritesAuthorized",
        "acceptanceExecutionAuthorized",
    ]

    for key in expected_enabled:
        assert (
            authorization["authorization"][key]
            is True
        ), key

    assert (
        authorization["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    assert (
        authorization["authorization"]
        ["publicReleaseAuthorized"]
        is False
    )

    metadata = (
        authorization[
            "authorizationMetadata"
        ]
    )

    assert_iso_timestamp(
        metadata["authorizedAt"]
    )

    assert (
        metadata["authorizedByRole"]
        == "founder"
    )

    assert (
        metadata["authorizedSuite"]
        == "procurement"
    )

    assert (
        metadata[
            "automaticRevocationRequired"
        ]
        is True
    )

    for key, value in (
        authorization["execution"].items()
    ):
        assert value is False, (
            "execution state changed before "
            f"runtime: {key}"
        )

    assert (
        execution_plan["authorization"]
        ["executionAuthorized"]
        is True
    )

    assert (
        execution_plan["authorization"]
        ["databaseWritesAuthorized"]
        is True
    )

    assert (
        execution_plan["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    assert (
        execution_plan["authorization"]
        ["publicReleaseAuthorized"]
        is False
    )

    assert (
        execution_plan["activeAuthorization"]
        ["suiteId"]
        == "procurement"
    )

    for key in [
        "runtimeStartAuthorized",
        "databaseCreationAuthorized",
        "migrationExecutionAuthorized",
        "databaseWritesAuthorized",
        "acceptanceExecutionAuthorized",
    ]:
        assert (
            runtime["authorization"][key]
            is True
        ), key

    assert (
        runtime["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["publicReleaseAuthorized"]
        is False
    )

    assert (
        runtime["activeAuthorization"]
        ["suiteId"]
        == "procurement"
    )

    assert (
        readiness["authorization"]
        ["acceptanceExecutionAuthorized"]
        is True
    )

    assert (
        readiness["authorization"]
        ["databaseWritesAuthorized"]
        is True
    )

    assert (
        readiness["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    assert (
        readiness["authorization"]
        ["publicReleaseAuthorized"]
        is False
    )

    assert (
        readiness["activeAuthorization"]
        ["suiteId"]
        == "procurement"
    )

    assert (
        authorization["environment"]
        ["productionEnvironmentPermitted"]
        is False
    )

    assert (
        authorization["environment"]
        ["productionCredentialsPermitted"]
        is False
    )

    assert (
        authorization["safety"]
        ["productionMutationPermitted"]
        is False
    )

    print(
        "Procurement runtime authorization: AUTHORIZED"
    )
    print(
        "Suite:                             procurement"
    )
    print(
        "Scope:                             isolated only"
    )
    print(
        "Runtime tests expected:            13"
    )
    print(
        "Founder authorization recorded:    true"
    )
    print(
        "Runtime start authorized:          true"
    )
    print(
        "Database creation authorized:      true"
    )
    print(
        "Migration execution authorized:    true"
    )
    print(
        "Database writes authorized:        true"
    )
    print(
        "Acceptance execution authorized:   true"
    )
    print(
        "Production execution authorized:   false"
    )
    print(
        "Public release authorized:         false"
    )
    print(
        "Services started:                  false"
    )
    print(
        "Database mutated:                  false"
    )
    print(
        "Automatic revocation required:     true"
    )


if __name__ == "__main__":
    main()
