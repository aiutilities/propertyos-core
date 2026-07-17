from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .migration_formatter import (
    format_migration_json,
    format_migration_markdown,
)
from .migration_models import (
    MigrationRequest,
)
from .migration_planner import (
    MigrationPlanningError,
    RepositoryMigrationPlanner,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate deterministic, "
            "dependency-aware module "
            "migration plans."
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

    request = MigrationRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
    )

    try:
        repository = Repository.load(
            arguments.repository_root
        )

        portfolio = (
            RepositoryMigrationPlanner(
                repository
            ).generate(request)
        )

        if arguments.format == "markdown":
            output = (
                format_migration_markdown(
                    portfolio
                )
            )
        else:
            output = format_migration_json(
                portfolio
            )

        print(output, end="")
        return 0

    except (
        KeyError,
        ValueError,
        MigrationPlanningError,
    ) as error:
        print(
            f"Migration planning error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
