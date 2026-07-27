#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

ADAPTER = (
    ROOT
    / "operations"
    / "fat"
    / "runtime-adapters"
    / "procurement.mjs"
)

AUTHORIZATION_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "authorization"
    / "procurement-runtime-authorization.json"
)


def main() -> None:
    assert ADAPTER.is_file()
    assert AUTHORIZATION_PATH.is_file()

    syntax = subprocess.run(
        [
            "node",
            "--check",
            str(ADAPTER),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert syntax.returncode == 0, (
        syntax.stderr
    )

    authorization = json.loads(
        AUTHORIZATION_PATH.read_text()
    )

    status = authorization["status"]

    described = subprocess.run(
        [
            "node",
            str(ADAPTER),
            "describe",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    if (
        status
        == "AUTHORIZED_FOR_ISOLATED_EXECUTION"
    ):
        assert described.returncode == 0, (
            described.stderr
        )

        plan = json.loads(
            described.stdout
        )

        assert (
            plan["suiteId"]
            == "procurement"
        )

        assert (
            plan["mode"]
            == "isolated-runtime"
        )

        assert (
            plan["expectedTests"]
            == 13
        )

        assert plan["executable"] is True
        assert plan["executed"] is False

        assert (
            plan["authorizationVerified"]
            is True
        )

        assert (
            plan["productionAuthorized"]
            is False
        )

        assert (
            plan["databaseMutated"]
            is False
        )

        lifecycle = "AUTHORIZED"
        authorization_verified = True

    elif status == "COMPLETED_AND_REVOKED":
        assert described.returncode != 0

        assert (
            "Procurement runtime authorization is not active"
            in described.stderr
        )

        assert (
            authorization["execution"]
            ["testsPassed"]
            is True
        )

        assert (
            authorization["execution"]
            ["teardownCompleted"]
            is True
        )

        assert (
            authorization["revocation"]
            ["automaticRevocationCompleted"]
            is True
        )

        for key, value in (
            authorization[
                "authorization"
            ].items()
        ):
            assert value is False, key

        source = ADAPTER.read_text()

        required_markers = [
            "runProcurementRuntimeSuite",
            "createTemporaryEnvironment",
            "waitForPostgres",
            "run-fat-migrations",
            "procurement-http-idempotency-tests",
            "teardown-fat-runtime",
            "procurement-runtime-results.json",
        ]

        for marker in required_markers:
            assert marker in source, marker

        lifecycle = "COMPLETED_AND_REVOKED"
        authorization_verified = False

    else:
        raise AssertionError(
            "Unsupported Procurement authorization state: "
            f"{status}"
        )

    print(
        "Procurement runtime adapter: VALID"
    )
    print(
        "Adapter lifecycle:          ",
        lifecycle,
    )
    print(
        "Executable implementation:   true"
    )
    print(
        "Authorization active:       ",
        str(
            authorization_verified
        ).lower(),
    )
    print(
        "Runtime tests recorded:      13"
    )
    print(
        "Production authorized:       false"
    )
    print(
        "Teardown completed:          true"
        if status == "COMPLETED_AND_REVOKED"
        else
        "Teardown completed:          false"
    )
    print(
        "Database mutated now:        false"
    )


if __name__ == "__main__":
    main()
