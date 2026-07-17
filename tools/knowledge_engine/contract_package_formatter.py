from __future__ import annotations

import json

from typing import Any

from .contract_package_generator_models import (
    ContractPackageGenerationIssue,
)
from .contract_package_generator_models import (
    ContractPackageGenerationPortfolio,
)
from .contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from .contract_package_generator_models import (
    GeneratedContractPackage,
)
from .contract_package_generator_models import (
    GeneratedContractPackageFile,
)
from .contract_package_layout_models import (
    ContractPackageExportLayout,
)
from .contract_package_layout_models import (
    ContractPackageFileLayout,
)
from .contract_package_layout_models import (
    ContractPackageLayoutIssue,
)
from .contract_package_layout_models import (
    ContractPackageLayoutPortfolio,
)
from .contract_package_layout_models import (
    ContractPackageLayoutRequest,
)
from .contract_package_layout_models import (
    ContractPackageModuleLayout,
)
from .contract_package_layout_models import (
    PlannedContractPackage,
)


def _layout_request_to_dict(
    request: ContractPackageLayoutRequest,
) -> dict[str, Any]:
    return {
        "outputRoot": request.output_root,
        "packageName": request.package_name,
        "sourceStrategy": (
            request.source_strategy
        ),
    }


def _generation_request_to_dict(
    request: ContractPackageGenerationRequest,
) -> dict[str, Any]:
    return {
        "apply": request.apply,
        "overwrite": request.overwrite,
    }


def _export_to_dict(
    export: ContractPackageExportLayout,
) -> dict[str, Any]:
    return {
        "symbol": export.symbol,
        "exportKind": export.export_kind,
        "sourcePath": export.source_path,
        "moduleId": export.module_id,
    }


def _module_to_dict(
    module: ContractPackageModuleLayout,
) -> dict[str, Any]:
    return {
        "moduleId": module.module_id,
        "directoryName": (
            module.directory_name
        ),
        "entrypointPath": (
            module.entrypoint_path
        ),
        "symbolCount": (
            module.symbol_count
        ),
        "exports": [
            _export_to_dict(export)
            for export in module.exports
        ],
    }


def _planned_file_to_dict(
    file: ContractPackageFileLayout,
) -> dict[str, Any]:
    return {
        "path": file.path,
        "fileKind": file.file_kind,
    }


def _planned_package_to_dict(
    package: PlannedContractPackage,
) -> dict[str, Any]:
    return {
        "packageName": package.package_name,
        "version": package.version,
        "packageDirectory": (
            package.package_directory
        ),
        "rootEntrypointPath": (
            package.root_entrypoint_path
        ),
        "sourceStrategy": (
            package.source_strategy
        ),
        "publishable": package.publishable,
        "moduleCount": package.module_count,
        "symbolCount": package.symbol_count,
        "fileCount": package.file_count,
        "modules": [
            _module_to_dict(module)
            for module in package.modules
        ],
        "files": [
            _planned_file_to_dict(file)
            for file in package.files
        ],
    }


def _layout_issue_to_dict(
    issue: ContractPackageLayoutIssue,
) -> dict[str, Any]:
    return {
        "code": issue.code,
        "message": issue.message,
        "packageName": issue.package_name,
        "moduleId": issue.module_id,
        "symbol": issue.symbol,
        "sourcePath": issue.source_path,
    }


def contract_package_layout_to_dict(
    portfolio: ContractPackageLayoutPortfolio,
) -> dict[str, Any]:
    return {
        "schemaVersion": (
            portfolio.schema_version
        ),
        "request": _layout_request_to_dict(
            portfolio.request
        ),
        "packages": [
            _planned_package_to_dict(package)
            for package in portfolio.packages
        ],
        "issues": [
            _layout_issue_to_dict(issue)
            for issue in portfolio.issues
        ],
        "summary": dict(
            portfolio.summary
        ),
        "valid": portfolio.valid,
    }


def _generated_file_to_dict(
    file: GeneratedContractPackageFile,
) -> dict[str, Any]:
    return {
        "path": file.path,
        "fileKind": file.file_kind,
        "sha256": file.sha256,
        "sizeBytes": file.size_bytes,
        "written": file.written,
    }


def _generated_package_to_dict(
    package: GeneratedContractPackage,
) -> dict[str, Any]:
    return {
        "packageName": package.package_name,
        "version": package.version,
        "packageDirectory": (
            package.package_directory
        ),
        "sourceStrategy": (
            package.source_strategy
        ),
        "publishable": package.publishable,
        "fileCount": package.file_count,
        "writtenFileCount": (
            package.written_file_count
        ),
        "files": [
            _generated_file_to_dict(file)
            for file in package.files
        ],
        "valid": package.valid,
    }


def _generation_issue_to_dict(
    issue: ContractPackageGenerationIssue,
) -> dict[str, Any]:
    return {
        "code": issue.code,
        "message": issue.message,
        "packageName": issue.package_name,
        "path": issue.path,
    }


def contract_package_generation_to_dict(
    portfolio: ContractPackageGenerationPortfolio,
) -> dict[str, Any]:
    return {
        "schemaVersion": (
            portfolio.schema_version
        ),
        "request": (
            _generation_request_to_dict(
                portfolio.request
            )
        ),
        "packages": [
            _generated_package_to_dict(package)
            for package in portfolio.packages
        ],
        "issues": [
            _generation_issue_to_dict(issue)
            for issue in portfolio.issues
        ],
        "summary": dict(
            portfolio.summary
        ),
        "valid": portfolio.valid,
    }


