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

    assert (
        authorization["schemaVersion"]
        == 1
    )

    assert (
        authorization["phase"]
        == "19"
    )

    assert (
        authorization["suiteId"]
        == "procurement"
    )

    assert (
        authorization["status"]
        == "PREPARED"
    )

    assert (
        authorization["environment"]["type"]
        == "isolated"
    )

    assert (
        authorization["environment"]
        ["syntheticDataOnly"]
        is True
    )

    assert (
        authorization["environment"]
        ["productionEnvironmentPermitted"]
        is False
    )

    assert (
        authorization["environment"]
        ["persistentDatabasePermitted"]
        is False
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
        ["database"]
        == {
            "host": "127.0.0.1",
            "port": 5439,
            "name": "propertyos_fat",
            "user": "propertyos_fat",
        }
    )

    assert (
        authorization["scope"]
        ["migrationProfile"]
        == "authorized-fat-migration"
    )

    assert (
        authorization["scope"]
        ["expectedRuntimeTests"]
        == 13
    )

    assert (
        authorization["scope"]
        ["testFiles"]
        == [
            (
                "backend/src/core/procurement/"
                "procurement-http-idempotency."
                "integration-spec.ts"
            )
        ]
    )

    assert HTTP_TEST_PATH.is_file()

    for key, value in (
        authorization["authorization"].items()
    ):
        assert value is False, (
            f"authorization unexpectedly enabled: {key}"
        )

    for key, value in (
        authorization["execution"].items()
    ):
        assert value is False, (
            f"execution state unexpectedly enabled: {key}"
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
        runtime["authorization"]
        ["runtimeStartAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["databaseCreationAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["migrationExecutionAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["databaseWritesAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["acceptanceExecutionAuthorized"]
        is False
    )

    assert (
        runtime["authorization"]
        ["productionExecutionAuthorized"]
        is False
    )

    print(
        "Procurement runtime authorization: PREPARED"
    )
    print(
        "Suite:                             procurement"
    )
    print(
        "Runtime tests expected:            13"
    )
    print(
        "Permitted services:                2"
    )
    print(
        "Production services permitted:     0"
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
        "Services started:                  false"
    )
    print(
        "Database mutated:                  false"
    )


if __name__ == "__main__":
    main()
