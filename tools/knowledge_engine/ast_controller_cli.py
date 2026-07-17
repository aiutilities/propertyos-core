from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Any


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


def resolve_output(
    repository_root: Path,
    output: Path,
) -> Path:
    if output.is_absolute():
        return output

    return repository_root / output


def generate_ast_controller_knowledge(
    repository_root: Path,
    output: Path,
) -> dict[str, Any]:
    repository_root = repository_root.resolve()

    output = resolve_output(
        repository_root,
        output,
    )

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

    project = (
        repository_root
        / "backend"
        / "tools"
        / "knowledge-engine"
        / "tsconfig.json"
    )

    if not ts_node.exists():
        raise RuntimeError(
            "backend/node_modules/.bin/ts-node "
            "was not found. Run npm install "
            "inside backend first."
        )

    if not extractor.exists():
        raise RuntimeError(
            "TypeScript AST extractor was not found: "
            f"{extractor}"
        )

    environment = dict(os.environ)
    environment["NODE_PATH"] = str(
        repository_root
        / "backend"
        / "node_modules"
    )

    completed = subprocess.run(
        [
            str(ts_node),
            "--project",
            str(project),
            str(extractor),
            str(repository_root),
            str(output),
        ],
        cwd=repository_root,
        env=environment,
        check=False,
        capture_output=True,
        text=True,
    )

    if completed.returncode != 0:
        raise RuntimeError(
            "AST controller extraction failed.\n"
            f"STDOUT:\n{completed.stdout}\n"
            f"STDERR:\n{completed.stderr}"
        )

    if not output.exists():
        raise RuntimeError(
            "AST extractor completed without creating "
            f"the expected output: {output}"
        )

    return json.loads(
        output.read_text(encoding="utf-8")
    )


def main() -> int:
    arguments = build_parser().parse_args()

    repository_root = (
        arguments.repository_root.resolve()
    )

    output = resolve_output(
        repository_root,
        arguments.output,
    )

    document = generate_ast_controller_knowledge(
        repository_root=repository_root,
        output=output,
    )

    print(
        json.dumps(
            {
                "outputPath": str(
                    output.relative_to(
                        repository_root
                    )
                ),
                "controllerCount": (
                    document["controllerCount"]
                ),
                "routeCount": (
                    document["routeCount"]
                ),
            },
            indent=2,
        )
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
