#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "fat-runner.mjs"
ADAPTER = (
    ROOT
    / "adapters"
    / "authentication.mjs"
)


def main() -> None:
    assert ADAPTER.is_file()
    assert RUNNER.is_file()

    for script in [
        ADAPTER,
        RUNNER,
    ]:
        result = subprocess.run(
            [
                "node",
                "--check",
                str(script),
            ],
            check=False,
            capture_output=True,
            text=True,
        )

        assert result.returncode == 0, (
            result.stderr
        )

    result = subprocess.run(
        [
            "node",
            str(RUNNER),
            "precheck",
            "authentication",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        result.stderr or result.stdout
    )

    report = json.loads(result.stdout)

    assert report["suiteId"] == (
        "authentication"
    )

    assert report["mode"] == (
        "automated-code-precheck"
    )

    assert (
        report["discoveredTestFiles"]
        == 3
    )

    assert report["passed"] is True

    assert (
        report["summary"]["checksTotal"]
        == 7
    )

    assert (
        report["summary"]["checksFailed"]
        == 0
    )

    assert report["safety"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "automatedTestsExecuted": True,
        "liveAuthenticationExecuted": False,
        "databaseMutated": False,
        "evidenceStateMutated": False,
    }

    print(
        "FAT authentication adapter: VALID"
    )
    print(
        "Test files discovered:      3"
    )
    print(
        "Checks executed:           ",
        report["summary"]["checksTotal"],
    )
    print(
        "Checks passed:             ",
        report["summary"]["checksPassed"],
    )
    print(
        "Checks failed:              0"
    )
    print(
        "Live authentication:        false"
    )
    print(
        "Database mutated:           false"
    )


if __name__ == "__main__":
    main()
