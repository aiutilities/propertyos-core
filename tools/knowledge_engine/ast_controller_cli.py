from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate controller knowledge using the "
            "TypeScript Compiler API."
        )
    )
    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "generated/knowledge/controllers.ast.json"
        ),
    )
    return parser


def main() -> int:
    arguments = build_parser().parse_args()

    repository_root = (
        arguments.repository_root.resolve()
    )

    output = arguments.output

    if not output.is_absolute():
        output = repository_root / output

    ts_node = (
        repository_root
        / "backend"
        / "node_modules"
        / ".bin"
        / "ts-node"
    )

    extractor = (
        repository_root
        / "backend"
        / "tools"
        / "knowledge-engine"
        / "controller-ast-extractor.ts"
    )

    if not ts_node.exists():
        raise SystemExit(
            "backend/node_modules/.bin/ts-node was not found. "
            "Run npm install in backend first."
        )

    environment = dict(os.environ)
    environment["NODE_PATH"] = str(
        repository_root / "backend" / "node_modules"
    )

    completed = subprocess.run(
        [
            str(ts_node),
            "--project",
            str(
                repository_root
                / "backend"
                / "tools"
                / "knowledge-engine"
                / "tsconfig.json"
            ),
            str(extractor),
            str(repository_root),
            str(output),
        ],
        cwd=repository_root,
        env=environment,
        check=False,
    )

    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
