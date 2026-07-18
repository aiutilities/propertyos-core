from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Sequence, Type

from .plugin_package_portfolio import (
    PluginPackagePortfolioBuilder,
)
from .plugin_package_portfolio_formatter import (
    format_plugin_package_portfolio,
)
from .repository_api import Repository


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Build and verify PropertyOS plugin "
            "package artifacts."
        )
    )

    parser.add_argument(
        "--repository-root",
        default=".",
    )
    parser.add_argument(
        "--staging-root",
        default=(
            "generated/plugin-staging"
        ),
    )
    parser.add_argument(
        "--artifact-root",
        default=(
            "generated/plugin-artifacts"
        ),
    )

    selection = parser.add_mutually_exclusive_group(
        required=True
    )
    selection.add_argument(
        "--all",
        action="store_true",
        help=(
            "Package every staged plugin workspace."
        ),
    )
    selection.add_argument(
        "--modules",
        help=(
            "Comma-separated module IDs in "
            "packaging order."
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
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
        "--output",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
    )

    return parser


def _explicit_modules(
    value: str,
) -> tuple[str, ...]:
    modules = tuple(
        module.strip()
        for module in value.split(",")
    )

    if (
        not modules
        or any(
            not module
            for module in modules
        )
    ):
        raise ValueError(
            "Module list cannot contain empty "
            "values."
        )

    if len(set(modules)) != len(modules):
        raise ValueError(
            "Module list cannot contain "
            "duplicates."
        )

    return modules


def _staged_modules(
    staging_root: Path,
) -> tuple[str, ...]:
    if not staging_root.is_dir():
        raise ValueError(
            "Staging root does not exist: "
            + staging_root.as_posix()
        )

    modules = tuple(
        workspace.name
        for workspace in sorted(
            staging_root.iterdir(),
            key=lambda path: path.name,
        )
        if workspace.is_dir()
        and (
            workspace
            / "package.json"
        ).is_file()
        and (
            workspace
            / "plugin.json"
        ).is_file()
    )

    if not modules:
        raise ValueError(
            "No staged plugin workspaces were "
            "found."
        )

    return modules


def _safe_path(
    repository_root: Path,
    value: str,
    label: str,
) -> Path:
    path = Path(value)

    resolved = (
        path.resolve()
        if path.is_absolute()
        else (
            repository_root
            / path
        ).resolve()
    )

    try:
        resolved.relative_to(
            repository_root
        )
    except ValueError as error:
        raise ValueError(
            f"{label} must remain inside the "
            "repository."
        ) from error

    return resolved


def run(
    argv: Sequence[str] | None = None,
    builder_type: Type[
        PluginPackagePortfolioBuilder
    ] = PluginPackagePortfolioBuilder,
) -> int:
    arguments = _parser().parse_args(argv)

    try:
        repository_root = Path(
            arguments.repository_root
        ).resolve()

        repository = Repository.load(
            repository_root
        )

        staging_root = _safe_path(
            repository_root,
            arguments.staging_root,
            "Staging root",
        )
        artifact_root = _safe_path(
            repository_root,
            arguments.artifact_root,
            "Artifact root",
        )

        module_ids = (
            _staged_modules(staging_root)
            if arguments.all
            else _explicit_modules(
                arguments.modules
            )
        )

        if arguments.limit is not None:
            if arguments.limit <= 0:
                raise ValueError(
                    "Limit must be greater than "
                    "zero."
                )

            module_ids = module_ids[
                :arguments.limit
            ]

        builder = builder_type(
            repository=repository,
            repository_root=(
                repository_root
            ),
            staging_root=staging_root,
            artifact_root=artifact_root,
        )

        portfolio = builder.build(
            module_ids=module_ids,
            overwrite=arguments.overwrite,
        )

        report = (
            format_plugin_package_portfolio(
                portfolio,
                arguments.format,
            )
        )

        if arguments.output:
            output_path = _safe_path(
                repository_root,
                arguments.output,
                "Output path",
            )
            output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )
            output_path.write_text(
                report,
                encoding="utf-8",
            )
        else:
            print(
                report,
                end="",
            )

        return (
            0
            if portfolio.successful
            else 1
        )

    except (
        OSError,
        ValueError,
    ) as error:
        print(
            f"Plugin package portfolio error: "
            f"{error}",
            file=sys.stderr,
        )
        return 2


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
