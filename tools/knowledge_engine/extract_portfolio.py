from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional, Sequence

from .extraction_portfolio import (
    ExtractionPortfolioError,
    ModuleExtractionPortfolio,
)
from .extraction_portfolio_formatter import (
    format_extraction_portfolio_json,
    format_extraction_portfolio_markdown,
)
from .repository_api import Repository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Extract and validate a portfolio of "
            "PropertyOS backend modules as "
            "standalone plugin workspaces."
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

    selection = parser.add_mutually_exclusive_group(
        required=True
    )

    selection.add_argument(
        "--all",
        action="store_true",
        help=(
            "Extract every plugin-capable "
            "candidate module."
        ),
    )

    selection.add_argument(
        "--modules",
        help=(
            "Comma-separated module IDs in "
            "execution order."
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
    )

    parser.add_argument(
        "--format",
        choices=("json", "markdown"),
        default="json",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=None,
    )

    parser.add_argument(
        "--skip-install",
        action="store_true",
    )

    parser.add_argument(
        "--skip-compile",
        action="store_true",
    )

    parser.add_argument(
        "--no-overwrite",
        action="store_true",
    )

    return parser


def _module_ids(
    value: Optional[str],
) -> Sequence[str]:
    if value is None:
        return ()

    module_ids = tuple(
        module_id.strip()
        for module_id in value.split(",")
        if module_id.strip()
    )

    if not module_ids:
        raise ExtractionPortfolioError(
            "At least one module ID is required."
        )

    return module_ids


def _write_output(
    output_path: Path,
    repository_root: Path,
    content: str,
) -> None:
    target = output_path

    if not target.is_absolute():
        target = (
            repository_root
            / target
        )

    target = target.resolve()
    target.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    target.write_text(
        content,
        encoding="utf-8",
    )


def main(
    argv=None,
    extractor_factory=ModuleExtractionPortfolio,
) -> int:
    parser = build_parser()
    arguments = parser.parse_args(argv)

    try:
        repository_root = (
            arguments.repository_root.resolve()
        )

        portfolio = extractor_factory(
            repository=Repository.load(
                repository_root
            ),
            repository_root=repository_root,
            staging_root=(
                arguments.staging_root
            ),
        ).extract(
            module_ids=_module_ids(
                arguments.modules
            ),
            limit=arguments.limit,
            install=not arguments.skip_install,
            compile_plugin=(
                not arguments.skip_compile
            ),
            overwrite=(
                not arguments.no_overwrite
            ),
        )

        if arguments.format == "markdown":
            output = (
                format_extraction_portfolio_markdown(
                    portfolio
                )
            )
        else:
            output = (
                format_extraction_portfolio_json(
                    portfolio
                )
            )

        print(output, end="")

        if arguments.output is not None:
            _write_output(
                output_path=arguments.output,
                repository_root=repository_root,
                content=output,
            )

        return (
            0
            if portfolio.is_successful
            else 1
        )

    except (
        ExtractionPortfolioError,
        KeyError,
        OSError,
        ValueError,
    ) as error:
        print(
            "Extraction portfolio failed: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
