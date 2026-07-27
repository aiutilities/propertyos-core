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
        == "COMPLETED_AND_REVOKED"
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

    for key, value in (
        authorization["authorization"].items()
    ):
        assert value is False, key

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

    assert authorization["execution"] == {
        "dockerAvailable": True,
        "containersCreated": True,
        "servicesStarted": True,
        "databaseCreated": True,
        "migrationsExecuted": True,
        "testsExecuted": True,
        "testsPassed": True,
        "databaseMutated": True,
        "teardownCompleted": True,
    }

    assert (
        authorization["revocation"]
        ["automaticRevocationCompleted"]
        is True
    )

    assert (
        execution_plan["authorization"]
        ["executionAuthorized"]
        is False
    )

    assert (
        execution_plan["authorization"]
        ["databaseWritesAuthorized"]
        is False
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
        execution_plan["lastCompletedAuthorization"]
        ["suiteId"]
        == "procurement"
    )

    for key, value in (
        runtime["authorization"].items()
    ):
        assert value is False, key

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
        runtime["lastExecution"]
        ["suiteId"]
        == "procurement"
    )

    assert (
        runtime["lastExecution"]
        ["result"]
        == "PASSED"
    )

    assert (
        readiness["authorization"]
        ["acceptanceExecutionAuthorized"]
        is False
    )

    assert (
        readiness["authorization"]
        ["databaseWritesAuthorized"]
        is False
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
        readiness["lastCompletedAuthorization"]
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
        "Procurement runtime authorization: REVOKED"
    )
    print(
        "Suite:                             procurement"
    )
    print(
        "Runtime result:                    PASSED"
    )
    print(
        "Migrations executed:               54"
    )
    print(
        "Runtime tests passed:              13"
    )
    print(
        "Founder authorization recorded:    false"
    )
    print(
        "Runtime start authorized:          false"
    )
    print(
        "Database creation authorized:      false"
    )
    print(
        "Migration execution authorized:    false"
    )
    print(
        "Database writes authorized:        false"
    )
    print(
        "Acceptance execution authorized:   false"
    )
    print(
        "Production execution authorized:   false"
    )
    print(
        "Public release authorized:         false"
    )
    print(
        "Teardown completed:                true"
    )
    print(
        "Automatic revocation completed:    true"
    )



if __name__ == "__main__":
    main()
