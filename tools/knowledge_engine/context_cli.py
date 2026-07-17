from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .context_engine import (
    ContextResolutionError,
    RepositoryContextEngine,
)
from .context_formatter import (
    format_context_json,
    format_context_markdown,
)
from .context_models import ContextRequest
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate deterministic repository "
            "context for coding assistants."
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
        "--depth",
        type=int,
        default=1,
    )

    parser.add_argument(
        "--route-limit",
        type=int,
        default=50,
    )

    parser.add_argument(
        "mode",
        choices=("module", "task"),
    )

    parser.add_argument(
        "value",
        nargs="+",
    )

    return parser


def main() -> int:
    parser = build_parser()
    arguments = parser.parse_args()

    request = ContextRequest(
        mode=arguments.mode,
        value=" ".join(arguments.value),
        depth=arguments.depth,
        route_limit=arguments.route_limit,
    )

    try:
        repository = Repository.load(
            arguments.repository_root
        )

        package = RepositoryContextEngine(
            repository
        ).generate(request)

        if arguments.format == "markdown":
            output = format_context_markdown(
                package
            )
        else:
            output = format_context_json(
                package
            )

        print(output, end="")
        return 0

    except (
        KeyError,
        ValueError,
        ContextResolutionError,
    ) as error:
        print(
            f"Context error: {error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
