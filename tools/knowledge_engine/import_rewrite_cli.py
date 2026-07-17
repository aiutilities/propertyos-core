from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .import_rewrite_formatter import (
    format_import_rewrite_json,
    format_import_rewrite_markdown,
)
from .import_rewrite_models import (
    ImportRewriteRequest,
)
from .import_rewriter import (
    ImportRewriteError,
    StagedImportRewriter,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Plan or apply deterministic import "
            "rewrites in dependency-closed staged "
            "plugin workspaces."
        )
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--staging-root",
        type=Path,
        default=Path(
            "generated/plugin-staging"
        ),
    )

    parser.add_argument(
        "--format",
        choices=(
            "json",
            "markdown",
        ),
        default="json",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
    )

    parser.add_argument(
        "--apply",
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
    arguments = (
        build_parser().parse_args()
    )

    request = ImportRewriteRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
        apply=arguments.apply,
    )

    try:
        repository_root = (
            arguments.repository_root
            .resolve()
        )

        portfolio = (
            StagedImportRewriter(
                repository=Repository.load(
                    repository_root
                ),
                repository_root=(
                    repository_root
                ),
                staging_root=(
                    arguments.staging_root
                ),
            ).rewrite(request)
        )

        if arguments.format == "markdown":
            output = (
                format_import_rewrite_markdown(
                    portfolio
                )
            )
        else:
            output = (
                format_import_rewrite_json(
                    portfolio
                )
            )

        print(output, end="")

        return (
            0
            if portfolio.summary[
                "invalidPluginCount"
            ]
            == 0
            else 1
        )

    except (
        KeyError,
        ValueError,
        ImportRewriteError,
    ) as error:
        print(
            "Import rewrite error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
