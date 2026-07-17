from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .materialization_models import (
    MaterializationPortfolio,
)


def materialization_to_dict(
    portfolio: MaterializationPortfolio,
) -> dict[str, Any]:
    value = asdict(portfolio)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    value["outputRoot"] = value.pop(
        "output_root"
    )

    request = value["request"]

    request["moduleId"] = request.pop(
        "module_id"
    )

    for plugin in value["plugins"]:
        plugin["moduleId"] = plugin.pop(
            "module_id"
        )

        plugin["pluginId"] = plugin.pop(
            "plugin_id"
        )

        plugin["packageName"] = plugin.pop(
            "package_name"
        )

        plugin["workspacePath"] = (
            plugin.pop(
                "workspace_path"
            )
        )

        plugin["copiedFileCount"] = (
            plugin.pop(
                "copied_file_count"
            )
        )

        plugin["generatedFileCount"] = (
            plugin.pop(
                "generated_file_count"
            )
        )

        plugin["totalFileCount"] = (
            plugin.pop(
                "total_file_count"
            )
        )

        plugin["workspaceSha256"] = (
            plugin.pop(
                "workspace_sha256"
            )
        )

        plugin["copiedFiles"] = (
            plugin.pop(
                "copied_files"
            )
        )

        plugin["generatedFiles"] = (
            plugin.pop(
                "generated_files"
            )
        )

        for collection_name in (
            "copiedFiles",
            "generatedFiles",
        ):
            for file in plugin[
                collection_name
            ]:
                file["sourcePath"] = (
                    file.pop(
                        "source_path"
                    )
                )

                file["stagedPath"] = (
                    file.pop(
                        "staged_path"
                    )
                )

                file["fileKind"] = (
                    file.pop(
                        "file_kind"
                    )
                )

                file["sourceSha256"] = (
                    file.pop(
                        "source_sha256"
                    )
                )

                file["stagedSha256"] = (
                    file.pop(
                        "staged_sha256"
                    )
                )

                file["sizeBytes"] = (
                    file.pop(
                        "size_bytes"
                    )
                )

    return value


def format_materialization_json(
    portfolio: MaterializationPortfolio,
) -> str:
    return json.dumps(
        materialization_to_dict(
            portfolio
        ),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_materialization_markdown(
    portfolio: MaterializationPortfolio,
) -> str:
    lines = [
        "# PropertyOS Staged Plugin Materialization",
        "",
        f"**Output root:** `{portfolio.output_root}`",
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

    for plugin in portfolio.plugins:
        lines.extend(
            [
                "",
                (
                    f"## Plugin: "
                    f"{plugin.plugin_id}"
                ),
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Module | "
                    f"`{plugin.module_id}` |"
                ),
                (
                    f"| Package | "
                    f"`{plugin.package_name}` |"
                ),
                (
                    f"| Workspace | "
                    f"`{plugin.workspace_path}` |"
                ),
                (
                    f"| Copied files | "
                    f"`{plugin.copied_file_count}` |"
                ),
                (
                    f"| Generated files | "
                    f"`{plugin.generated_file_count}` |"
                ),
                (
                    f"| Total files | "
                    f"`{plugin.total_file_count}` |"
                ),
                (
                    f"| Workspace SHA-256 | "
                    f"`{plugin.workspace_sha256}` |"
                ),
                (
                    f"| Valid | "
                    f"`{str(plugin.valid).lower()}` |"
                ),
                "",
                "### Copied Files",
                "",
                (
                    "| Kind | Source | Staged | "
                    "SHA-256 |"
                ),
                "|---|---|---|---|",
            ]
        )

        for file in plugin.copied_files:
            lines.append(
                "| "
                f"`{file.file_kind}` | "
                f"`{file.source_path}` | "
                f"`{file.staged_path}` | "
                f"`{file.staged_sha256}` |"
            )

        lines.extend(
            [
                "",
                "### Generated Files",
                "",
                "| Staged | SHA-256 |",
                "|---|---|",
            ]
        )

        for file in (
            plugin.generated_files
        ):
            lines.append(
                "| "
                f"`{file.staged_path}` | "
                f"`{file.staged_sha256}` |"
            )

    return "\n".join(lines) + "\n"
