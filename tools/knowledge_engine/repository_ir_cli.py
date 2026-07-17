from __future__ import annotations

import argparse
import json
from pathlib import Path

from .repository_ir import build_repository_ir


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate the PropertyOS unified "
            "repository intermediate representation."
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
        "--controllers",
        type=Path,
        default=Path(
            "generated/knowledge/controllers.json"
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
        "--output",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "repository.ir.json"
        ),
    )

    return parser.parse_args()


def resolve_path(
    repository_root: Path,
    path: Path,
) -> Path:
    if path.is_absolute():
        return path

    return repository_root / path


def load_json(path: Path) -> dict:
    return json.loads(
        path.read_text(encoding="utf-8")
    )


def main() -> int:
    arguments = parse_arguments()

    repository_root = (
        arguments.repository_root.resolve()
    )

    modules_path = resolve_path(
        repository_root,
        arguments.modules,
    )

    controllers_path = resolve_path(
        repository_root,
        arguments.controllers,
    )

    architecture_path = resolve_path(
        repository_root,
        arguments.architecture,
    )

    output_path = resolve_path(
        repository_root,
        arguments.output,
    )

    repository_ir = build_repository_ir(
        modules_manifest=load_json(
            modules_path
        ),
        controllers_manifest=load_json(
            controllers_path
        ),
        architecture_manifest=load_json(
            architecture_path
        ),
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path.write_text(
        json.dumps(
            repository_ir.document,
            indent=2,
            sort_keys=True,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    summary = repository_ir.document["summary"]
    integrity = repository_ir.document["integrity"]

    print("PropertyOS Unified Repository IR")
    print(f"Repository:     {repository_root}")
    print(
        "Modules:        "
        f"{summary['moduleCount']}"
    )
    print(
        "Components:     "
        f"{summary['componentCount']}"
    )
    print(
        "Controllers:    "
        f"{summary['controllerCount']}"
    )
    print(
        "Routes:         "
        f"{summary['routeCount']}"
    )
    print(
        "Relationships:  "
        f"{summary['relationshipCount']}"
    )
    print(
        "Integrity:      "
        f"{'PASS' if integrity['valid'] else 'FAIL'}"
    )
    print(f"Output:         {output_path}")

    return 0 if integrity["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
