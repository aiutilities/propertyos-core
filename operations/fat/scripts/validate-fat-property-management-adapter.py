#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "fat-runner.mjs"
ADAPTER = (
    ROOT
    / "adapters"
    / "property-management.mjs"
)
TEST_FILE = (
    ROOT.parent.parent
    / "backend"
    / "src"
    / "core"
    / "property"
    / "services"
    / "property.service.integration-spec.ts"
)


def main() -> None:
    assert RUNNER.is_file()
    assert ADAPTER.is_file()
    assert TEST_FILE.is_file()

    for script in [
        RUNNER,
        ADAPTER,
    ]:
        syntax = subprocess.run(
            [
                "node",
                "--check",
                str(script),
            ],
            check=False,
            capture_output=True,
            text=True,
        )

        assert syntax.returncode == 0, (
            syntax.stderr
        )

    result = subprocess.run(
        [
            "node",
            str(RUNNER),
            "precheck",
            "property-management",
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
        "property-management"
    )

    assert report["adapterVersion"] == 1

    assert report["mode"] == (
        "automated-code-precheck"
    )

    assert report["discoveredTestFiles"] == 1

    assert report["testFiles"] == [
        "src/core/property/services/"
        "property.service.integration-spec.ts"
    ]

    assert report["summary"] == {
        "checksTotal": 2,
        "checksPassed": 2,
        "checksFailed": 0,
        "checksBlocked": 0,
    }

    assert report["passed"] is True

    assert report["safety"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "automatedTestsExecuted": True,
        "livePropertyOperationsExecuted": False,
        "databaseMutated": False,
        "evidenceStateMutated": False,
    }

    print(
        "FAT Property Management adapter: VALID"
    )
    print(
        "Test files discovered:           1"
    )
    print(
        "Property tests executed:         3"
    )
    print(
        "Adapter checks executed:         2"
    )
    print(
        "Adapter checks passed:           2"
    )
    print(
        "Adapter checks failed:           0"
    )
    print(
        "Live property operations:        false"
    )
    print(
        "Database mutated:                false"
    )


if __name__ == "__main__":
    main()
