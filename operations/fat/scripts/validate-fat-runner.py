#!/usr/bin/env python3

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "fat-runner.mjs"


def run(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", str(RUNNER), *arguments],
        check=False,
        capture_output=True,
        text=True,
    )


def main() -> None:
    assert RUNNER.is_file()
    assert RUNNER.stat().st_mode & 0o111

    syntax = subprocess.run(
        ["node", "--check", str(RUNNER)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert syntax.returncode == 0, syntax.stderr

    listing = run("list")
    assert listing.returncode == 0, listing.stderr
    assert "Total suites: 10" in listing.stdout
    assert "installation" in listing.stdout
    assert "backup-restore" in listing.stdout

    status = run("status")
    assert status.returncode == 0, status.stderr
    assert "Required suites:            10" in status.stdout
    assert "Execution authorized:       false" in status.stdout
    assert "Database writes authorized: false" in status.stdout

    blocked = run("run", "installation")
    assert blocked.returncode != 0
    assert (
        "FAT execution is blocked by contract"
        in blocked.stderr
    )

    invalid = run("run", "invalid-suite")
    assert invalid.returncode != 0
    assert "Unknown FAT suite" in invalid.stderr

    print("FAT runner foundation:      VALID")
    print("Suites listed:              10")
    print("Status command:             VALID")
    print("Invalid suite rejected:     true")
    print("Unauthorized run blocked:   true")
    print("Suites executed:            0")
    print("Database mutated:           false")


if __name__ == "__main__":
    main()
