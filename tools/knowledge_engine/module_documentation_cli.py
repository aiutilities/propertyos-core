from __future__ import annotations

import argparse
import json
from pathlib import Path

from .module_documentation import (
    build_module_documentation,
    write_module_documentation,
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate synchronized PropertyOS "
            "module documentation."
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
        "--impact-analysis",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "impact-analysis.json"
        ),
    )

    parser.add_argument(
        "--output-directory",
        type=Path,
        default=Path(
            "docs/generated/modules"
        ),
    )

    return parser.parse_args()


def resolve(
    repository_root: Path,
    value: Path,
) -> Path:
    if value.is_absolute():
        return value

    return repository_root / value


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

    impact_analysis_path = resolve(
        repository_root,
        arguments.impact_analysis,
    )

    output_directory = resolve(
        repository_root,
        arguments.output_directory,
    )

    documentation = (
        build_module_documentation(
            repository_ir=load(
                repository_ir_path
            ),
            dependency_graph=load(
                dependency_graph_path
            ),
            impact_analysis=load(
                impact_analysis_path
            ),
        )
    )

    write_module_documentation(
        output_directory=output_directory,
        documentation=documentation,
    )

    module_page_count = (
        len(documentation.documents) - 1
    )

    print(
        "PropertyOS Module Documentation"
    )
    print(f"Repository:    {repository_root}")
    print(
        "Module pages:  "
        f"{module_page_count}"
    )
    print(
        "Index pages:   1"
    )
    print(
        "Total files:   "
        f"{len(documentation.documents)}"
    )
    print(
        f"Output:        {output_directory}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
