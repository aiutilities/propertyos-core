#!/usr/bin/env python3

import json
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "fat-runner.mjs"
ADAPTER = ROOT / "adapters" / "installation.mjs"


def main() -> None:
    assert ADAPTER.is_file()
    assert RUNNER.is_file()

    syntax = subprocess.run(
        ["node", "--check", str(ADAPTER)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert syntax.returncode == 0, syntax.stderr

    runner_syntax = subprocess.run(
        ["node", "--check", str(RUNNER)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert runner_syntax.returncode == 0, (
        runner_syntax.stderr
    )

    with tempfile.NamedTemporaryFile(
        mode="w+",
        suffix=".json",
    ) as report_file:
        result = subprocess.run(
            [
                "node",
                str(RUNNER),
                "precheck",
                "installation",
            ],
            check=False,
            capture_output=True,
            text=True,
        )

        report_file.write(result.stdout)
        report_file.flush()

        assert result.returncode == 0, (
            result.stderr or result.stdout
        )

        report = json.loads(
            Path(report_file.name).read_text()
        )

    assert report["suiteId"] == "installation"
    assert report["mode"] == "read-only-precheck"
    assert report["passed"] is True
    assert report["summary"]["checksFailed"] == 0

    assert report["safety"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "testsExecuted": True,
        "databaseMutated": False,
        "evidenceStateMutated": False,
    }

    print("FAT installation adapter:   VALID")
    print(
        "Checks executed:           ",
        report["summary"]["checksTotal"],
    )
    print(
        "Checks passed:             ",
        report["summary"]["checksPassed"],
    )
    print("Checks failed:              0")
    print("Services started:           false")
    print("Database mutated:           false")
    print("Evidence state mutated:     false")


if __name__ == "__main__":
    main()
