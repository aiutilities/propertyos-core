from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .blueprint_formatter import (
    format_blueprint_json,
    format_blueprint_markdown,
)
from .blueprint_generator import (
    BlueprintGenerationError,
    PluginBlueprintGenerator,
)
from .blueprint_models import (
    BlueprintRequest,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate deterministic plugin "
            "extraction blueprints."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--format",
        choices=("json", "markdown"),
        default="json",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
    )

    parser.add_argument(
        "mode",
        choices=(
            "module",
            "candidates",
        ),
    )

    parser.add_argument(
        "module_id",
        nargs="?",
    )

    return parser


def main() -> int:
    parser = build_parser()
    arguments = parser.parse_args()

    request = BlueprintRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
    )

    try:
        repository = Repository.load(
            arguments.repository_root
        )

        portfolio = (
            PluginBlueprintGenerator(
                repository
            ).generate(request)
        )

        if arguments.format == "markdown":
            output = (
                format_blueprint_markdown(
                    portfolio
                )
            )
        else:
            output = format_blueprint_json(
                portfolio
            )

        print(output, end="")
        return 0

    except (
        KeyError,
        ValueError,
        BlueprintGenerationError,
    ) as error:
        print(
            f"Blueprint generation error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
