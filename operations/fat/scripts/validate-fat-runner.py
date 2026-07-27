#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

RUNNER = (
    ROOT
    / "operations"
    / "fat"
    / "scripts"
    / "fat-runner.mjs"
)

PLAN_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "plans"
    / "execution-plan.json"
)


def run(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "node",
            str(RUNNER),
            *arguments,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def load_plan() -> dict:
    return json.loads(
        PLAN_PATH.read_text()
    )


def main() -> None:
    assert RUNNER.is_file()

    syntax = subprocess.run(
        [
            "node",
            "--check",
            str(RUNNER),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert syntax.returncode == 0, (
        syntax.stderr
    )

    listed = run("list")

    assert listed.returncode == 0, (
        listed.stderr
    )

    expected_suites = [
        "installation",
        "authentication",
        "property-management",
        "tenant-lifecycle",
        "procurement",
        "inventory",
        "workflow",
        "plugins",
        "performance-regression",
        "backup-restore",
    ]

    for suite_id in expected_suites:
        assert suite_id in listed.stdout, (
            f"Suite missing from runner list: {suite_id}"
        )

    assert (
        listed.stdout.count(
            "property-management"
        )
        == 1
    )

    assert (
        listed.stdout.count(
            "tenant-lifecycle"
        )
        == 1
    )

    status = run("status")

    assert status.returncode == 0, (
        status.stderr
    )

    assert (
        "Required suites:            10"
        in status.stdout
    )

    assert (
        "Production authorized:      false"
        in status.stdout
    )

    plan = load_plan()
    plan_status = plan["status"]

    if (
        plan_status
        == "authorized-for-isolated-procurement"
    ):
        assert (
            "Execution authorized:       true"
            in status.stdout
        )

        assert (
            "Database writes authorized: true"
            in status.stdout
        )

        unsupported = run(
            "run",
            "inventory",
        )

        assert unsupported.returncode != 0

        assert (
            "No executable runtime adapter installed for: inventory"
            in unsupported.stderr
        )

        runtime_state = "AUTHORIZED"

    elif plan_status == "completed-and-revoked":
        assert (
            "Execution authorized:       false"
            in status.stdout
        )

        assert (
            "Database writes authorized: false"
            in status.stdout
        )

        blocked = run(
            "run",
            "procurement",
        )

        assert blocked.returncode != 0

        assert (
            "FAT execution is blocked by contract"
            in blocked.stderr
        )

        assert (
            "execution-plan authorization is false"
            in blocked.stderr
        )

        assert (
            "runtime-start authorization is false"
            in blocked.stderr
        )

        runtime_state = "REVOKED"

    else:
        raise AssertionError(
            "Unsupported execution-plan state: "
            f"{plan_status}"
        )

    invalid = run(
        "run",
        "invalid-suite",
    )

    assert invalid.returncode != 0

    assert (
        "Unknown FAT suite"
        in invalid.stderr
    )

    assert (
        "Runtime started:            false"
        in status.stdout
    )

    assert (
        "Database created:           false"
        in status.stdout
    )

    assert (
        "Migrations executed:        false"
        in status.stdout
    )

    print(
        "FAT runner foundation:      VALID"
    )
    print(
        "Suites listed:              10"
    )
    print(
        "Status command:             VALID"
    )
    print(
        "Execution-plan state:      ",
        plan_status,
    )
    print(
        "Runtime authorization:     ",
        runtime_state,
    )
    print(
        "Invalid suite rejected:     true"
    )
    print(
        "Fail-closed execution:      true"
    )
    print(
        "Suites executed:            0"
    )
    print(
        "Database mutated:           false"
    )


if __name__ == "__main__":
    main()
