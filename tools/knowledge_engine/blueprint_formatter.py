from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .blueprint_models import (
    BlueprintPortfolio,
)


def blueprint_to_dict(
    portfolio: BlueprintPortfolio,
) -> dict[str, Any]:
    value = asdict(portfolio)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    value["generationOrder"] = value.pop(
        "generation_order"
    )

    request = value["request"]

    request["moduleId"] = request.pop(
        "module_id"
    )

    blueprints = []

    for blueprint in value["blueprints"]:
        blueprint["moduleId"] = (
            blueprint.pop("module_id")
        )

        blueprint["pluginId"] = (
            blueprint.pop("plugin_id")
        )

        blueprint["packageName"] = (
            blueprint.pop(
                "package_name"
            )
        )

        blueprint["sourceRoot"] = (
            blueprint.pop("source_root")
        )

        blueprint["targetRoot"] = (
            blueprint.pop("target_root")
        )

        blueprint["migrationTier"] = (
            blueprint.pop(
                "migration_tier"
            )
        )

        blueprint["migrationScore"] = (
            blueprint.pop(
                "migration_score"
            )
        )

        blueprint["dependentUpdates"] = (
            blueprint.pop(
                "dependent_updates"
            )
        )

        blueprint["validationCommands"] = (
            blueprint.pop(
                "validation_commands"
            )
        )

        for file in blueprint["files"]:
            file["sourcePath"] = (
                file.pop("source_path")
            )

            file["targetPath"] = (
                file.pop("target_path")
            )

            file["fileKind"] = (
                file.pop("file_kind")
            )

            file["className"] = (
                file.pop("class_name")
            )

        for contract in (
            blueprint["contracts"]
        ):
            contract["contractType"] = (
                contract.pop(
                    "contract_type"
                )
            )

            contract["sourceModule"] = (
                contract.pop(
                    "source_module"
                )
            )

            contract["targetPackage"] = (
                contract.pop(
                    "target_package"
                )
            )

        blueprints.append(blueprint)

    value["blueprints"] = blueprints

    return value


def format_blueprint_json(
    portfolio: BlueprintPortfolio,
) -> str:
    return json.dumps(
        blueprint_to_dict(portfolio),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_blueprint_markdown(
    portfolio: BlueprintPortfolio,
) -> str:
    lines = [
        "# PropertyOS Plugin Extraction Blueprint",
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

    lines.extend(
        [
            "",
            "## Generation Order",
            "",
        ]
    )

    for index, module_id in enumerate(
        portfolio.generation_order,
        start=1,
    ):
        lines.append(
            f"{index}. `{module_id}`"
        )

    if portfolio.warnings:
        lines.extend(
            [
                "",
                "## Portfolio Warnings",
                "",
            ]
        )

        for warning in portfolio.warnings:
            lines.append(
                f"- {warning}"
            )

    for blueprint in (
        portfolio.blueprints
    ):
        lines.extend(
            [
                "",
                (
                    f"## Module: "
                    f"{blueprint.module_id}"
                ),
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Plugin ID | "
                    f"`{blueprint.plugin_id}` |"
                ),
                (
                    f"| Package | "
                    f"`{blueprint.package_name}` |"
                ),
                (
                    f"| Target root | "
                    f"`{blueprint.target_root}` |"
                ),
                (
                    f"| Migration tier | "
                    f"`{blueprint.migration_tier}` |"
                ),
                (
                    f"| Migration score | "
                    f"`{blueprint.migration_score}` |"
                ),
                "",
                "### Planned Files",
                "",
                (
                    "| Kind | Source | Target | "
                    "Class |"
                ),
                "|---|---|---|---|",
            ]
        )

        for file in blueprint.files:
            lines.append(
                "| "
                f"`{file.file_kind}` | "
                f"`{file.source_path}` | "
                f"`{file.target_path}` | "
                f"`{file.class_name}` |"
            )

        lines.extend(
            [
                "",
                "### Required Contracts",
                "",
                (
                    "| Type | Source module | "
                    "Contract | Target package |"
                ),
                "|---|---|---|---|",
            ]
        )

        for contract in (
            blueprint.contracts
        ):
            lines.append(
                "| "
                f"`{contract.contract_type}` | "
                f"`{contract.source_module}` | "
                f"`{contract.name}` | "
                f"`{contract.target_package}` |"
            )

        lines.extend(
            [
                "",
                "### Dependent Files to Review",
                "",
            ]
        )

        if blueprint.dependent_updates:
            for path in (
                blueprint.dependent_updates
            ):
                lines.append(
                    f"- `{path}`"
                )
        else:
            lines.append(
                "_No direct dependent module "
                "files detected._"
            )

        lines.extend(
            [
                "",
                "### Validation Commands",
                "",
            ]
        )

        for command in (
            blueprint.validation_commands
        ):
            lines.extend(
                [
                    "```bash",
                    command,
                    "```",
                    "",
                ]
            )

        if blueprint.warnings:
            lines.extend(
                [
                    "### Warnings",
                    "",
                ]
            )

            for warning in (
                blueprint.warnings
            ):
                lines.append(
                    f"- {warning}"
                )

    return "\n".join(lines) + "\n"
