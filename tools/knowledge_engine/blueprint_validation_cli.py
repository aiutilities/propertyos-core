from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .blueprint_validation_formatter import (
    format_validation_json,
    format_validation_markdown,
)
from .blueprint_validation_models import (
    BlueprintValidationRequest,
)
from .blueprint_validator import (
    BlueprintValidationError,
    PluginBlueprintValidator,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Validate plugin extraction "
            "blueprints and generate a dry-run "
            "execution report."
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

    request = BlueprintValidationRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
    )

    try:
        repository_root = (
            arguments.repository_root
            .resolve()
        )

        repository = Repository.load(
            repository_root
        )

        portfolio = (
            PluginBlueprintValidator(
                repository,
                repository_root,
            ).validate(request)
        )

        if arguments.format == "markdown":
            output = (
                format_validation_markdown(
                    portfolio
                )
            )
        else:
            output = format_validation_json(
                portfolio
            )

        print(output, end="")

        return 0 if portfolio.valid else 1

    except (
        KeyError,
        ValueError,
        BlueprintValidationError,
    ) as error:
        print(
            "Blueprint validation error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
