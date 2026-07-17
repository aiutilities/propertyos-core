from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .import_analysis_models import (
    ImportAnalysisPortfolio,
)


def import_analysis_to_dict(
    portfolio: ImportAnalysisPortfolio,
) -> dict[str, Any]:
    value = asdict(portfolio)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    request = value["request"]

    request["moduleId"] = request.pop(
        "module_id"
    )

    for analysis in value["analyses"]:
        analysis["moduleId"] = (
            analysis.pop(
                "module_id"
            )
        )

        analysis["pluginId"] = (
            analysis.pop(
                "plugin_id"
            )
        )

        analysis["workspacePath"] = (
            analysis.pop(
                "workspace_path"
            )
        )

        analysis["sourceFileCount"] = (
            analysis.pop(
                "source_file_count"
            )
        )

        analysis["importCount"] = (
            analysis.pop(
                "import_count"
            )
        )

        analysis["rewriteCount"] = (
            analysis.pop(
                "rewrite_count"
            )
        )

        analysis["unresolvedCount"] = (
            analysis.pop(
                "unresolved_count"
            )
        )

        for file in analysis["files"]:
            file["stagedPath"] = (
                file.pop(
                    "staged_path"
                )
            )

            file["importCount"] = (
                file.pop(
                    "import_count"
                )
            )

            file["rewriteCount"] = (
                file.pop(
                    "rewrite_count"
                )
            )

            file["unresolvedCount"] = (
                file.pop(
                    "unresolved_count"
                )
            )

            for reference in (
                file["imports"]
            ):
                reference["sourceFile"] = (
                    reference.pop(
                        "source_file"
                    )
                )

                reference[
                    "importedSymbols"
                ] = reference.pop(
                    "imported_symbols"
                )

                reference[
                    "originalSpecifier"
                ] = reference.pop(
                    "original_specifier"
                )

                reference[
                    "resolutionStatus"
                ] = reference.pop(
                    "resolution_status"
                )

                reference["resolvedPath"] = (
                    reference.pop(
                        "resolved_path"
                    )
                )

                reference["targetModule"] = (
                    reference.pop(
                        "target_module"
                    )
                )

                reference[
                    "proposedSpecifier"
                ] = reference.pop(
                    "proposed_specifier"
                )

                reference[
                    "rewriteRequired"
                ] = reference.pop(
                    "rewrite_required"
                )

    return value


def format_import_analysis_json(
    portfolio: ImportAnalysisPortfolio,
) -> str:
    return json.dumps(
        import_analysis_to_dict(
            portfolio
        ),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_import_analysis_markdown(
    portfolio: ImportAnalysisPortfolio,
) -> str:
    lines = [
        "# PropertyOS Staged Import Analysis",
        "",
        "## Summary",
        "",
    ]

    for key, value in (
        portfolio.summary.items()
    ):
        lines.append(
            f"- {key}: `{value}`"
        )

    for analysis in portfolio.analyses:
        lines.extend(
            [
                "",
                (
                    f"## Plugin: "
                    f"{analysis.plugin_id}"
                ),
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Module | "
                    f"`{analysis.module_id}` |"
                ),
                (
                    f"| Workspace | "
                    f"`{analysis.workspace_path}` |"
                ),
                (
                    f"| Source files | "
                    f"`{analysis.source_file_count}` |"
                ),
                (
                    f"| Imports | "
                    f"`{analysis.import_count}` |"
                ),
                (
                    f"| Rewrites required | "
                    f"`{analysis.rewrite_count}` |"
                ),
                (
                    f"| Unresolved | "
                    f"`{analysis.unresolved_count}` |"
                ),
                (
                    f"| Valid | "
                    f"`{str(analysis.valid).lower()}` |"
                ),
            ]
        )

        if analysis.warnings:
            lines.extend(
                [
                    "",
                    "### Warnings",
                    "",
                ]
            )

            for warning in (
                analysis.warnings
            ):
                lines.append(
                    f"- {warning}"
                )

        for file in analysis.files:
            lines.extend(
                [
                    "",
                    (
                        f"### File: "
                        f"{file.staged_path}"
                    ),
                    "",
                    (
                        "| Line | Syntax | "
                        "Original | Classification | "
                        "Status | Proposed | Rewrite |"
                    ),
                    (
                        "|---:|---|---|---|---|---|---|"
                    ),
                ]
            )

            if not file.imports:
                lines.append(
                    "| - | - | _No imports_ | "
                    "- | - | - | - |"
                )

            for reference in file.imports:
                lines.append(
                    "| "
                    f"{reference.line} | "
                    f"`{reference.syntax}` | "
                    f"`{reference.original_specifier}` | "
                    f"`{reference.classification}` | "
                    f"`{reference.resolution_status}` | "
                    f"`{reference.proposed_specifier}` | "
                    f"`{'yes' if reference.rewrite_required else 'no'}` |"
                )

    return "\n".join(lines) + "\n"
