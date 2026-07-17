from __future__ import annotations

import argparse
import json
from pathlib import Path

from .dependency_graph import (
    build_dependency_graph,
)
from .module_dependency_ast_cli import (
    generate_module_dependency_ast,
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate the PropertyOS Nest module "
            "dependency graph."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--modules",
        type=Path,
        default=Path(
            "generated/knowledge/modules.json"
        ),
    )

    parser.add_argument(
        "--architecture",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "architecture-intelligence.json"
        ),
    )

    parser.add_argument(
        "--raw-output",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "module-dependencies.ast.json"
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "dependency-graph.json"
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

    modules_path = resolve(
        repository_root,
        arguments.modules,
    )

    architecture_path = resolve(
        repository_root,
        arguments.architecture,
    )

    raw_output = resolve(
        repository_root,
        arguments.raw_output,
    )

    output = resolve(
        repository_root,
        arguments.output,
    )

    dependency_manifest = (
        generate_module_dependency_ast(
            repository_root=repository_root,
            output=raw_output,
        )
    )

    graph = build_dependency_graph(
        modules_manifest=load(modules_path),
        dependency_manifest=(
            dependency_manifest
        ),
        architecture_manifest=load(
            architecture_path
        ),
    ).document

    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output.write_text(
        json.dumps(
            graph,
            indent=2,
            sort_keys=True,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    summary = graph["summary"]

    print("PropertyOS Module Dependency Graph")
    print(f"Repository:   {repository_root}")
    print(
        "Modules:      "
        f"{summary['moduleCount']}"
    )
    print(
        "Internal:     "
        f"{summary['internalDependencyCount']}"
    )
    print(
        "External:     "
        f"{summary['externalDependencyCount']}"
    )
    print(
        "Unresolved:   "
        f"{summary['unresolvedReferenceCount']}"
    )
    print(
        "Self edges:   "
        f"{summary['selfDependencyCount']}"
    )
    print(
        "Duplicates:   "
        f"{summary['duplicateEdgeCount']}"
    )
    print(f"Output:       {output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
