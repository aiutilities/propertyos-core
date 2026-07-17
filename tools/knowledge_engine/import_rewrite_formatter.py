from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .import_rewrite_models import (
    ImportRewritePortfolio,
)


def import_rewrite_to_dict(
    portfolio: ImportRewritePortfolio,
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
            analysis.pop("module_id")
        )

        analysis["pluginId"] = (
            analysis.pop("plugin_id")
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

        analysis[
            "plannedRewriteCount"
        ] = analysis.pop(
            "planned_rewrite_count"
        )

        analysis[
            "appliedRewriteCount"
        ] = analysis.pop(
            "applied_rewrite_count"
        )

        analysis[
            "modifiedFileCount"
        ] = analysis.pop(
            "modified_file_count"
        )

        analysis["unresolvedCount"] = (
            analysis.pop(
                "unresolved_count"
            )
        )

        analysis[
            "remainingRewriteCount"
        ] = analysis.pop(
            "remaining_rewrite_count"
        )

        for file in analysis["files"]:
            file["stagedPath"] = (
                file.pop("staged_path")
            )

            file[
                "plannedRewriteCount"
            ] = file.pop(
                "planned_rewrite_count"
            )

            file[
                "appliedRewriteCount"
            ] = file.pop(
                "applied_rewrite_count"
            )

            for change in file["changes"]:
                change["sourceFile"] = (
                    change.pop(
                        "source_file"
                    )
                )

                change[
                    "originalSpecifier"
                ] = change.pop(
                    "original_specifier"
                )

                change[
                    "proposedSpecifier"
                ] = change.pop(
                    "proposed_specifier"
                )

                change["targetModule"] = (
                    change.pop(
                        "target_module"
                    )
                )

    return value


def format_import_rewrite_json(
    portfolio: ImportRewritePortfolio,
) -> str:
    return json.dumps(
        import_rewrite_to_dict(
            portfolio
        ),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_import_rewrite_markdown(
    portfolio: ImportRewritePortfolio,
) -> str:
    lines = [
        "# PropertyOS Staged Import Rewrite",
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
                    "| Module | "
                    f"`{analysis.module_id}` |"
                ),
                (
                    "| Workspace | "
                    f"`{analysis.workspace_path}` |"
                ),
                (
                    "| Planned rewrites | "
                    f"`{analysis.planned_rewrite_count}` |"
                ),
                (
                    "| Applied rewrites | "
                    f"`{analysis.applied_rewrite_count}` |"
                ),
                (
                    "| Modified files | "
                    f"`{analysis.modified_file_count}` |"
                ),
                (
                    "| Remaining rewrites | "
                    f"`{analysis.remaining_rewrite_count}` |"
                ),
                (
                    "| Valid | "
                    f"`{str(analysis.valid).lower()}` |"
                ),
            ]
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
                        "| Line | Original | "
                        "Proposed | Target | Applied |"
                    ),
                    (
                        "|---:|---|---|---|---|"
                    ),
                ]
            )

            for change in file.changes:
                lines.append(
                    "| "
                    f"{change.line} | "
                    f"`{change.original_specifier}` | "
                    f"`{change.proposed_specifier}` | "
                    f"`{change.target_module}` | "
                    f"`{str(change.applied).lower()}` |"
                )

    return "\n".join(lines) + "\n"
