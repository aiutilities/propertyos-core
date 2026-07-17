from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .import_analysis_formatter import (
    format_import_analysis_json,
    format_import_analysis_markdown,
)
from .import_analysis_models import (
    ImportAnalysisRequest,
)
from .import_analyzer import (
    ImportAnalysisError,
    StagedImportAnalyzer,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze imports in staged plugin "
            "workspaces and generate deterministic "
            "rewrite plans."
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

    request = ImportAnalysisRequest(
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

        portfolio = StagedImportAnalyzer(
            repository=repository,
            repository_root=(
                repository_root
            ),
            staging_root=(
                arguments.staging_root
            ),
        ).analyze(request)

        if arguments.format == "markdown":
            output = (
                format_import_analysis_markdown(
                    portfolio
                )
            )
        else:
            output = (
                format_import_analysis_json(
                    portfolio
                )
            )

        print(output, end="")

        return (
            0
            if portfolio.summary[
                "unresolvedCount"
            ] == 0
            else 1
        )

    except (
        KeyError,
        ValueError,
        ImportAnalysisError,
    ) as error:
        print(
            "Import analysis error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
