from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .materialization_formatter import (
    format_materialization_json,
    format_materialization_markdown,
)
from .materialization_models import (
    MaterializationRequest,
)
from .materializer import (
    MaterializationError,
    StagedPluginMaterializer,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Copy validated plugin extraction "
            "blueprints into isolated staged "
            "workspaces."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path(
            "generated/plugin-staging"
        ),
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
        "--overwrite",
        action="store_true",
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

    request = MaterializationRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
        overwrite=arguments.overwrite,
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
            StagedPluginMaterializer(
                repository=repository,
                repository_root=(
                    repository_root
                ),
                output_root=(
                    arguments.output_root
                ),
            ).materialize(request)
        )

        if arguments.format == "markdown":
            output = (
                format_materialization_markdown(
                    portfolio
                )
            )
        else:
            output = (
                format_materialization_json(
                    portfolio
                )
            )

        print(output, end="")
        return 0

    except (
        KeyError,
        ValueError,
        MaterializationError,
    ) as error:
        print(
            "Materialization error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
