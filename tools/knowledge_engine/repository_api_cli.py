from __future__ import annotations

import argparse
import json
from pathlib import Path

from .repository_api import Repository


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Verify the PropertyOS Repository "
            "Intelligence API."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
    )

    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()

    repository = Repository.load(
        arguments.repository_root
    )

    top_risk = (
        repository.high_risk_modules(
            limit=5
        )
    )

    result = {
        "summary": (
            repository.to_summary_dict()
        ),
        "highestRiskModules": [
            {
                "moduleId": module.id,
                "riskScore": (
                    module.impact.risk_score
                ),
                "criticality": (
                    module.impact
                    .criticality_tier
                ),
                "blastRadius": (
                    module.impact
                    .blast_radius
                ),
            }
            for module in top_risk
        ],
        "architectureViolationCount": len(
            repository.architecture_violations()
        ),
        "pluginCandidateCount": len(
            repository.plugin_candidates()
        ),
        "status": "valid",
    }

    if arguments.json_output:
        print(
            json.dumps(
                result,
                indent=2,
                sort_keys=True,
            )
        )

        return 0

    summary = repository.summary

    print(
        "PropertyOS Repository "
        "Intelligence API"
    )

    print(
        f"Modules:                 "
        f"{summary.module_count}"
    )

    print(
        f"Components:              "
        f"{summary.component_count}"
    )

    print(
        f"Controllers:             "
        f"{summary.controller_count}"
    )

    print(
        f"Routes:                  "
        f"{summary.route_count}"
    )

    print(
        f"Internal dependencies:   "
        f"{summary.internal_dependency_count}"
    )

    print(
        f"Architecture violations: "
        f"{summary.architecture_violation_count}"
    )

    print(
        f"Plugin candidates:       "
        f"{len(repository.plugin_candidates())}"
    )

    print()
    print("Highest-risk modules:")

    for index, module in enumerate(
        top_risk,
        start=1,
    ):
        print(
            f"{index}. {module.id}: "
            f"{module.impact.risk_score} "
            f"({module.impact.criticality_tier})"
        )

    print()
    print("Repository API status: PASS")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