def contract_package_report_to_dict(
    layout: ContractPackageLayoutPortfolio,
    generation: (
        ContractPackageGenerationPortfolio
    ),
) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "layout": (
            contract_package_layout_to_dict(
                layout
            )
        ),
        "generation": (
            contract_package_generation_to_dict(
                generation
            )
        ),
        "summary": {
            "packageCount": (
                generation.summary[
                    "packageCount"
                ]
            ),
            "moduleCount": (
                layout.summary[
                    "moduleCount"
                ]
            ),
            "symbolCount": (
                layout.summary[
                    "symbolCount"
                ]
            ),
            "fileCount": (
                generation.summary[
                    "fileCount"
                ]
            ),
            "writtenFileCount": (
                generation.summary[
                    "writtenFileCount"
                ]
            ),
            "layoutIssueCount": len(
                layout.issues
            ),
            "generationIssueCount": len(
                generation.issues
            ),
            "valid": (
                layout.valid
                and generation.valid
            ),
        },
    }


def format_contract_package_json(
    layout: ContractPackageLayoutPortfolio,
    generation: (
        ContractPackageGenerationPortfolio
    ),
) -> str:
    return json.dumps(
        contract_package_report_to_dict(
            layout,
            generation,
        ),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_contract_package_markdown(
    layout: ContractPackageLayoutPortfolio,
    generation: (
        ContractPackageGenerationPortfolio
    ),
) -> str:
    report = contract_package_report_to_dict(
        layout,
        generation,
    )

    summary = report["summary"]

    lines = [
        "# PropertyOS Contract Package Report",
        "",
        "## Summary",
        "",
        (
            f"- Packages: "
            f"`{summary['packageCount']}`"
        ),
        (
            f"- Modules: "
            f"`{summary['moduleCount']}`"
        ),
        (
            f"- Symbols: "
            f"`{summary['symbolCount']}`"
        ),
        (
            f"- Files: "
            f"`{summary['fileCount']}`"
        ),
        (
            f"- Written files: "
            f"`{summary['writtenFileCount']}`"
        ),
        (
            f"- Layout issues: "
            f"`{summary['layoutIssueCount']}`"
        ),
        (
            f"- Generation issues: "
            f"`{summary['generationIssueCount']}`"
        ),
        (
            f"- Valid: "
            f"`{str(summary['valid']).lower()}`"
        ),
    ]

    generated_by_name = {
        package.package_name: package
        for package in generation.packages
    }

    for package in layout.packages:
        generated = generated_by_name.get(
            package.package_name
        )

        written_file_count = (
            generated.written_file_count
            if generated is not None
            else 0
        )

        package_valid = (
            generated.valid
            if generated is not None
            else False
        )

        lines.extend(
            [
                "",
                (
                    f"## Package: "
                    f"{package.package_name}"
                ),
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Version | "
                    f"`{package.version}` |"
                ),
                (
                    f"| Directory | "
                    f"`{package.package_directory}` |"
                ),
                (
                    f"| Source strategy | "
                    f"`{package.source_strategy}` |"
                ),
                (
                    f"| Publishable | "
                    f"`{str(package.publishable).lower()}` |"
                ),
                (
                    f"| Modules | "
                    f"`{package.module_count}` |"
                ),
                (
                    f"| Symbols | "
                    f"`{package.symbol_count}` |"
                ),
                (
                    f"| Files | "
                    f"`{package.file_count}` |"
                ),
                (
                    f"| Written files | "
                    f"`{written_file_count}` |"
                ),
                (
                    f"| Valid | "
                    f"`{str(package_valid).lower()}` |"
                ),
                "",
                "### Modules",
                "",
                (
                    "| Module | Entrypoint | "
                    "Symbols |"
                ),
                "|---|---|---|",
            ]
        )

        for module in package.modules:
            lines.append(
                "| "
                f"`{module.module_id}` | "
                f"`{module.entrypoint_path}` | "
                f"`{module.symbol_count}` |"
            )

        if generated is not None:
            lines.extend(
                [
                    "",
                    "### Generated Files",
                    "",
                    (
                        "| File | Kind | SHA256 | "
                        "Bytes | Written |"
                    ),
                    "|---|---|---|---|---|",
                ]
            )

            for file in generated.files:
                lines.append(
                    "| "
                    f"`{file.path}` | "
                    f"`{file.file_kind}` | "
                    f"`{file.sha256}` | "
                    f"`{file.size_bytes}` | "
                    f"`{str(file.written).lower()}` |"
                )

    if layout.issues:
        lines.extend(
            [
                "",
                "## Layout Issues",
                "",
                (
                    "| Code | Package | Module | "
                    "Symbol | Source | Message |"
                ),
                "|---|---|---|---|---|---|",
            ]
        )

        for issue in layout.issues:
            lines.append(
                "| "
                f"`{issue.code}` | "
                f"`{issue.package_name}` | "
                f"`{issue.module_id}` | "
                f"`{issue.symbol}` | "
                f"`{issue.source_path}` | "
                f"{issue.message} |"
            )

    if generation.issues:
        lines.extend(
            [
                "",
                "## Generation Issues",
                "",
                (
                    "| Code | Package | Path | "
                    "Message |"
                ),
                "|---|---|---|---|",
            ]
        )

        for issue in generation.issues:
            lines.append(
                "| "
                f"`{issue.code}` | "
                f"`{issue.package_name}` | "
                f"`{issue.path}` | "
                f"{issue.message} |"
            )

    return "\n".join(lines) + "\n"
