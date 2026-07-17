from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from tools.knowledge_engine.ast_controller_cli import (
    generate_ast_controller_knowledge,
)
from tools.knowledge_engine.controller_scanner import (
    ControllerScanner,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate PropertyOS controller knowledge. "
            "The TypeScript compiler engine is canonical; "
            "the regex engine remains available for rollback."
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
            "generated/knowledge/controllers.json"
        ),
    )

    parser.add_argument(
        "--engine",
        choices=("ast", "regex"),
        default="ast",
    )

    return parser


def resolve_output(
    repository_root: Path,
    output: Path,
) -> Path:
    if output.is_absolute():
        return output

    return repository_root / output


def write_manifest(
    output: Path,
    manifest: dict[str, Any],
) -> None:
    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output.write_text(
        json.dumps(
            manifest,
            indent=2,
            sort_keys=False,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )


def generate_regex_controller_knowledge(
    repository_root: Path,
    output: Path,
) -> dict[str, Any]:
    manifest = ControllerScanner(
        repository_root
    ).scan()

    document = manifest.to_dict()

    write_manifest(
        output,
        document,
    )

    return document


def generate_controller_knowledge(
    repository_root: Path,
    output: Path,
    engine: str = "ast",
) -> dict[str, Any]:
    repository_root = repository_root.resolve()
    output = resolve_output(
        repository_root,
        output,
    )

    if engine == "ast":
        return generate_ast_controller_knowledge(
            repository_root=repository_root,
            output=output,
        )

    if engine == "regex":
        return generate_regex_controller_knowledge(
            repository_root=repository_root,
            output=output,
        )

    raise ValueError(
        f"Unsupported controller engine: {engine}"
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

    document = generate_controller_knowledge(
        repository_root=repository_root,
        output=output,
        engine=arguments.engine,
    )

    print("PropertyOS Controller Knowledge Engine")
    print(f"Repository:  {repository_root}")
    print(f"Engine:      {arguments.engine}")
    print(
        "Controllers: "
        f"{document['controllerCount']}"
    )
    print(f"Routes:      {document['routeCount']}")
    print(f"Output:      {output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
