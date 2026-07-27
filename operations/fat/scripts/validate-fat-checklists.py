#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = json.loads(
    (
        ROOT
        / "contracts"
        / "founder-acceptance-contract.json"
    ).read_text()
)
MANIFEST = json.loads(
    (
        ROOT
        / "contracts"
        / "founder-acceptance-suite-manifest.json"
    ).read_text()
)

CHECKLIST_ROOT = ROOT / "checklists"

REQUIRED_SECTIONS = [
    "## Preconditions",
    "## Acceptance Checks",
    "## Evidence",
    "## Safety Boundary",
]


def main() -> None:
    required = CONTRACT["requiredSuites"]
    manifest_ids = [
        suite["id"]
        for suite in MANIFEST["suites"]
    ]

    assert required == manifest_ids
    assert len(required) == 10

    checked = 0
    total_items = 0

    for suite_id in required:
        path = CHECKLIST_ROOT / f"{suite_id}.md"

        assert path.is_file(), f"missing checklist: {path}"

        text = path.read_text()

        assert text.startswith("# PropertyOS FAT")
        assert text.endswith("\n")

        for section in REQUIRED_SECTIONS:
            assert section in text, (
                f"missing section {section}: {path}"
            )

        item_count = text.count("- [ ]")

        assert item_count >= 10, (
            f"insufficient checklist items: {path}"
        )

        assert "## Safety Boundary" in text

        safety_text = text.split(
            "## Safety Boundary",
            1,
        )[1].strip()

        assert safety_text, (
            f"empty safety boundary: {path}"
        )

        assert len(safety_text) >= 40, (
            f"insufficient safety boundary: {path}"
        )

        checked += 1
        total_items += item_count

        print(
            f"VALID: {path} items={item_count}"
        )

    print("FAT checklists:             VALID")
    print("Required suites:           ", len(required))
    print("Validated checklists:      ", checked)
    print("Checklist items:           ", total_items)
    print("Acceptance authorized:      false")
    print("Production authorized:      false")


if __name__ == "__main__":
    main()
