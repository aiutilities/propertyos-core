#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "propertyos-production-contract.json"
RUNBOOK_ROOT = ROOT / "runbooks"

REQUIRED_SECTIONS = {
    "startup": [
        "## Purpose",
        "## Preconditions",
        "## Startup Sequence",
        "## Health Gates",
        "## Failure Handling",
        "## Safety Boundary",
    ],
    "shutdown": [
        "## Purpose",
        "## Preconditions",
        "## Shutdown Sequence",
        "## Database Boundary",
        "## Verification",
        "## Safety Boundary",
    ],
    "deployment": [
        "## Purpose",
        "## Preconditions",
        "## Deployment Sequence",
        "## Acceptance Gates",
        "## Failure Handling",
        "## Safety Boundary",
    ],
    "rollback": [
        "## Purpose",
        "## Preconditions",
        "## Rollback Classification",
        "## Rollback Sequence",
        "## Acceptance Gates",
        "## Safety Boundary",
    ],
    "backup": [
        "## Purpose",
        "## Backup Scope",
        "## Preconditions",
        "## Backup Sequence",
        "## Integrity Gates",
        "## Safety Boundary",
    ],
    "restore": [
        "## Purpose",
        "## Preconditions",
        "## Preferred Restore Order",
        "## Production Restore Sequence",
        "## Acceptance Gates",
        "## Safety Boundary",
    ],
    "incident": [
        "## Purpose",
        "## Incident Triggers",
        "## Immediate Actions",
        "## Severity Classification",
        "## Recovery Decision",
        "## Safety Boundary",
    ],
}

FORBIDDEN_TERMS = [
    "actual_password",
    "real_secret",
    "private_key_value",
    "production_token",
]


def main() -> None:
    contract = json.loads(CONTRACT_PATH.read_text())
    required = contract["requiredRunbooks"]

    assert required == list(REQUIRED_SECTIONS)

    checked = 0

    for name in required:
        path = RUNBOOK_ROOT / f"{name}.md"

        if not path.is_file():
            raise AssertionError(
                f"missing runbook: {path}"
            )

        text = path.read_text()

        if not text.endswith("\n"):
            raise AssertionError(
                f"missing final newline: {path}"
            )

        if not text.startswith("# PropertyOS"):
            raise AssertionError(
                f"invalid title: {path}"
            )

        for section in REQUIRED_SECTIONS[name]:
            if section not in text:
                raise AssertionError(
                    f"missing section {section!r}: {path}"
                )

        lowered = text.lower()

        for term in FORBIDDEN_TERMS:
            if term in lowered:
                raise AssertionError(
                    f"forbidden term {term!r}: {path}"
                )

        if "## Safety Boundary" not in text:
            raise AssertionError(
                f"missing safety boundary: {path}"
            )

        checked += 1
        print(f"VALID: {path}")

    print("Production runbooks:        VALID")
    print("Required runbooks:         ", len(required))
    print("Validated runbooks:        ", checked)
    print("Missing runbooks:           0")
    print("Secret-value findings:      0")


if __name__ == "__main__":
    main()
