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
from .contract_manifest_models import (
    ContractManifestRequest,
)
from .contract_package_formatter import (
    format_contract_package_json,
)
from .contract_package_formatter import (
    format_contract_package_markdown,
)
from .contract_package_generator import (
    ContractPackageGenerationError,
)
from .contract_package_generator import (
    ContractPackageGenerator,
)
from .contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from .contract_package_layout import (
    ContractPackageLayoutError,
)
from .contract_package_layout import (
    ContractPackageLayoutPlanner,
)
from .contract_package_layout_models import (
    ContractPackageLayoutRequest,
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
            "Plan, validate, and optionally "
            "generate deterministic PropertyOS "
            "contract package facades."
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
        "--output-root",
        default="generated/contracts",
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
        "--source-strategy",
        choices=(
            "repository-reexport",
        ),
        default="repository-reexport",
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


def _resolve_repository_path(
    repository_root: Path,
    value: Path,
) -> Path:
    if value.is_absolute():
        return value.resolve()

    return (
        repository_root
        / value
    ).resolve()


def _validate_arguments(
    arguments: argparse.Namespace,
) -> None:
    if (
        arguments.overwrite
        and not arguments.apply
    ):
        raise ValueError(
            "--overwrite requires --apply."
        )

    if (
        arguments.mode == "module"
        and not arguments.module_id
    ):
        raise ValueError(
            "module mode requires module_id."
        )

    if (
        arguments.mode != "module"
        and arguments.module_id
    ):
        raise ValueError(
            "module_id is only valid in "
            "module mode."
        )


def run(
    arguments: argparse.Namespace,
) -> int:
    _validate_arguments(arguments)

    repository_root = (
        arguments.repository_root.resolve()
    )

    staging_root = (
        _resolve_repository_path(
            repository_root,
            arguments.staging_root,
        )
    )

    repository = Repository.load(
        repository_root
    )

    import_analysis = StagedImportAnalyzer(
        repository=repository,
        repository_root=repository_root,
        staging_root=staging_root,
    ).analyze(
        ImportAnalysisRequest(
            mode=arguments.mode,
            module_id=arguments.module_id,
            limit=arguments.limit,
        )
    )

    manifest = ContractManifestGenerator(
        repository_root=repository_root
    ).generate(
        import_analysis=import_analysis,
        request=ContractManifestRequest(
            mode=arguments.mode,
            module_id=arguments.module_id,
            limit=arguments.limit,
            package_name=(
                arguments.package_name
            ),
            package_version=(
                arguments.package_version
            ),
        ),
    )

    layout = (
        ContractPackageLayoutPlanner()
        .plan(
            manifest,
            ContractPackageLayoutRequest(
                output_root=(
                    arguments.output_root
                ),
                package_name=(
                    arguments.package_name
                ),
                source_strategy=(
                    arguments.source_strategy
                ),
            ),
        )
    )

    generation = ContractPackageGenerator(
        repository_root=repository_root
    ).generate(
        layout,
        ContractPackageGenerationRequest(
            apply=arguments.apply,
            overwrite=arguments.overwrite,
        ),
    )

    if arguments.format == "markdown":
        output = (
            format_contract_package_markdown(
                layout,
                generation,
            )
        )
    else:
        output = (
            format_contract_package_json(
                layout,
                generation,
            )
        )

    print(output, end="")

    manifest_valid = (
        manifest.summary[
            "invalidManifestCount"
        ] == 0
        and manifest.summary[
            "unresolvedSymbolCount"
        ] == 0
        and manifest.summary[
            "duplicateSymbolCount"
        ] == 0
    )

    return (
        0
        if (
            manifest_valid
            and layout.valid
            and generation.valid
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
        ContractPackageLayoutError,
        ContractPackageGenerationError,
        RepositoryIntegrityError,
    ) as error:
        print(
            "Contract package error: "
            f"{error}",
            file=sys.stderr,
        )

        return 2


if __name__ == "__main__":
    raise SystemExit(main())
