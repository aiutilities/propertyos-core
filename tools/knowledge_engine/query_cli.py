from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Sequence

from .query_engine import (
    RepositoryQueryEngine,
)
from .query_formatter import (
    format_json,
    format_markdown,
    format_table,
)
from .query_parser import parse_query
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Query the PropertyOS Repository "
            "Intelligence API."
        ),
        epilog=(
            "Examples:\n"
            "  summary\n"
            "  module inventory\n"
            "  dependencies tenant\n"
            "  dependents eventbus --transitive\n"
            "  blast-radius identity\n"
            "  routes procurement\n"
            "  violations\n"
            "  plugin-candidates\n"
            "  top-risk 10\n"
            "  find-route invoice"
        ),
        formatter_class=(
            argparse.RawDescriptionHelpFormatter
        ),
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )

    parser.add_argument(
        "--format",
        choices=(
            "table",
            "markdown",
            "json",
        ),
        default="table",
    )

    parser.add_argument(
        "query",
        nargs=argparse.REMAINDER,
    )

    return parser


def run(
    arguments: Sequence[str],
) -> int:
    parser = build_parser()

    parsed = parser.parse_args(
        list(arguments)
    )

    if not parsed.query:
        parser.error(
            "A repository query is required."
        )

    try:
        request = parse_query(
            parsed.query
        )

        repository = Repository.load(
            parsed.repository_root
        )

        result = RepositoryQueryEngine(
            repository
        ).execute(request)

        if parsed.format == "json":
            output = format_json(result)
        elif parsed.format == "markdown":
            output = format_markdown(result)
        else:
            output = format_table(result)

        print(
            output,
            end="",
        )

        return 0

    except (
        KeyError,
        ValueError,
    ) as error:
        print(
            f"Query error: {error}",
            file=sys.stderr,
        )

        return 2


def main() -> int:
    return run(sys.argv[1:])


if __name__ == "__main__":
    raise SystemExit(main())
