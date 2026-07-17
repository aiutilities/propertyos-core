from __future__ import annotations

import argparse
import sys

from pathlib import Path

from tools.knowledge_engine.dependency_closure import (
    DependencyClosureError,
)
from tools.knowledge_engine.dependency_closure import (
    TransitiveDependencyClosure,
)
from tools.knowledge_engine.dependency_closure_formatter import (
    format_json,
)
from tools.knowledge_engine.dependency_closure_formatter import (
    format_markdown,
)
from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosureRequest,
)


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(
        description=(
            "Discover and optionally stage "
            "module-owned transitive source "
            "dependencies."
        )
    )

    value.add_argument(
        "--repository-root",
        default=".",
    )

    value.add_argument(
        "--staging-root",
        default=(
            "generated/plugin-staging"
        ),
    )

    value.add_argument(
        "--format",
        choices=(
            "json",
            "markdown",
        ),
        default="json",
    )

    value.add_argument(
        "--limit",
        type=int,
    )

    value.add_argument(
        "--apply",
        action="store_true",
    )

    value.add_argument(
        "--overwrite",
        action="store_true",
    )

    subparsers = value.add_subparsers(
        dest="mode",
        required=True,
    )

    module = subparsers.add_parser(
        "module"
    )

    module.add_argument(
        "module_id"
    )

    subparsers.add_parser(
        "candidates"
    )

    subparsers.add_parser(
        "all"
    )

    return value


def main() -> int:
    arguments = parser().parse_args()

    repository_root = Path(
        arguments.repository_root
    ).resolve()

    staging_root = (
        repository_root
        / arguments.staging_root
    ).resolve()

    try:
        portfolio = (
            TransitiveDependencyClosure(
                repository_root=(
                    repository_root
                ),
                staging_root=(
                    staging_root
                ),
            ).analyze(
                DependencyClosureRequest(
                    mode=arguments.mode,
                    module_id=getattr(
                        arguments,
                        "module_id",
                        None,
                    ),
                    limit=arguments.limit,
                    apply=arguments.apply,
                    overwrite=(
                        arguments.overwrite
                    ),
                )
            )
        )
    except (
        DependencyClosureError,
        FileNotFoundError,
        json_error(),
    ) as error:
        print(
            f"Dependency closure failed: "
            f"{error}",
            file=sys.stderr,
        )

        return 2

    if arguments.format == "markdown":
        from tools.knowledge_engine.dependency_closure_formatter import (
            format_markdown,
        )

        print(
            format_markdown(
                portfolio
            ),
            end="",
        )
    else:
        print(
            format_json(
                portfolio
            ),
            end="",
        )

    return (
        0
        if portfolio.invalid_plugin_count == 0
        else 1
    )


def json_error() -> type[Exception]:
    import json

    return json.JSONDecodeError


if __name__ == "__main__":
    raise SystemExit(
        main()
    )
