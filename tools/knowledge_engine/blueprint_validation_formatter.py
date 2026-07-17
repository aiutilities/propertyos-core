from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .blueprint_validation_models import (
    BlueprintValidationPortfolio,
)


def validation_to_dict(
    portfolio: BlueprintValidationPortfolio,
) -> dict[str, Any]:
    value = asdict(portfolio)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    request = value["request"]

    request["moduleId"] = request.pop(
        "module_id"
    )

    for result in value["results"]:
        result["moduleId"] = result.pop(
            "module_id"
        )

        result["sourceFileCount"] = (
            result.pop(
                "source_file_count"
            )
        )

        result["targetFileCount"] = (
            result.pop(
                "target_file_count"
            )
        )

        result["contractCount"] = (
            result.pop(
                "contract_count"
            )
        )

        result["dependentUpdateCount"] = (
            result.pop(
                "dependent_update_count"
            )
        )

        for issue in result["issues"]:
            issue["moduleId"] = issue.pop(
                "module_id"
            )

            issue["sourcePath"] = issue.pop(
                "source_path"
            )

            issue["targetPath"] = issue.pop(
                "target_path"
            )

        for operation in (
            result["operations"]
        ):
            operation["moduleId"] = (
                operation.pop(
                    "module_id"
                )
            )

            operation["sourcePath"] = (
                operation.pop(
                    "source_path"
                )
            )

            operation["targetPath"] = (
                operation.pop(
                    "target_path"
                )
            )

            operation["fileKind"] = (
                operation.pop(
                    "file_kind"
                )
            )

    return value


def format_validation_json(
    portfolio: BlueprintValidationPortfolio,
) -> str:
    return json.dumps(
        validation_to_dict(portfolio),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_validation_markdown(
    portfolio: BlueprintValidationPortfolio,
) -> str:
    lines = [
        "# PropertyOS Blueprint Validation",
        "",
        (
            f"**Overall status:** "
            f"`{'PASS' if portfolio.valid else 'FAIL'}`"
        ),
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

    for result in portfolio.results:
        lines.extend(
            [
                "",
                (
                    f"## Module: "
                    f"{result.module_id}"
                ),
                "",
                (
                    f"**Status:** "
                    f"`{'PASS' if result.valid else 'FAIL'}`"
                ),
                "",
                "| Metric | Count |",
                "|---|---:|",
                (
                    "| Source files | "
                    f"{result.source_file_count} |"
                ),
                (
                    "| Target files | "
                    f"{result.target_file_count} |"
                ),
                (
                    "| Contracts | "
                    f"{result.contract_count} |"
                ),
                (
                    "| Dependent updates | "
                    f"{result.dependent_update_count} |"
                ),
                "",
                "### Issues",
                "",
            ]
        )

        if result.issues:
            lines.extend(
                [
                    (
                        "| Severity | Code | "
                        "Message | Source | Target |"
                    ),
                    "|---|---|---|---|---|",
                ]
            )

            for issue in result.issues:
                lines.append(
                    "| "
                    f"`{issue.severity}` | "
                    f"`{issue.code}` | "
                    f"{issue.message} | "
                    f"`{issue.source_path}` | "
                    f"`{issue.target_path}` |"
                )
        else:
            lines.append(
                "_No validation issues._"
            )

        lines.extend(
            [
                "",
                "### Dry-Run Operations",
                "",
                (
                    "| # | Action | Kind | "
                    "Source | Target | Executable |"
                ),
                "|---:|---|---|---|---|---|",
            ]
        )

        for operation in (
            result.operations
        ):
            lines.append(
                "| "
                f"{operation.sequence} | "
                f"`{operation.action}` | "
                f"`{operation.file_kind}` | "
                f"`{operation.source_path}` | "
                f"`{operation.target_path}` | "
                f"`{'yes' if operation.executable else 'no'}` |"
            )

    return "\n".join(lines) + "\n"
