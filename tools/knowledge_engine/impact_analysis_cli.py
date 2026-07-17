from __future__ import annotations

import argparse
import json
from pathlib import Path

from .impact_analysis import (
    build_impact_analysis,
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate PropertyOS module impact "
            "and blast-radius analysis."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--repository-ir",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "repository.ir.json"
        ),
    )

    parser.add_argument(
        "--dependency-graph",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "dependency-graph.json"
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "impact-analysis.json"
        ),
    )

    return parser.parse_args()


def resolve(
    repository_root: Path,
    path: Path,
) -> Path:
    if path.is_absolute():
        return path

    return repository_root / path


def load(path: Path) -> dict:
    return json.loads(
        path.read_text(encoding="utf-8")
    )


def main() -> int:
    arguments = parse_arguments()

    repository_root = (
        arguments.repository_root.resolve()
    )

    repository_ir_path = resolve(
        repository_root,
        arguments.repository_ir,
    )

    dependency_graph_path = resolve(
        repository_root,
        arguments.dependency_graph,
    )

    output_path = resolve(
        repository_root,
        arguments.output,
    )

    analysis = build_impact_analysis(
        repository_ir=load(
            repository_ir_path
        ),
        dependency_graph=load(
            dependency_graph_path
        ),
    ).document

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path.write_text(
        json.dumps(
            analysis,
            indent=2,
            sort_keys=True,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    summary = analysis["summary"]

    print("PropertyOS Module Impact Analysis")
    print(f"Repository:       {repository_root}")
    print(
        "Modules:          "
        f"{summary['moduleCount']}"
    )
    print(
        "Critical:         "
        f"{summary['criticalModuleCount']}"
    )
    print(
        "High impact:      "
        f"{summary['highImpactModuleCount']}"
    )
    print(
        "Migration risks:  "
        f"{summary['architectureMigrationRiskCount']}"
    )
    print(
        "Highest score:    "
        f"{summary['highestRiskScore']}"
    )
    print(
        "Average score:    "
        f"{summary['averageRiskScore']}"
    )
    print(f"Output:           {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
