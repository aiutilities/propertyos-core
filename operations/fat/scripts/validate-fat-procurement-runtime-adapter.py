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


def main() -> None:
    if not ADAPTER.is_file():
        raise SystemExit(
            f"ERROR: runtime adapter missing: {ADAPTER}"
        )

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

    assert described.returncode == 0, (
        described.stderr
    )

    plan = json.loads(
        described.stdout
    )

    assert plan["suiteId"] == "procurement"
    assert plan["mode"] == "isolated-runtime"
    assert plan["expectedTests"] == 13
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

    assert (
        plan["database"]["port"]
        == 5439
    )

    assert (
        plan["safety"]
        ["persistentDatabase"]
        is False
    )

    assert (
        plan["safety"]
        ["teardownRequired"]
        is True
    )

    assert (
        plan["safety"]
        ["authorizationRevocationRequired"]
        is True
    )

    print(
        "Procurement runtime adapter: VALID"
    )
    print(
        "Executable:                  true"
    )
    print(
        "Executed:                    false"
    )
    print(
        "Authorization verified:      true"
    )
    print(
        "Runtime tests expected:      13"
    )
    print(
        "Production authorized:       false"
    )
    print(
        "Containers created:          false"
    )
    print(
        "Database mutated:            false"
    )


if __name__ == "__main__":
    main()
