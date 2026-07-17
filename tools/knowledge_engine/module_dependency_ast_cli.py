from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Any


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract Nest module imports with the "
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
            "generated/knowledge/"
            "module-dependencies.ast.json"
        ),
    )

    return parser.parse_args()


def resolve_path(
    repository_root: Path,
    value: Path,
) -> Path:
    if value.is_absolute():
        return value

    return repository_root / value


def generate_module_dependency_ast(
    repository_root: Path,
    output: Path,
) -> dict[str, Any]:
    repository_root = repository_root.resolve()

    output = resolve_path(
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
        / "module-dependency-extractor.ts"
    )

    project = (
        repository_root
        / "backend"
        / "tools"
        / "knowledge-engine"
        / "tsconfig.json"
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
            "Module dependency extraction failed.\n"
            f"STDOUT:\n{completed.stdout}\n"
            f"STDERR:\n{completed.stderr}"
        )

    if not output.exists():
        raise RuntimeError(
            "Extractor did not create output: "
            f"{output}"
        )

    return json.loads(
        output.read_text(encoding="utf-8")
    )


def main() -> int:
    arguments = parse_arguments()

    repository_root = (
        arguments.repository_root.resolve()
    )

    output = resolve_path(
        repository_root,
        arguments.output,
    )

    document = generate_module_dependency_ast(
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
                "moduleCount": (
                    document["moduleCount"]
                ),
                "importReferenceCount": (
                    document[
                        "importReferenceCount"
                    ]
                ),
            },
            indent=2,
        )
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
