#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]

SNAPSHOT = (
    ROOT
    / "operations/fat/evidence/"
      "inventory-fat-acceptance-snapshot.json"
)

DIGEST = (
    ROOT
    / "operations/fat/evidence/"
      "inventory-fat-acceptance-snapshot.sha256"
)

EXPECTED_SOURCE_COMMIT = (
    "ddcaace0c5d4682b3e06c7d83e7723cc1d954ab5"
)

EXPECTED_IMPLEMENTATION_BASELINE = (
    "528a4b9fb1df1543e4e80dd27a27a925c47dd1b9"
)


def fail(message: str) -> None:
    raise SystemExit(
        f"ERROR: {message}"
    )


def sha256_file(path: Path) -> str:
    return hashlib.sha256(
        path.read_bytes()
    ).hexdigest()


def require(
    condition: bool,
    message: str,
) -> None:
    if not condition:
        fail(message)


def main() -> None:
    require(
        SNAPSHOT.is_file(),
        "Inventory acceptance snapshot missing",
    )

    require(
        DIGEST.is_file(),
        "Inventory acceptance digest missing",
    )

    raw = SNAPSHOT.read_bytes()

    report: dict[str, Any] = json.loads(
        raw.decode()
    )

    canonical = (
        json.dumps(
            report,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode()

    require(
        raw == canonical,
        "Snapshot is not canonical JSON",
    )

    digest_line = DIGEST.read_text().strip()

    expected_digest = hashlib.sha256(
        raw
    ).hexdigest()

    require(
        digest_line
        == (
            f"{expected_digest}  "
            "inventory-fat-acceptance-snapshot.json"
        ),
        "Snapshot SHA-256 mismatch",
    )

    require(
        report.get("schemaVersion") == 1,
        "Unexpected schema version",
    )

    require(
        report.get("phase") == "20",
        "Unexpected phase",
    )

    require(
        report.get("checkpoint") == "20M3",
        "Unexpected checkpoint",
    )

    require(
        report.get("suiteId") == "inventory",
        "Unexpected suite ID",
    )

    require(
        report.get("status") == "PASSED",
        "Inventory acceptance is not PASSED",
    )

    repository = report.get(
        "repository",
        {},
    )

    require(
        repository.get("sourceCommit")
        == EXPECTED_SOURCE_COMMIT,
        "Unexpected source commit",
    )

    require(
        repository.get(
            "implementationBaseline"
        )
        == EXPECTED_IMPLEMENTATION_BASELINE,
        "Unexpected implementation baseline",
    )

    require(
        repository.get("workingTreeClean")
        is True,
        "Snapshot did not record a clean tree",
    )

    acceptance = report.get(
        "acceptance",
        {},
    )

    expected_acceptance = {
        "registeredTestFiles": 25,
        "testSuitesPassed": 25,
        "testSuitesTotal": 25,
        "testsPassed": 203,
        "testsTotal": 203,
        "lifecycleContractsComplete": 23,
        "coverageFlagsComplete": 34,
        "adapterChecksPassed": 2,
        "adapterChecksTotal": 2,
        "backendTypecheckPassed": True,
        "fatRunnerValidationPassed": True,
        "defects": [],
    }

    require(
        acceptance == expected_acceptance,
        "Acceptance summary changed",
    )

    capabilities = report.get(
        "capabilities",
        {},
    )

    require(
        len(capabilities) == 20,
        "Unexpected capability count",
    )

    require(
        all(
            value is True
            for value in capabilities.values()
        ),
        "One or more capabilities are incomplete",
    )

    authorization = report.get(
        "authorization",
        {},
    )

    require(
        authorization.get(
            "runtimeAuthorized"
        )
        is False,
        "Runtime authorization became active",
    )

    require(
        authorization.get(
            "databaseWritesAuthorized"
        )
        is False,
        "Database-write authorization became active",
    )

    require(
        authorization.get(
            "productionExecutionAuthorized"
        )
        is False,
        "Production execution became authorized",
    )

    require(
        authorization.get(
            "pilotDeploymentAuthorized"
        )
        is False,
        "Pilot deployment became authorized",
    )

    require(
        authorization.get(
            "publicReleaseAuthorized"
        )
        is False,
        "Public release became authorized",
    )

    require(
        authorization.get(
            "fatExecutionAuthorization"
        )
        == "completed-and-revoked",
        "FAT authorization state changed",
    )

    safety = report.get(
        "safety",
        {},
    )

    require(
        all(
            value is False
            for value in safety.values()
        ),
        "Safety boundary changed",
    )

    evidence = report.get(
        "evidence",
        {},
    )

    contract_files = evidence.get(
        "contractFiles",
        [],
    )

    test_files = evidence.get(
        "testFiles",
        [],
    )

    commits = evidence.get(
        "commits",
        [],
    )

    require(
        len(contract_files) == 10,
        "Unexpected contract-file count",
    )

    require(
        len(test_files) == 25,
        "Unexpected test-file count",
    )

    require(
        len(commits) == 25,
        "Unexpected Phase 20 commit count",
    )

    for item in (
        contract_files
        + test_files
    ):
        relative = item.get("path")
        expected = item.get("sha256")

        require(
            isinstance(relative, str),
            "Evidence path is invalid",
        )

        path = ROOT / relative

        require(
            path.is_file(),
            f"Evidence file missing: {relative}",
        )

        require(
            sha256_file(path) == expected,
            f"Evidence digest changed: {relative}",
        )

    current_branch = subprocess.check_output(
        [
            "git",
            "branch",
            "--show-current",
        ],
        cwd=ROOT,
        text=True,
    ).strip()

    require(
        current_branch
        == repository.get("branch"),
        "Repository branch changed",
    )

    require(
        report.get("founderDecision")
        == {
            "fatAcceptance": "ACCEPTED",
            "runtimeAcceptance":
                "NOT_AUTHORIZED",
            "pilotDeployment":
                "NOT_GRANTED",
        },
        "Founder decision changed",
    )

    print(
        "Inventory acceptance snapshot: VALID"
    )

    print(
        f"Snapshot SHA-256:             "
        f"{expected_digest}"
    )

    print(
        "Registered FAT files:        25"
    )

    print(
        "Inventory FAT tests:         203"
    )

    print(
        "Lifecycle contracts:         23"
    )

    print(
        "Coverage flags:              34"
    )

    print(
        "Runtime authorized:          false"
    )

    print(
        "Pilot deployment authorized: false"
    )

    print(
        "Production authorized:       false"
    )


if __name__ == "__main__":
    main()
