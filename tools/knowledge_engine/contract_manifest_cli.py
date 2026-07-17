from __future__ import annotations

import argparse
import sys

from pathlib import Path
from typing import Optional
from typing import Sequence

from .contract_manifest import (
    ContractManifestError,
)
from .contract_manifest import (
    ContractManifestGenerator,
)
from .contract_manifest_formatter import (
    format_contract_manifest_json,
)
from .contract_manifest_formatter import (
    format_contract_manifest_markdown,
)
from .contract_manifest_models import (
    ContractManifestRequest,
)
from .import_analysis_models import (
    ImportAnalysisRequest,
)
from .import_analyzer import (
    ImportAnalysisError,
)
from .import_analyzer import (
    StagedImportAnalyzer,
)
from .repository_api import Repository
from .repository_api import (
    RepositoryIntegrityError,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate deterministic public "
            "contract manifests from staged "
            "plugin import analysis."
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
        "--package-name",
        default=(
            "@propertyos/core-contracts"
        ),
    )

    parser.add_argument(
        "--package-version",
        default="0.1.0",
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


def run(
    arguments: argparse.Namespace,
) -> int:
    repository_root = (
        arguments.repository_root.resolve()
    )

    repository = Repository.load(
        repository_root
    )

    import_request = ImportAnalysisRequest(
        mode=arguments.mode,
        module_id=arguments.module_id,
        limit=arguments.limit,
    )

    import_analysis = StagedImportAnalyzer(
        repository=repository,
        repository_root=repository_root,
        staging_root=(
            arguments.staging_root
        ),
    ).analyze(import_request)

    manifest_request = (
        ContractManifestRequest(
            mode=arguments.mode,
            module_id=arguments.module_id,
            limit=arguments.limit,
            package_name=(
                arguments.package_name
            ),
            package_version=(
                arguments.package_version
            ),
        )
    )

    portfolio = ContractManifestGenerator(
        repository_root=repository_root
    ).generate(
        import_analysis=import_analysis,
        request=manifest_request,
    )

    if arguments.format == "markdown":
        output = (
            format_contract_manifest_markdown(
                portfolio
            )
        )
    else:
        output = (
            format_contract_manifest_json(
                portfolio
            )
        )

    print(output, end="")

    return (
        0
        if (
            portfolio.summary[
                "invalidManifestCount"
            ]
            == 0
            and portfolio.summary[
                "unresolvedSymbolCount"
            ]
            == 0
            and portfolio.summary[
                "duplicateSymbolCount"
            ]
            == 0
        )
        else 1
    )


def main(
    argv: Optional[
        Sequence[str]
    ] = None,
) -> int:
    parser = build_parser()
    arguments = parser.parse_args(argv)

    try:
        return run(arguments)
    except (
        KeyError,
        ValueError,
        ImportAnalysisError,
        ContractManifestError,
        RepositoryIntegrityError,
    ) as error:
        print(
            "Contract manifest error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
