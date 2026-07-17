from __future__ import annotations

import json

from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosurePortfolio,
)


def format_json(
    portfolio: DependencyClosurePortfolio,
) -> str:
    return (
        json.dumps(
            portfolio.to_dict(),
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )


def format_markdown(
    portfolio: DependencyClosurePortfolio,
) -> str:
    lines: list[str] = [
        "# PropertyOS Transitive Source Dependency Closure",
        "",
        "## Summary",
        "",
        (
            f"- pluginCount: "
            f"`{portfolio.plugin_count}`"
        ),
        (
            f"- seedFileCount: "
            f"`{portfolio.seed_file_count}`"
        ),
        (
            f"- closureFileCount: "
            f"`{portfolio.closure_file_count}`"
        ),
        (
            f"- addedFileCount: "
            f"`{portfolio.added_file_count}`"
        ),
        (
            f"- externalDependencyCount: "
            f"`{portfolio.external_dependency_count}`"
        ),
        (
            f"- validPluginCount: "
            f"`{portfolio.valid_plugin_count}`"
        ),
        (
            f"- invalidPluginCount: "
            f"`{portfolio.invalid_plugin_count}`"
        ),
        "",
    ]

    for analysis in portfolio.analyses:
        lines.extend(
            [
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
                    f"| Package | "
                    f"`{analysis.package_name}` |"
                ),
                (
                    f"| Module root | "
                    f"`{analysis.module_root}` |"
                ),
                (
                    f"| Workspace | "
                    f"`{analysis.workspace}` |"
                ),
                (
                    f"| Seed files | "
                    f"`{analysis.seed_file_count}` |"
                ),
                (
                    f"| Closure files | "
                    f"`{analysis.closure_file_count}` |"
                ),
                (
                    f"| Added files | "
                    f"`{analysis.added_file_count}` |"
                ),
                (
                    f"| External dependencies | "
                    f"`{analysis.external_dependency_count}` |"
                ),
                (
                    f"| Maximum depth | "
                    f"`{analysis.maximum_depth}` |"
                ),
                (
                    f"| Applied | "
                    f"`{str(analysis.applied).lower()}` |"
                ),
                (
                    f"| Valid | "
                    f"`{str(analysis.valid).lower()}` |"
                ),
                "",
                "### Module-Owned Dependencies",
                "",
                (
                    "| Depth | Source | Import | "
                    "Resolved | Staged target |"
                ),
                "|---:|---|---|---|---|",
            ]
        )

        for item in analysis.dependencies:
            lines.append(
                (
                    f"| `{item.depth}` "
                    f"| `{item.source_file}` "
                    f"| `{item.import_specifier}` "
                    f"| `{item.resolved_source}` "
                    f"| `{item.staged_target}` |"
                )
            )

        lines.extend(
            [
                "",
                "### External Dependencies",
                "",
                (
                    "| Classification | "
                    "Source | Import |"
                ),
                "|---|---|---|",
            ]
        )

        for item in (
            analysis.external_dependencies
        ):
            lines.append(
                (
                    f"| `{item.classification}` "
                    f"| `{item.source_file}` "
                    f"| `{item.import_specifier}` |"
                )
            )

        lines.append("")

    return "\n".join(lines).rstrip() + "\n"
