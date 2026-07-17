from __future__ import annotations

import argparse
import json
from pathlib import Path

from .architecture_intelligence import (
    analyse_architecture,
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Analyse PropertyOS architectural alignment."
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
        "--output",
        type=Path,
        default=Path(
            "generated/knowledge/"
            "architecture-intelligence.json"
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


def main() -> int:
    arguments = parse_arguments()

    repository_root = (
        arguments.repository_root.resolve()
    )

    modules_path = resolve_path(
        repository_root,
        arguments.modules,
    )

    output_path = resolve_path(
        repository_root,
        arguments.output,
    )

    modules_manifest = json.loads(
        modules_path.read_text(encoding="utf-8")
    )

    analysis = analyse_architecture(
        modules_manifest
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path.write_text(
        json.dumps(
            analysis.document,
            indent=2,
            sort_keys=True,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    summary = analysis.document["summary"]

    print("PropertyOS Architecture Intelligence")
    print(f"Repository:    {repository_root}")
    print(
        "Modules:       "
        f"{summary['moduleCount']}"
    )
    print(
        "Aligned:       "
        f"{summary['alignedModuleCount']}"
    )
    print(
        "Violations:    "
        f"{summary['violationCount']}"
    )
    print(
        "Unclassified:  "
        f"{summary['unclassifiedModuleCount']}"
    )
    print(
        "Health score:  "
        f"{summary['architectureHealthScore']}%"
    )
    print(f"Output:        {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
